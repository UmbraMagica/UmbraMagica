import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Edit3, Save, X, BookOpen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  longDescription?: string;
  isPublic: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  roomId: number;
  characterId: number;
  content: string;
  messageType: string;
  createdAt: string;
  character: {
    firstName: string;
    middleName?: string | null;
    lastName: string;
  };
}

export default function ChatRoom() {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  
  const currentRoomId = roomId ? parseInt(roomId) : null;

  // Safety check for user data
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Přihlášení vyžadováno</h2>
          <p className="text-muted-foreground">Pro přístup do chatu se musíte přihlásit.</p>
        </div>
      </div>
    );
  }

  // Safety check for character data
  const currentCharacter = user?.characters?.[0];
  if (!currentCharacter?.firstName || !currentCharacter?.lastName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Postava nenalezena</h2>
          <p className="text-muted-foreground">Pro přístup do chatu potřebujete aktivní postavu.</p>
        </div>
      </div>
    );
  }

  // Fetch current room info
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
  });

  const currentRoom = rooms.find(room => room.id === currentRoomId);

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", currentRoomId, "messages"],
    queryFn: () =>
      fetch(`/api/chat/rooms/${currentRoomId}/messages`).then(res => res.json()),
    enabled: !!currentRoomId,
    refetchInterval: 5000,
  });

  // Update local messages when server messages change
  useEffect(() => {
    if (messages.length > 0) {
      console.log("Messages data:", messages);
      console.log("Messages loading:", messagesLoading);
      console.log("Messages error:", null);
      console.log("Current room ID:", currentRoomId);
      
      // Sort messages by creation date (newest first for display)
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setLocalMessages(sortedMessages);
    }
  }, [messages, messagesLoading, currentRoomId]);

  // WebSocket connection
  useEffect(() => {
    if (!currentRoomId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket připojen");
      setIsConnected(true);
      socket.send(JSON.stringify({
        type: 'join',
        roomId: currentRoomId,
        userId: user.id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message' && data.roomId === currentRoomId) {
        setLocalMessages(prev => [data.message, ...prev]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket odpojen");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket chyba:", error);
      setIsConnected(false);
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [currentRoomId, user]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentCharacter || !currentRoomId) return;

    try {
      const messageData = {
        roomId: currentRoomId,
        characterId: currentCharacter.id,
        content: messageInput.trim(),
        messageType: 'text'
      };

      await apiRequest("POST", "/api/chat/messages", messageData);
      setMessageInput("");
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odeslat zprávu.",
        variant: "destructive",
      });
    }
  };

  const handleDiceRoll = async () => {
    if (!currentCharacter || !currentRoomId) return;

    try {
      await apiRequest("POST", "/api/game/dice-roll", {
        roomId: currentRoomId,
        characterId: currentCharacter.id
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se hodit kostkou.",
        variant: "destructive",
      });
    }
  };

  const handleCoinFlip = async () => {
    if (!currentCharacter || !currentRoomId) return;

    try {
      await apiRequest("POST", "/api/game/coin-flip", {
        roomId: currentRoomId,
        characterId: currentCharacter.id
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se hodit mincí.",
        variant: "destructive",
      });
    }
  };

  const getCharacterInitials = (character: { firstName: string; lastName: string }) => {
    return `${character.firstName.charAt(0)}${character.lastName.charAt(0)}`;
  };

  const getCurrentUserInitials = () => {
    return `${currentCharacter.firstName.charAt(0)}${currentCharacter.lastName.charAt(0)}`;
  };

  const handleEditDescription = () => {
    setEditedDescription(currentRoom?.longDescription || "");
    setIsEditingDescription(true);
  };

  const handleEditName = () => {
    setEditedName(currentRoom?.name || "");
    setIsEditingName(true);
  };

  const handleSaveDescription = async () => {
    if (!currentRoom) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/chat/rooms/${currentRoom.id}`, {
        longDescription: editedDescription
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      
      setIsEditingDescription(false);
      toast({
        title: "Úspěch",
        description: "Popis místnosti byl aktualizován.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat popis místnosti.",
        variant: "destructive",
      });
    }
  };

  const handleSaveName = async () => {
    if (!currentRoom) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/chat/rooms/${currentRoom.id}`, {
        name: editedName
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      
      setIsEditingName(false);
      toast({
        title: "Úspěch",
        description: "Název místnosti byl aktualizován.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat název místnosti.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
    setIsEditingName(false);
    setEditedName("");
  };

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Místnost nenalezena</h2>
          <p className="text-muted-foreground">Požadovaná chatovací místnost neexistuje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-none border-b bg-card p-4 z-10 h-[84px] flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/chat')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Opustit chat
              </Button>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-xl font-bold"
                      placeholder="Název místnosti"
                    />
                    <Button
                      onClick={handleSaveName}
                      variant="default"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{currentRoom.name}</h1>
                      {currentRoom.description && (
                        <p className="text-sm text-muted-foreground mt-1">{currentRoom.description}</p>
                      )}
                    </div>
                    {user?.role === 'admin' && (
                      <Button
                        onClick={handleEditName}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 opacity-70 hover:opacity-100"
                        title="Upravit název místnosti"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Připojeno' : 'Odpojeno'}
              </span>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {localMessages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/10">
                  {getCharacterInitials(message.character)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.character.firstName} {message.character.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString('cs-CZ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex-none border-t bg-card p-4">
          <div className="flex items-end gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback className="bg-primary/10">
                {getCurrentUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Napište zprávu..."
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                maxLength={5000}
              />
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleDiceRoll}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                    title="Hodit kostkou (1d10)"
                  >
                    🎲 Kostka
                  </Button>
                  <Button
                    onClick={handleCoinFlip}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                    title="Hodit mincí (1d2)"
                  >
                    🪙 Mince
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {messageInput.length}/5000
                  </span>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || messageInput.length < 1 || messageInput.length > 5000}
                    size="sm"
                  >
                    Odeslat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Room Description */}
      {(currentRoom.longDescription || user?.role === 'admin') && (
        <div className="w-80 border-l bg-muted/30 flex flex-col">
          {/* Panel Header - matches main header */}
          <div className="flex-none p-4 border-b bg-card h-[84px] flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">Popis místnosti</span>
              </div>
              {user?.role === 'admin' && (
                <div className="flex gap-2">
                  {isEditingDescription ? (
                    <>
                      <Button
                        onClick={handleSaveDescription}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Save className="h-4 w-4" />
                        Uložit
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <X className="h-4 w-4" />
                        Zrušit
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleEditDescription}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-4 w-4" />
                      Upravit
                    </Button>
                  )}
                </div>
              )}
          </div>

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {isEditingDescription ? (
              <div className="space-y-3">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Zadejte popis místnosti..."
                  className="min-h-64 text-sm w-full resize-none"
                  rows={12}
                />
                <div className="text-xs text-muted-foreground border-t pt-2">
                  <div className="font-medium mb-1">Formátování:</div>
                  <div>**tučné** → <strong>tučné</strong></div>
                  <div>*kurzíva* → <em>kurzíva</em></div>
                  <div>__podtržené__ → <u>podtržené</u></div>
                </div>
              </div>
            ) : (
              <div 
                className="text-sm text-muted-foreground whitespace-pre-line prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-em:text-muted-foreground prose-u:text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: currentRoom.longDescription 
                    ? currentRoom.longDescription
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/__(.*?)__/g, '<u>$1</u>')
                    : (user?.role === 'admin' ? "Žádný popis místnosti. Klikněte na upravit pro přidání popisu." : "")
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
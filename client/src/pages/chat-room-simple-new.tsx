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
import { Link } from "wouter";
import { ArrowLeft, Edit3, Save, X, BookOpen, Download, Archive, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RoomDescription } from "@/components/RoomDescription";
import { RoomPresence } from "@/components/RoomPresence";

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
  const [presentCharacters, setPresentCharacters] = useState<Array<{
    id: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;
  }>>([]);
  
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

  // Fetch user's characters for switching (only alive characters)
  const { data: allUserCharacters = [] } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Filter only alive characters (not in cemetery)
  const userCharacters = allUserCharacters.filter((char: any) => !char.deathDate);

  // Fetch main character
  const { data: mainCharacter } = useQuery<any>({
    queryKey: ["/api/characters/main"],
    enabled: !!user,
  });

  // Current character for chat (use main character or first available alive character)
  const currentCharacter = (mainCharacter && !mainCharacter.deathDate) ? mainCharacter : userCharacters[0];
  
  // Check if user needs a character (non-admin users need a character)
  const needsCharacter = user?.role !== 'admin';
  
  if (needsCharacter && (!currentCharacter?.firstName || !currentCharacter?.lastName)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Postava nenalezena</h2>
          <p className="text-muted-foreground">Pro přístup do chatu potřebujete aktivní postavu.</p>
          <Link href="/character/edit">
            <Button className="mt-4">Vytvořit postavu</Button>
          </Link>
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
    staleTime: 0, // Always consider data stale
  });

  // Clear local messages when room changes
  useEffect(() => {
    if (currentRoomId) {
      setLocalMessages([]);
      // Force refetch of messages for the new room
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/rooms", currentRoomId, "messages"],
        exact: true 
      });
    }
  }, [currentRoomId, queryClient]);

  // Update local messages when server messages change
  useEffect(() => {
    if (Array.isArray(messages)) {
      if (messages.length > 0) {
        console.log("Messages data:", messages);
        console.log("Messages loading:", messagesLoading);
        console.log("Current room ID:", currentRoomId);
        
        // Sort messages by creation date (newest first for display)
        const sortedMessages = [...messages].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLocalMessages(sortedMessages);
      } else if (!messagesLoading) {
        // Clear local messages if no messages are returned
        setLocalMessages([]);
      }
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
      
      // First authenticate with user and character info
      socket.send(JSON.stringify({
        type: 'authenticate',
        sessionId: 'session',
        userId: user.id,
        characterId: currentCharacter?.id
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message' && data.roomId === currentRoomId) {
        setLocalMessages(prev => [data.message, ...prev]);
      } else if (data.type === 'authenticated') {
        // After authentication, join the room
        socket.send(JSON.stringify({
          type: 'join_room',
          roomId: currentRoomId
        }));
      } else if (data.type === 'room_joined' && data.characters) {
        setPresentCharacters(data.characters);
      } else if (data.type === 'presence_update' && data.characters) {
        setPresentCharacters(data.characters);
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
    if (!messageInput.trim() || !currentRoomId) return;
    
    // For non-admin users, require a character
    if (needsCharacter && !currentCharacter) return;

    try {
      const messageData = {
        roomId: currentRoomId,
        characterId: currentCharacter?.id,
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

  const handleDownloadChat = async () => {
    if (!currentRoomId) return;

    try {
      const response = await fetch(`/api/rooms/${currentRoomId}/download`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'chat.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Úspěch",
          description: "Chat byl stažen",
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se stáhnout chat.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveMessages = async () => {
    if (!currentRoomId || user?.role !== 'admin') return;

    try {
      const response = await apiRequest("POST", `/api/chat/rooms/${currentRoomId}/archive`);
      const data = await response.json();
      
      toast({
        title: "Úspěch",
        description: data.message,
      });
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/chat/rooms/${currentRoomId}/messages`] });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se archivovat zprávy.",
        variant: "destructive",
      });
    }
  };

  const handleClearMessages = async () => {
    if (!currentRoomId || user?.role !== 'admin') return;

    if (!confirm('Opravdu chcete smazat všechny zprávy z tohoto chatu? Zprávy budou nejprve automaticky archivovány a poté smazány z aktivního chatu.')) {
      return;
    }

    try {
      // First archive messages
      const archiveResponse = await apiRequest("POST", `/api/chat/rooms/${currentRoomId}/archive`);
      const archiveData = await archiveResponse.json();
      
      // Then clear visible messages
      const clearResponse = await apiRequest("DELETE", `/api/admin/rooms/${currentRoomId}/clear`);
      const clearData = await clearResponse.json();
      
      toast({
        title: "Úspěch",
        description: `${archiveData.message} Zprávy byly poté smazány z aktivního chatu.`,
      });
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/chat/rooms/${currentRoomId}/messages`] });
      setLocalMessages([]);
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se archivovat nebo smazat zprávy.",
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
            {/* Chat Management Buttons */}
            <Button
              onClick={handleDownloadChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              title="Stáhnout obsah chatu"
            >
              <Download className="h-4 w-4" />
              Stáhnout
            </Button>
            
            {user?.role === 'admin' && (
              <>
                <Button
                  onClick={handleArchiveMessages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Archivovat zprávy (přesun do archivu)"
                >
                  <Archive className="h-4 w-4" />
                  Archivovat
                </Button>
                
                <Button
                  onClick={handleClearMessages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  title="Archivovat a smazat zprávy (automaticky archivuje před smazáním)"
                >
                  <Trash2 className="h-4 w-4" />
                  Archivovat a smazat
                </Button>
              </>
            )}
            
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
                  <Link 
                    href={`/characters/${message.characterId}`}
                    className="font-medium text-sm hover:text-primary hover:underline cursor-pointer"
                  >
                    {message.character.firstName} {message.character.lastName}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString('cs-CZ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {/* Character change button - show for own messages within 5 minutes */}
                  {(() => {
                    const messageTime = new Date(message.createdAt);
                    const now = new Date();
                    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
                    const isOwnMessage = userCharacters.some((char: any) => char.id === message.characterId);
                    const canChangeCharacter = isOwnMessage && timeDiffMinutes <= 5;
                    
                    return canChangeCharacter && userCharacters.length > 1 && (
                      <div className="ml-2">
                        <select 
                          className="text-xs bg-muted/50 border border-border rounded px-2 py-1"
                          value={message.characterId}
                          onChange={(e) => {
                            const newCharacterId = parseInt(e.target.value);
                            if (newCharacterId !== message.characterId) {
                              apiRequest("PATCH", `/api/chat/messages/${message.id}/character`, {
                                characterId: newCharacterId
                              })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
                                  const newCharacter = userCharacters.find((char: any) => char.id === newCharacterId);
                                  toast({
                                    title: "Postava změněna",
                                    description: `Zpráva nyní patří postavě ${newCharacter?.firstName} ${newCharacter?.lastName}`,
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Chyba",
                                    description: "Nepodařilo se změnit postavu zprávy",
                                    variant: "destructive",
                                  });
                                });
                            }
                          }}
                        >
                          {userCharacters.map((character: any) => (
                            <option key={character.id} value={character.id}>
                              {character.firstName} {character.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
                <p className="text-sm text-foreground break-words">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex-none border-t bg-card p-4">
          {/* Character Switcher */}
          {userCharacters.length > 1 && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Psát jako postava:</span>
                <span className="text-xs text-muted-foreground">
                  {userCharacters.length} postav k dispozici
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userCharacters.map((character: any) => (
                  <Button
                    key={character.id}
                    variant={currentCharacter?.id === character.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (currentCharacter?.id !== character.id) {
                        apiRequest("POST", `/api/characters/${character.id}/set-main`)
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/characters/main"] });
                            toast({
                              title: "Postava změněna",
                              description: `Nyní píšete jako ${character.firstName} ${character.lastName}`,
                            });
                          })
                          .catch(() => {
                            toast({
                              title: "Chyba",
                              description: "Nepodařilo se změnit postavu",
                              variant: "destructive",
                            });
                          });
                      }
                    }}
                    className="text-xs"
                  >
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">
                          {character.firstName[0]}{character.lastName[0]}
                        </span>
                      </div>
                      <span>{character.firstName} {character.lastName}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
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

      {/* Right Panel - Room Description and Presence */}
      <div className="w-80 border-l bg-muted/30 flex flex-col">
        {/* Panel Header - matches main header */}
        <div className="flex-none p-4 border-b bg-card h-[84px] flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Informace o místnosti</span>
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
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Room Presence */}
          <RoomPresence roomId={currentRoomId!} onlineCharacters={presentCharacters} />
          
          {/* Room Description */}
          {(currentRoom.longDescription || user?.role === 'admin') && (
            <div>
              {isEditingDescription ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Popis místnosti</div>
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
                    <div className="mt-2">
                      <div className="font-medium mb-1">Odkazy na chaty:</div>
                      <div>[Ulice] → vytvoří odkaz na chat "Ulice"</div>
                      <div>[Příčná ulice] → vytvoří odkaz na kategorie</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-foreground mb-2">Popis místnosti</div>
                  {currentRoom.longDescription ? (
                    <RoomDescription description={currentRoom.longDescription} />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {user?.role === 'admin' ? "Žádný popis místnosti. Klikněte na upravit pro přidání popisu." : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
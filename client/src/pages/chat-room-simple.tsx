import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft } from "lucide-react";

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
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Fetch messages - Use the working endpoint structure
  const { data: fetchedMessages = [], isLoading: messagesLoading, error: messagesError } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/rooms/${currentRoomId}/messages`],
    enabled: !!currentRoomId,
  });

  // Sync fetched messages with local state
  useEffect(() => {
    if (fetchedMessages.length > 0) {
      setLocalMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Debug messages
  console.log("Messages data:", localMessages);
  console.log("Messages loading:", messagesLoading);
  console.log("Messages error:", messagesError);
  console.log("Current room ID:", currentRoomId);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentRoomId || !currentCharacter) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket připojen");
      setIsConnected(true);
      // Authenticate first
      websocket.send(JSON.stringify({
        type: "authenticate",
        userId: user.id,
        characterId: currentCharacter.id
      }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          // Add the new message directly to the cache instead of refreshing
          setLocalMessages((prevMessages: ChatMessage[]) => [data.message, ...prevMessages]);
        } else if (data.type === "message") {
          queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", { roomId: currentRoomId }] });
        }
      } catch (error) {
        console.error("Chyba při zpracování WebSocket zprávy:", error);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket odpojen");
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.log("WebSocket chyba:", error);
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [currentRoomId, currentCharacter, queryClient]);

  // Auto-scroll removed - newest messages stay at the top

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentRoomId || !currentCharacter) return;

    if (messageInput.length < 1 || messageInput.length > 5000) {
      toast({
        title: "Neplatná délka zprávy",
        description: "Zpráva musí mít 1-5000 znaků.",
        variant: "destructive",
      });
      return;
    }

    // Send via WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "chat_message",
        roomId: currentRoomId,
        content: messageInput.trim(),
        messageType: "text"
      }));
      
      setMessageInput("");
      
      // Refresh messages after sending
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/chat/rooms/${currentRoomId}/messages`] });
      }, 100);
    } else {
      toast({
        title: "Chyba připojení",
        description: "WebSocket není připojen. Zkuste obnovit stránku.",
        variant: "destructive",
      });
    }
  };

  const handleDiceRoll = async () => {
    if (!currentRoomId || !currentCharacter) return;

    if (!ws || !isConnected) {
      toast({
        title: "Chyba připojení",
        description: "WebSocket není připojen. Zkuste obnovit stránku.",
        variant: "destructive",
      });
      return;
    }

    try {
      ws.send(JSON.stringify({
        type: 'dice_roll',
        roomId: currentRoomId,
      }));
    } catch (error) {
      toast({
        title: "Chyba při hodu kostkou",
        description: "Nepodařilo se hodit kostkou.",
        variant: "destructive",
      });
    }
  };

  const handleCoinFlip = async () => {
    if (!currentRoomId || !currentCharacter) return;

    if (!ws || !isConnected) {
      toast({
        title: "Chyba připojení",
        description: "WebSocket není připojen. Zkuste obnovit stránku.",
        variant: "destructive",
      });
      return;
    }

    try {
      ws.send(JSON.stringify({
        type: 'coin_flip',
        roomId: currentRoomId,
      }));
    } catch (error) {
      toast({
        title: "Chyba při hodu mincí",
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex-none border-b bg-card p-4">
        <div className="flex items-center justify-between">
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentRoom.name}</h1>
              {currentRoom.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentRoom.description}</p>
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
      </div>

      {/* Room Description */}
      {currentRoom.longDescription && (
        <div className="flex-none border-b bg-muted/50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {currentRoom.longDescription}
            </div>
          </div>
        </div>
      )}

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
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {messageInput.length}/5000 znaků
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
  );
}
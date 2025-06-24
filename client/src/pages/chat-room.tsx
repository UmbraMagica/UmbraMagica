
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Download, Archive, ArrowLeft, Dices, Coins } from "lucide-react";
import { format } from "date-fns";

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
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

const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 1;
const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to safely get character name
function getCharacterName(character: any): string {
  if (!character || typeof character !== 'object') {
    return 'Neznámá postava';
  }
  const firstName = character.firstName || '';
  const middleName = character.middleName || '';
  const lastName = character.lastName || '';
  return `${firstName}${middleName ? ` ${middleName}` : ''} ${lastName}`.trim() || 'Neznámá postava';
}

// Helper function to safely get character initials
function getCharacterInitials(character: any): string {
  if (!character || typeof character !== 'object') {
    return 'N';
  }
  const firstInitial = character.firstName?.charAt(0) || 'N';
  const lastInitial = character.lastName?.charAt(0) || '';
  return `${firstInitial}${lastInitial}`;
}

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomId = roomId ? parseInt(roomId) : null;

  // Fetch user's characters
  const { data: userCharactersRaw = [], isLoading: charactersLoading } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Process user characters - only alive, non-system characters belonging to the user
  const userCharacters = Array.isArray(userCharactersRaw) ? 
    userCharactersRaw.filter(char => 
      char && 
      !char.deathDate && 
      !char.isSystem &&
      char.userId === user?.id
    ) : [];

  // Fetch current room info
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: !!user,
  });

  const currentRoom = rooms.find(r => r.id === currentRoomId);

  // Fetch messages for current room
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", currentRoomId, "messages"],
    enabled: !!currentRoomId,
  });

  // Auto-select first character when characters load
  useEffect(() => {
    if (!selectedCharacter && userCharacters.length > 0) {
      setSelectedCharacter(userCharacters[0]);
    }
  }, [userCharacters, selectedCharacter]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'wss://umbra-dev.onrender.com'}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      setWs(ws);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/rooms", currentRoomId, "messages"] 
            });
          }
        } catch (err) {
          // Ignore parsing errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [user, roomId, currentRoomId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; messageType?: string; characterId: number }) => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: currentRoomId,
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          characterId: messageData.characterId,
        }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se odeslat zprávu');
      }

      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: (error) => {
      toast({
        title: "Chyba při odesílání zprávy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send narrator message mutation
  const sendNarratorMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/chat/narrator-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: currentRoomId,
          content: content.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se odeslat vypravěčskou zprávu');
      }

      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: (error) => {
      toast({
        title: "Chyba při odesílání zprávy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Archive messages mutation
  const archiveMessagesMutation = useMutation({
    mutationFn: async (roomId: number) => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/archive`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Archivace se nezdařila");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zprávy archivovány",
        description: "Chat byl úspěšně archivován a vymazán.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: () => {
      toast({
        title: "Chyba při archivaci",
        description: "Nepodařilo se archivovat zprávy.",
        variant: "destructive",
      });
    },
  });

  // Dice roll mutation
  const diceRollMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCharacter) {
        throw new Error("Vyberte postavu");
      }

      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/game/dice-roll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: currentRoomId,
          characterId: selectedCharacter.id
        })
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se hodit kostkou');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: (error) => {
      toast({
        title: "Chyba při hodu kostkou",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Coin flip mutation
  const coinFlipMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCharacter) {
        throw new Error("Vyberte postavu");
      }

      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/game/coin-flip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: currentRoomId,
          characterId: selectedCharacter.id
        })
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se hodit mincí');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: (error) => {
      toast({
        title: "Chyba při hodu mincí",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export chat function
  const exportChat = async () => {
    if (!currentRoomId) return;

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/chat/rooms/${currentRoomId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Export se nezdařil');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `chat-export-${currentRoomId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Chat exportován",
        description: "Soubor byl stažen do vašeho počítače.",
      });
    } catch (error) {
      toast({
        title: "Chyba při exportu",
        description: "Nepodařilo se exportovat chat.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentRoomId || !selectedCharacter) return;
    
    if (selectedCharacter.id === 'narrator') {
      // Vypravěčská zpráva
      sendNarratorMessageMutation.mutate(messageInput.trim());
    } else {
      // Běžná zpráva
      sendMessageMutation.mutate({
        content: messageInput.trim(),
        characterId: selectedCharacter.id,
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy HH:mm");
  };

  // Check if user can send as narrator
  const canSendAsNarrator = user?.role === 'admin' || user?.canNarrate;

  // Create character options (user's characters + narrator if allowed)
  const characterOptions = [
    ...userCharacters,
    ...(canSendAsNarrator ? [{ id: 'narrator', firstName: 'Vypravěč', lastName: '', isNarrator: true }] : [])
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Pro přístup k chatu se musíte přihlásit.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (charactersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Načítání postav...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userCharacters.length === 0 && !canSendAsNarrator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Nemáte žádnou postavu. Pro přístup k chatu potřebujete alespoň jednu postavu.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Chatová místnost nebyla nalezena.</p>
            <Button 
              className="mt-4" 
              onClick={() => setLocation('/chat')}
            >
              Zpět na seznam chatů
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messageInputLength = messageInput.length;
  const isMessageValid = messageInputLength >= MIN_MESSAGE_LENGTH && messageInputLength <= MAX_MESSAGE_LENGTH;

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <Card className="flex-1 flex flex-col">
        {/* Header */}
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/chat')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět
              </Button>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>{currentRoom.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {currentRoom.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Připojeno' : 'Odpojeno'}
              </span>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChat}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                {(user?.role === 'admin') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentRoomId && archiveMessagesMutation.mutate(currentRoomId)}
                    disabled={archiveMessagesMutation.isPending}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archivovat a smazat
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {message.messageType === 'narrator' ? 'V' : getCharacterInitials(message.character)}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {message.messageType === 'narrator' ? 'Vypravěč' : getCharacterName(message.character)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-3 items-end">
            {/* Character Avatar */}
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className={`font-semibold ${
                selectedCharacter?.isNarrator
                  ? `text-white` 
                  : 'bg-secondary/50 text-secondary-foreground'
              }`} style={{
                backgroundColor: selectedCharacter?.isNarrator ? (
                  user?.narratorColor === 'yellow' ? '#fbbf24' :
                  user?.narratorColor === 'red' ? '#ef4444' :
                  user?.narratorColor === 'blue' ? '#3b82f6' :
                  user?.narratorColor === 'green' ? '#10b981' :
                  user?.narratorColor === 'pink' ? '#ec4899' :
                  '#8b5cf6'
                ) : undefined
              }}>
                {selectedCharacter?.isNarrator ? 'V' :
                 selectedCharacter ? getCharacterInitials(selectedCharacter) : 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Input Area */}
            <div className="flex-1">
              <Textarea
                placeholder="Napište zprávu..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={!isConnected}
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2">
                  {/* Character selector */}
                  <Select 
                    value={selectedCharacter?.id?.toString() || selectedCharacter?.id || ''} 
                    onValueChange={(value) => {
                      if (value === 'narrator') {
                        setSelectedCharacter({ id: 'narrator', firstName: 'Vypravěč', lastName: '', isNarrator: true });
                      } else {
                        const char = userCharacters.find((c) => c.id === parseInt(value));
                        if (char) {
                          setSelectedCharacter(char);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Vyber postavu" />
                    </SelectTrigger>
                    <SelectContent>
                      {canSendAsNarrator && (
                        <SelectItem value="narrator">Vypravěč</SelectItem>
                      )}
                      {userCharacters.map((char) => (
                        <SelectItem key={char.id} value={char.id.toString()}>
                          {getCharacterName(char)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Action buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => diceRollMutation.mutate()}
                    disabled={!selectedCharacter || selectedCharacter.isNarrator || diceRollMutation.isPending}
                  >
                    <Dices className="h-4 w-4 mr-1" />
                    1d10
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => coinFlipMutation.mutate()}
                    disabled={!selectedCharacter || selectedCharacter.isNarrator || coinFlipMutation.isPending}
                  >
                    <Coins className="h-4 w-4 mr-1" />
                    Mince
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isMessageValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                    {messageInputLength}/{MAX_MESSAGE_LENGTH} znaků
                  </span>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!isMessageValid || !isConnected || !selectedCharacter}
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Odeslat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

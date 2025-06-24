import { useState, useEffect, useRef, useMemo } from "react";
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
import { MessageCircle, Send, Download, Archive, ArrowLeft, User, Dices, Coins } from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/queryClient";
import { useSelectedCharacter } from "@/contexts/SelectedCharacterContext";

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

export default function ChatRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedCharacter, changeCharacter, userCharacters, isLoading: charactersLoading, canSendAsNarrator } = useSelectedCharacter();

  const currentRoomId = roomId ? parseInt(roomId) : null;

  // Debug user data
  console.log("User data:", user);
  console.log("User characters from query:", userCharacters);
  console.log("Selected character:", selectedCharacter);

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

  // Get influence bar
  const { data: influenceBar } = useQuery({
    queryKey: ["/api/influence-bar"],
    enabled: !!user,
    queryFn: async () => {
      return apiFetch(`${API_URL}/api/influence-bar`);
    },
  });

  // Get influence history
  const { data: influenceHistory } = useQuery({
    queryKey: ["/api/influence-history"],
    enabled: !!user,
    queryFn: async () => {
      return apiFetch(`${API_URL}/api/influence-history`);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; messageType?: string; characterId: number }) => {
      if (messageData.content.length < MIN_MESSAGE_LENGTH || messageData.content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Zpráva musí mít ${MIN_MESSAGE_LENGTH}-${MAX_MESSAGE_LENGTH} znaků`);
      }

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
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
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
    mutationFn: () => {
      return new Promise<void>((resolve, reject) => {
        if (!ws || !isConnected) {
          reject(new Error("WebSocket není připojen"));
          return;
        }

        ws.send(JSON.stringify({
          type: 'dice_roll',
          roomId: currentRoomId,
        }));

        resolve();
      });
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
    mutationFn: () => {
      return new Promise<void>((resolve, reject) => {
        if (!ws || !isConnected) {
          reject(new Error("WebSocket není připojen"));
          return;
        }

        ws.send(JSON.stringify({
          type: 'coin_flip',
          roomId: currentRoomId,
        }));

        resolve();
      });
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
      const response = await fetch(`${API_URL}/api/chat/rooms/${currentRoomId}/export`, {
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

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.error('No JWT token found for WebSocket connection');
      return;
    }

    // Ensure we have a valid token before attempting connection
    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'wss://umbra-dev.onrender.com'}/ws?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      setWs(ws);

      ws.onopen = () => {
        console.log('WebSocket připojen');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket zpráva:', data);
          
          // Pokud je to nová zpráva, invaliduj query cache
          if (data.type === 'new_message') {
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/rooms", currentRoomId, "messages"] 
            });
          }
        } catch (err) {
          console.log('WebSocket raw message:', event.data);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket odpojen', event.code, event.reason);
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket chyba:', error);
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
  }, [user, roomId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter available characters
  const availableCharacters = userCharacters.filter(char => !char.deathDate && !char.isSystem);

  // Create all available options (characters + narrator if allowed)
  const allCharacterOptions = [
    ...availableCharacters,
    ...(canSendAsNarrator ? [{ id: 'narrator', firstName: 'Vypravěč', lastName: '', isNarrator: true }] : [])
  ];

  // Update current chat character when selectedCharacter changes
  useEffect(() => {
    console.log("Character effect - selectedCharacter:", selectedCharacter, "availableCharacters:", availableCharacters.length);

    if (selectedCharacter) {
      changeCharacter(selectedCharacter);
    } else if (availableCharacters.length > 0) {
      // Auto-select first available character if none selected
      const firstChar = availableCharacters[0];
      console.log("Auto-selecting first character:", firstChar);
      changeCharacter(firstChar);
    } else {
      changeCharacter(null);
    }
  }, [selectedCharacter, availableCharacters.length, changeCharacter]);

  // 1. Výběr postavy per chat/okno
  useEffect(() => {
    if (selectedCharacter && roomId) {
      localStorage.setItem(`selectedCharacterId_${roomId}`, selectedCharacter.id.toString());
    }
  }, [selectedCharacter, roomId]);

  useEffect(() => {
    if (roomId && userCharacters.length > 0) {
      const savedId = localStorage.getItem(`selectedCharacterId_${roomId}`);
      let char = null;
      if (savedId) {
        char = userCharacters.find((c) => c.id === parseInt(savedId));
      }
      if (!char) {
        char = userCharacters.find((c) => c.isActive) || userCharacters[0];
      }
      if (char && char.id !== selectedCharacter?.id) {
        changeCharacter(char);
      }
    }
  }, [roomId, userCharacters, changeCharacter]);

  // 3. Kouzla pouze pro postavy s hůlkou
  const characterHasWand = useMemo(() => {
    if (!selectedCharacter) return false;
    const char = userCharacters.find((c) => c.id === selectedCharacter.id);
    return !!char?.wandId; // nebo jiný příznak
  }, [selectedCharacter, userCharacters]);

  // 4. Výběr postavy/vypravěče
  const availableOptions = useMemo(() => [
    ...(canSendAsNarrator ? [{ id: 0, firstName: 'Vypravěč', lastName: '', name: 'Vypravěč' }] : []),
    ...userCharacters.map((c) => ({ ...c, name: c.firstName + (c.lastName ? ' ' + c.lastName : '') })),
  ], [canSendAsNarrator, userCharacters]);

  const handleSelectChange = (value: string) => {
    if (value === '0') {
      changeCharacter({ id: 0, firstName: 'Vypravěč', lastName: '', name: 'Vypravěč' });
    } else {
      const char = userCharacters.find((c) => c.id === parseInt(value));
      if (char) changeCharacter(char);
    }
  };

  // 5. Odesílání zprávy
  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentRoomId || !selectedCharacter) return;
    
    if (selectedCharacter.id === 0 || selectedCharacter.id === 'narrator') {
      // Vypravěčská zpráva - použij narrator endpoint
      fetch(`${API_URL}/api/chat/narrator-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: currentRoomId,
          content: messageInput.trim()
        })
      }).then(() => {
        setMessageInput("");
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
      }).catch(error => {
        toast({
          title: "Chyba při odesílání zprávy",
          description: error.message,
          variant: "destructive",
        });
      });
    } else {
      // Běžná zpráva
      sendMessageMutation.mutate({
        content: messageInput.trim(),
        characterId: selectedCharacter.id,
      });
    }
  };

  // 6. Změna postavy u zprávy (editace)
  // U zprávy, kterou uživatel sám odeslal a je mladší než 5 minut:
  // {canEditMessage(message) && <Button onClick={() => openChangeCharacterDialog(message)}>Změnit postavu</Button>}

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy HH:mm");
  };

  const getCharacterFullName = (character: ChatMessage['character']) => {
    return `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`;
  };

  const getCharacterInitials = (character: ChatMessage['character']) => {
    const firstInitial = character.firstName.charAt(0);
    const lastInitial = character.lastName.charAt(0);
    return `${firstInitial}${lastInitial}`;
  };

  const getCurrentUserInitials = () => {
    try {
      if (!user?.characters?.[0]) return "U";
      const character = user.characters[0];
      if (!character?.firstName || !character?.lastName) return "U";
      return `${character.firstName.charAt(0)}${character.lastName.charAt(0)}`;
    } catch (error) {
      console.error("Error getting user initials:", error);
      return "U";
    }
  };

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

  if (!userCharacters || userCharacters.length === 0) {
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
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b">
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

            {/* Výběr postavy/role */}
            <div className="flex items-center gap-2">
              <Select onValueChange={handleSelectChange} value={selectedCharacter?.id?.toString() || ''}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Vyber postavu" />
                </SelectTrigger>
                <SelectContent>
                  {canSendAsNarrator && (
                    <SelectItem key={0} value="0">Vypravěč</SelectItem>
                  )}
                  {userCharacters
                    .filter(char => char && char.firstName && typeof char.firstName === 'string')
                    .map((char) => (
                      <SelectItem key={char.id} value={char.id.toString()}>
                        {char.firstName + (char.lastName ? ' ' + char.lastName : '')}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            {/* Konec výběru postavy/role */}
            <div className="flex items-center gap-2 ml-4">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentRoomId && archiveMessagesMutation.mutate(currentRoomId)}
                  disabled={archiveMessagesMutation.isPending}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archivovat
                </Button>
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
                    {getCharacterInitials(message.character)}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {getCharacterFullName(message.character)}
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
        <div className="border-t p-4">
          <div className="flex gap-3 items-end">
            {/* Character Avatar */}
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className={`font-semibold ${
                selectedCharacter?.id === 'narrator' 
                  ? `text-white` 
                  : 'bg-secondary/50 text-secondary-foreground'
              }`} style={{
                backgroundColor: selectedCharacter?.id === 'narrator' ? (
                  user?.narratorColor === 'yellow' ? '#fbbf24' :
                  user?.narratorColor === 'red' ? '#ef4444' :
                  user?.narratorColor === 'blue' ? '#3b82f6' :
                  user?.narratorColor === 'green' ? '#10b981' :
                  user?.narratorColor === 'pink' ? '#ec4899' :
                  '#8b5cf6'
                ) : undefined
              }}>
                {selectedCharacter?.id === 'narrator' ? 'V' :
                 selectedCharacter ? 
                  `${selectedCharacter.firstName.charAt(0)}${selectedCharacter.lastName.charAt(0)}` : 
                  getCurrentUserInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Input Area */}
            <div className="flex-1">
              <Textarea
                placeholder="Napište zprávu..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleSendMessage}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={!isConnected}
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <div className="flex justify-between items-center mt-1">
                <span className={`text-xs ${isMessageValid ? 'text-muted-foreground' : 'text-destructive'}`}>
                  {messageInputLength}/{MAX_MESSAGE_LENGTH} znaků
                </span>
                {!isMessageValid && messageInputLength > 0 && (
                  <span className="text-xs text-destructive">
                    {messageInputLength < MIN_MESSAGE_LENGTH 
                      ? `Minimum ${MIN_MESSAGE_LENGTH} znak` 
                      : `Maximum ${MAX_MESSAGE_LENGTH} znaků`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
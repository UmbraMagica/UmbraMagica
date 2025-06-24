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
import { MessageCircle, Send, Download, Archive, ArrowLeft, Dices, Coins, Trash2, Wand2 } from "lucide-react";
import { format } from "date-fns";
import { RoomDescription } from "@/components/RoomDescription";

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
    id: number;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    userId: number;
  };
}

const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 1;
const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to safely get character name
function getCharacterName(message: any): string {
  // Handle narrator/system messages
  if (!message.characterId || message.characterId === 0) {
    if (message.character?.firstName) {
      return message.character.firstName;
    }
    return message.messageType === 'narrator' ? 'Vypravěč' : 'Systém';
  }
  
  // Handle direct character object (not a message)
  if (message.firstName) {
    const firstName = message.firstName || '';
    const middleName = message.middleName || '';
    const lastName = message.lastName || '';
    return `${firstName}${middleName ? ` ${middleName}` : ''} ${lastName}`.trim() || 'Neznámá postava';
  }
  
  // Handle message with nested character
  const character = message.character;
  if (!character || typeof character !== 'object') {
    return 'Neznámá postava';
  }
  
  // Get character name with fallbacks
  const firstName = character.firstName || character.first_name || '';
  const middleName = character.middleName || character.middle_name || '';
  const lastName = character.lastName || character.last_name || '';
  const fullName = `${firstName}${middleName ? ` ${middleName}` : ''} ${lastName}`.trim();
  return fullName || 'Neznámá postava';
}

// Helper function to safely get character initials
function getCharacterInitials(message: any): string {
  // Handle narrator/system messages
  if (!message.characterId || message.characterId === 0) {
    if (message.character?.firstName) {
      return message.character.firstName.charAt(0) || 'V';
    }
    return message.messageType === 'narrator' ? 'V' : 'S';
  }
  
  // Handle direct character object (not a message)
  if (message.firstName) {
    const firstInitial = message.firstName?.charAt(0) || 'N';
    const lastInitial = message.lastName?.charAt(0) || 'P';
    return `${firstInitial}${lastInitial}`;
  }
  
  const character = message.character;
  if (!character || typeof character !== 'object') {
    return 'NP';
  }
  
  // Get initials with fallbacks
  const firstName = character.firstName || character.first_name || '';
  const lastName = character.lastName || character.last_name || '';
  const firstInitial = firstName.charAt(0) || 'N';
  const lastInitial = lastName.charAt(0) || 'P';
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
  const [isNarratorMode, setIsNarratorMode] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRoomId = roomId ? parseInt(roomId) : null;

  // Use characters from useAuth instead of separate query
  const userCharactersRaw = user?.characters || [];
  const charactersLoading = isLoading;

  // Process user characters - only alive, non-system characters that belong to the current user
  const userCharacters = Array.isArray(userCharactersRaw) ? 
    userCharactersRaw.filter((char) => {
      if (!char || typeof char !== 'object') {
        return false;
      }
      
      // Check basic properties
      const hasValidId = typeof char.id === 'number' && char.id > 0;
      const hasValidFirstName = typeof char.firstName === 'string' && char.firstName.trim() !== '';
      const isAlive = !char.deathDate;
      const isNotSystem = !char.isSystem;
      
      // IMPORTANT: Only include characters that belong to the current user
      // Admin can see all characters in user.characters, but can only send messages as their own characters
      const belongsToUser = char.userId === user?.id;
      
      return hasValidId && hasValidFirstName && isAlive && isNotSystem && belongsToUser;
    }) : [];

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
    if (!selectedCharacter && userCharacters.length > 0 && !charactersLoading && !isNarratorMode) {
      console.log('Auto-selecting first character:', userCharacters[0]);
      setSelectedCharacter(userCharacters[0]);
    }
  }, [userCharacters, selectedCharacter, charactersLoading, isNarratorMode]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !roomId) return;

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.warn('No JWT token found for WebSocket connection');
      return;
    }

    try {
      const wsBaseUrl = import.meta.env.VITE_WS_URL || window.location.protocol.replace('http', 'ws') + '//' + window.location.host;
      const wsUrl = `${wsBaseUrl}/ws?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      setWs(ws);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          if (data.type === 'new_message') {
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/rooms", currentRoomId, "messages"] 
            });
          }
        } catch (err) {
          console.warn('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
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
      setIsNarratorMode(false);
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
      if (!selectedCharacter || !selectedCharacter.id) {
        throw new Error("Vyberte postavu");
      }

      if (!currentRoomId) {
        throw new Error("Neplatná místnost");
      }

      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/game/dice-roll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: currentRoomId,
          characterId: selectedCharacter.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Nepodařilo se hodit kostkou');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: (error) => {
      console.error('Dice roll error:', error);
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
      if (!selectedCharacter || !selectedCharacter.id) {
        throw new Error("Vyberte postavu");
      }

      if (!currentRoomId) {
        throw new Error("Neplatná místnost");
      }

      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/game/coin-flip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId: currentRoomId,
          characterId: selectedCharacter.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Nepodařilo se hodit mincí');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
    },
    onError: (error) => {
      console.error('Coin flip error:', error);
      toast({
        title: "Chyba při hodu mincí",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update room description mutation
  const updateRoomDescriptionMutation = useMutation({
    mutationFn: async (description: string) => {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`${API_URL}/api/chat/rooms/${currentRoomId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ longDescription: description }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se aktualizovat popis místnosti');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsEditingDescription(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      toast({
        title: "Popis aktualizován",
        description: "Popis místnosti byl úspěšně aktualizován.",
      });
    },
    onError: (error) => {
      toast({
        title: "Chyba při aktualizaci",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditDescription = () => {
    setEditedDescription(currentRoom?.longDescription || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    updateRoomDescriptionMutation.mutate(editedDescription);
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
  };

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
    if (!messageInput.trim()) {
      toast({
        title: "Chyba",
        description: "Zpráva nemůže být prázdná",
        variant: "destructive",
      });
      return;
    }

    if (!currentRoomId) {
      toast({
        title: "Chyba", 
        description: "Neplatná místnost",
        variant: "destructive",
      });
      return;
    }

    console.log('Sending message:', { 
      isNarratorMode, 
      selectedCharacter: selectedCharacter ? { id: selectedCharacter.id, name: getCharacterName(selectedCharacter) } : null,
      canSendAsNarrator,
      messageInput: messageInput.trim().substring(0, 50) + '...'
    });

    if (isNarratorMode) {
      // Vypravěčská zpráva
      if (!canSendAsNarrator) {
        toast({
          title: "Chyba",
          description: "Nemáte oprávnění k vypravování",
          variant: "destructive",
        });
        return;
      }
      sendNarratorMessageMutation.mutate(messageInput.trim());
    } else {
      // Běžná zpráva
      if (!selectedCharacter || !selectedCharacter.id) {
        toast({
          title: "Chyba",
          description: "Vyberte postavu pro odeslání zprávy",
          variant: "destructive",
        });
        return;
      }

      if (selectedCharacter.deathDate) {
        toast({
          title: "Chyba",
          description: "Nelze odesílat zprávy s mrtvou postavou",
          variant: "destructive",
        });
        return;
      }

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

  // Sort messages - newest first (chronological order for better UX)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="flex flex-row h-[calc(100vh-4rem)] w-full">
      {/* Levý sloupec: Chat */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Horní lišta */}
        <div className="flex items-center justify-between mb-2 px-6 pt-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/chat')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Opustit chat
            </Button>
            <span className="font-bold text-lg">{currentRoom?.name || 'Místnost'}</span>
            <span className="text-sm text-muted-foreground">{currentRoom?.description}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportChat}>
              <Download className="h-4 w-4 mr-2" />
              Stáhnout
            </Button>
            <Button variant="outline" size="sm" onClick={() => currentRoomId && archiveMessagesMutation.mutate(currentRoomId)}>
              <Archive className="h-4 w-4 mr-2" />
              Archivovat
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {/* zde přidej logiku pro archivovat a smazat */}}>
              <Trash2 className="h-4 w-4 mr-2" />
              Archivovat a smazat
            </Button>
          </div>
        </div>
        {/* Chat zprávy */}
        <ScrollArea className="flex-1 bg-muted/10 rounded-lg p-4 mb-2">
          <div className="space-y-4">
            {sortedMessages.map((message) => (
              <div key={message.id} className="flex gap-3 items-start">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={message.character?.avatar || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getCharacterInitials(message)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {getCharacterName(message)}
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
        {/* Kompaktní dolní lišta */}
        <div className="flex flex-col gap-2 px-6 pb-0">
          {/* První řádek: Avatar + pole pro zprávu + tlačítko odeslat */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={selectedCharacter?.avatar || ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {selectedCharacter ? getCharacterInitials(selectedCharacter) : 'NP'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Textarea
                className="min-h-[40px] max-h-[100px] resize-none pr-16"
                placeholder="Napište zprávu..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={!isConnected}
              />
              <div className="absolute bottom-1 right-1 text-xs text-muted-foreground">
                {messageInputLength}/{MAX_MESSAGE_LENGTH}
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleSendMessage}
              disabled={!isMessageValid || !isConnected}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Druhý řádek: Výběr postavy a akční tlačítka */}
          <div className="flex gap-2 items-center">
            <Select
              value={selectedCharacter?.id?.toString() || ''}
              onValueChange={val => {
                if (val) {
                  const char = userCharacters.find(c => c.id.toString() === val);
                  if (char) setSelectedCharacter(char);
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="Vyber postavu" />
              </SelectTrigger>
              <SelectContent>
                {userCharacters.map(char => (
                  <SelectItem key={char.id} value={char.id.toString()}>
                    {getCharacterName(char)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => diceRollMutation.mutate()} 
              disabled={!selectedCharacter || !selectedCharacter.id || diceRollMutation.isPending}
              className="h-8 gap-1"
              title="Hodit kostkou (1-10)"
            >
              <Dices className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {diceRollMutation.isPending ? 'Házím...' : 'Kostka'}
              </span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => coinFlipMutation.mutate()} 
              disabled={!selectedCharacter || !selectedCharacter.id || coinFlipMutation.isPending}
              className="h-8 gap-1"
              title="Hodit mincí"
            >
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-600 font-medium">
                {coinFlipMutation.isPending ? 'Házím...' : 'Mince'}
              </span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              disabled={!selectedCharacter}
              className="h-8 gap-1"
              title="Seslat kouzlo"
            >
              <Wand2 className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Kouzla</span>
            </Button>

            {canSendAsNarrator && (
              <Button 
                variant={isNarratorMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setIsNarratorMode(!isNarratorMode)}
                className="h-8"
              >
                Vypravěč
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Pravý panel: Popis místnosti a tlačítko Upravit pro admina */}
      <div className="w-80 border-l bg-muted/20 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm mb-0">Informace o místnosti</h3>
            {!isEditingDescription && user?.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={handleEditDescription}>
                Upravit
              </Button>
            )}
            {isEditingDescription && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Zrušit
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSaveDescription}
                  disabled={updateRoomDescriptionMutation.isPending}
                >
                  {updateRoomDescriptionMutation.isPending ? 'Ukládá...' : 'Uložit'}
                </Button>
              </div>
            )}
          </div>
        <div className="p-4">
          <h4 className="font-semibold text-sm mb-3">Popis místnosti</h4>
          {isEditingDescription ? (
            <div>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="min-h-[200px] text-sm"
                placeholder="Zadejte popis místnosti..."
              />
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                <h5 className="text-xs font-semibold mb-2 text-muted-foreground">Nápověda k formátování:</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>**text**</strong> - tučné písmo</div>
                  <div><em>*text*</em> - kurzíva</div>
                  <div><u>__text__</u> - podtržené</div>
                  <div><span className="text-blue-500 underline">[Název místnosti]</span> - odkaz na jinou místnost</div>
                </div>
              </div>
            </div>
          ) : (
            <RoomDescription 
              description={currentRoom?.longDescription || 'Žádný popis není k dispozici.'} 
              roomName={currentRoom?.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
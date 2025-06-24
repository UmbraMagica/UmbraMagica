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
    return 'NP';
  }
  const firstInitial = character.firstName?.charAt(0) || 'N';
  const lastInitial = character.lastName?.charAt(0) || 'P';
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

  // Auto-scroll to top when new messages arrive (newest first)
  useEffect(() => {
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
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
    if (!messageInput.trim() || !currentRoomId) return;

    if (isNarratorMode) {
      // Vypravěčská zpráva
      sendNarratorMessageMutation.mutate(messageInput.trim());
    } else if (selectedCharacter) {
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

  // Sort messages - newest first
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getCharacterInitials(message.character)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {getCharacterName(message.character)}
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
        <div className="flex flex-col gap-2 px-6 pb-4">
          {/* První řádek: Avatar + pole pro zprávu + tlačítko odeslat */}
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="" />
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
              disabled={!selectedCharacter}
              className="h-8"
            >
              <Dices className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => coinFlipMutation.mutate()} 
              disabled={!selectedCharacter}
              className="h-8"
            >
              <Coins className="h-4 w-4" />
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              disabled={!selectedCharacter}
              className="h-8"
            >
              <Wand2 className="h-4 w-4" />
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
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="min-h-[200px] text-sm"
              placeholder="Zadejte popis místnosti..."
            />
          ) : (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {currentRoom?.longDescription || 'Žádný popis není k dispozici.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
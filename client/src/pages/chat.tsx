import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Download, Archive, Users } from "lucide-react";
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

export default function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat rooms
  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: !!user,
  });

  // Fetch messages for selected room
  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", selectedRoom, "messages"],
    enabled: !!selectedRoom,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { content: string; messageType?: string }) => {
      return new Promise<void>((resolve, reject) => {
        if (!ws || !isConnected) {
          reject(new Error("WebSocket not connected"));
          return;
        }

        ws.send(JSON.stringify({
          type: 'chat_message',
          roomId: selectedRoom,
          content: messageData.content,
          messageType: messageData.messageType || 'message',
        }));

        resolve();
      });
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
      const response = await fetch(`/api/chat/rooms/${roomId}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error("Failed to archive messages");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Zprávy archivovány",
        description: "Chat byl úspěšně archivován a vymazán.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", selectedRoom, "messages"] });
    },
    onError: () => {
      toast({
        title: "Chyba při archivaci",
        description: "Nepodařilo se archivovat zprávy.",
        variant: "destructive",
      });
    },
  });

  // Export chat function
  const exportChat = async () => {
    if (!selectedRoom) return;
    
    try {
      const response = await fetch(`/api/chat/rooms/${selectedRoom}/export`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `chat-export-${selectedRoom}-${new Date().toISOString().split('T')[0]}.json`;
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
    if (!user || !user.characters?.[0]) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      
      // Authenticate with the server
      websocket.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        characterId: user.characters[0].id,
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'authenticated':
          console.log("WebSocket authenticated");
          break;
        case 'new_message':
          // Add new message to the cache
          queryClient.setQueryData<ChatMessage[]>(
            ["/api/chat/rooms", data.message.roomId, "messages"],
            (oldData) => oldData ? [...oldData, data.message] : [data.message]
          );
          break;
        case 'error':
          toast({
            title: "WebSocket chyba",
            description: data.message,
            variant: "destructive",
          });
          break;
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user, queryClient, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select first room by default
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) return;
    
    sendMessageMutation.mutate({
      content: messageInput.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  const getCharacterFullName = (character: ChatMessage['character']) => {
    return `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`;
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
        {/* Sidebar - Chat Rooms */}
        <div className="lg:w-1/4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Herní místnosti
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {rooms.map((room) => (
                  <Button
                    key={room.id}
                    variant={selectedRoom === room.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{room.name}</span>
                      {room.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {room.description}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-muted-foreground">
                    {isConnected ? 'Připojeno' : 'Odpojeno'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="lg:w-3/4">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  <div>
                    <CardTitle>
                      {rooms.find(r => r.id === selectedRoom)?.name || "Vyberte místnost"}
                    </CardTitle>
                    {selectedRoom && (
                      <p className="text-sm text-muted-foreground">
                        {rooms.find(r => r.id === selectedRoom)?.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedRoom && (
                  <div className="flex gap-2">
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
                      onClick={() => archiveMessagesMutation.mutate(selectedRoom)}
                      disabled={archiveMessagesMutation.isPending}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archivovat
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            {selectedRoom ? (
              <>
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {getCharacterFullName(message.character)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {message.messageType !== 'message' && (
                            <Badge variant="outline" className="text-xs">
                              {message.messageType}
                            </Badge>
                          )}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 max-w-[80%]">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Napište zprávu..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 min-h-[60px] max-h-[120px]"
                      disabled={!isConnected}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || !isConnected || sendMessageMutation.isPending}
                      className="h-[60px]"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Vyberte herní místnost pro zahájení konverzace</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
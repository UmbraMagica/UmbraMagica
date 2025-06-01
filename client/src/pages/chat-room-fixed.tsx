import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Character {
  id: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  deathDate?: string | null;
  isSystem?: boolean;
}

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
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

export default function ChatRoomFixed() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // All hooks at the top - never conditional
  const [chatCharacter, setChatCharacter] = useState<Character | null>(null);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // All queries at the top - never conditional
  const { data: allUserCharacters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", roomId, "messages"],
    enabled: !!roomId && !!user,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", roomId, "messages"] });
      setMessage("");
    },
  });

  // Derived state - calculate after all hooks
  const userCharacters = allUserCharacters.filter((char: Character) => !char.deathDate && !char.isSystem);
  const currentRoom = rooms.find(room => room.id === parseInt(roomId || "0"));
  const canAccess = user?.role === 'admin' || userCharacters.length > 0;

  // Effects
  useEffect(() => {
    if (!chatCharacter && userCharacters.length > 0) {
      setChatCharacter(userCharacters[0]);
    }
  }, [userCharacters, chatCharacter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket effect
  useEffect(() => {
    if (!roomId || !user || !chatCharacter) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(JSON.stringify({
        type: "join",
        roomId: parseInt(roomId),
        userId: user.id,
        characterId: chatCharacter.id,
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", roomId, "messages"] });
      }
    };

    socket.onclose = () => setIsConnected(false);

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [roomId, user, chatCharacter, queryClient]);

  const handleSendMessage = () => {
    if (!message.trim() || !chatCharacter || !roomId) return;

    sendMessageMutation.mutate({
      roomId: parseInt(roomId),
      characterId: chatCharacter.id,
      content: message.trim(),
      messageType: "text",
    });
  };

  // Render logic - all conditions after hooks
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Přihlášení vyžadováno</h2>
            <p>Pro přístup do chatu se musíte přihlásit.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canAccess && !charactersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Přístup zamítnut</h2>
            <p>Pro přístup do chatu potřebujete alespoň jednu živou postavu.</p>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Debug: Načteno {allUserCharacters.length} postav, filtrováno {userCharacters.length}</p>
              <p>Role: {user?.role}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (charactersLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Načítání...</p>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Místnost nenalezena</h2>
            <p>Chatovací místnost s ID {roomId} neexistuje.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chatCharacter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Načítání postavy...</h2>
          <p>Inicializuji chatovací postavu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {currentRoom.name}
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Připojeno
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Odpojeno
                </Badge>
              )}
            </CardTitle>
            
            <Select
              value={chatCharacter.id.toString()}
              onValueChange={(value) => {
                const selectedChar = userCharacters.find(c => c.id === parseInt(value));
                if (selectedChar) setChatCharacter(selectedChar);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userCharacters.map((char) => (
                  <SelectItem key={char.id} value={char.id.toString()}>
                    {char.firstName} {char.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messagesLoading ? (
              <div className="text-center">Načítání zpráv...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground">Zatím žádné zprávy</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {msg.character?.firstName?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {msg.character?.firstName || 'Unknown'} {msg.character?.lastName || ''}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm bg-muted p-2 rounded">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Napište zprávu..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              Odeslat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
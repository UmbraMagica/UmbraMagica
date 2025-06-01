import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatRoomMinimal() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  // All queries
  const { data: characters = [], isLoading: charactersLoading } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/rooms", roomId, "messages"],
    enabled: !!roomId && !!user,
    refetchInterval: 5000,
  });

  // Calculate derived state
  const userCharacters = characters.filter((char: any) => !char.deathDate && !char.isSystem);
  const currentRoom = rooms.find(room => room.id === parseInt(roomId || "0"));
  const firstCharacter = userCharacters[0];

  console.log("Chat Debug:", {
    user: user?.username,
    role: user?.role,
    roomId,
    charactersTotal: characters.length,
    userCharacters: userCharacters.length,
    currentRoom: currentRoom?.name,
    messagesCount: messages.length,
    firstCharacter: firstCharacter ? `${firstCharacter.firstName} ${firstCharacter.lastName}` : 'None'
  });

  if (!user) {
    return <div className="p-8">Prosím přihlaste se.</div>;
  }

  if (charactersLoading || roomsLoading) {
    return <div className="p-8">Načítání... (postavy: {charactersLoading ? 'načítá' : 'OK'}, místnosti: {roomsLoading ? 'načítá' : 'OK'})</div>;
  }

  if (user.role !== 'admin' && userCharacters.length === 0) {
    return (
      <div className="p-8">
        <h2>Přístup zamítnut</h2>
        <p>Potřebujete alespoň jednu postavu. Načteno {characters.length} postav, filtrováno {userCharacters.length}.</p>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="p-8">
        <h2>Místnost nenalezena</h2>
        <p>Místnost s ID {roomId} neexistuje. Dostupné místnosti: {rooms.length}</p>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!message.trim() || !firstCharacter) return;

    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: parseInt(roomId!),
          characterId: firstCharacter.id,
          content: message.trim(),
          messageType: "text",
        }),
      });
      setMessage("");
    } catch (error) {
      console.error("Chyba při odesílání:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="h-[80vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentRoom.name}</span>
            <span className="text-sm text-muted-foreground">
              Postava: {firstCharacter ? `${firstCharacter.firstName} ${firstCharacter.lastName}` : 'Žádná'}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-muted/30 p-4 rounded">
            {messagesLoading ? (
              <div>Načítání zpráv...</div>
            ) : messages.length === 0 ? (
              <div>Zatím žádné zprávy</div>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className="p-2 border rounded bg-background">
                  <div className="font-medium text-sm">
                    {msg.character?.firstName || 'Unknown'} {msg.character?.lastName || ''}
                  </div>
                  <div className="text-sm mt-1">{msg.content}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Napište zprávu..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={!message.trim() || !firstCharacter}>
              Odeslat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
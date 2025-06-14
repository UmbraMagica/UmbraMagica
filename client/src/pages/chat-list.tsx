import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Users, ArrowRight, ArrowLeft, Edit3, Save, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ChatList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");

  // Fetch chat rooms
  const { data: rooms = [], isLoading, error } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: !!user,
  });

  console.log("Chat rooms data:", rooms);
  console.log("Loading:", isLoading);
  console.log("Error:", error);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Pro přístup k chatům se musíte přihlásit.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  // Mutation for updating room description
  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, description }: { roomId: number; description: string }) => {
      return apiRequest("PATCH", `${API_URL}/api/chat/rooms/${roomId}`, { description });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Popisek místnosti byl aktualizován",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      setEditingRoom(null);
      setEditingDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat popisek",
        variant: "destructive",
      });
    },
  });

  const handleRoomClick = (roomId: number) => {
    if (editingRoom === roomId) return; // Don't navigate when editing
    window.location.href = `/chat/room/${roomId}`;
  };

  const handleEditStart = (room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingRoom(room.id);
    setEditingDescription(room.description || "");
  };

  const handleEditCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingRoom(null);
    setEditingDescription("");
  };

  const handleEditSave = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (editingRoom) {
      updateRoomMutation.mutate({
        roomId: editingRoom,
        description: editingDescription,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/home')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na hlavní stranu
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Herní chaty</h1>
        <p className="text-muted-foreground">
          Vyberte chatovací místnost pro interakci s ostatními hráči
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rooms.map((room) => (
          <Card 
            key={room.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
            onClick={() => handleRoomClick(room.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xl">{room.name}</span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                {editingRoom === room.id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Zadejte popisek místnosti"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleEditSave}
                      disabled={updateRoomMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditCancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-muted-foreground flex-1">
                      {room.description || "Herní chatovací místnost"}
                    </p>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleEditStart(room, e)}
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Veřejná místnost</span>
                </div>
                
                <Button variant="outline" size="sm">
                  Vstoupit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {rooms.length === 0 && (
          <div className="col-span-full text-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Žádné chatovací místnosti
            </h3>
            <p className="text-muted-foreground">
              Momentálně nejsou k dispozici žádné chatovací místnosti.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
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

export default function ChatList() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState("");

  // Fetch chat categories and rooms
  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/admin/chat-categories`],
    enabled: !!user,
  });

  const { data: rooms = [], isLoading: loadingRooms, error } = useQuery({
    queryKey: [`${import.meta.env.VITE_API_URL}/api/chat/rooms`],
    enabled: !!user,
  });

  // Combine rooms with their categories
  const categorizedRooms = rooms.map(room => {
    const category = categories.find(c => c.id === room.categoryId);
    return {
      ...room,
      category: category || { name: 'Bez kategorie' }
    };
  });

  // Group rooms by category
  const roomsByCategory = categorizedRooms.reduce((acc, room) => {
    const categoryKey = room.category.name || 'Bez kategorie';
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(room);
    return acc;
  }, {} as Record<string, ChatRoom[]>);

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
      return apiRequest("PATCH", `${import.meta.env.VITE_API_URL}/api/chat/rooms/${roomId}`, { description });
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
        {categories.map((category) => (
          <div key={category.id}>
            <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
            <div className="space-y-4">
              {category.rooms.map((room) => (
                <Card key={room.id}>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">{room.name}</h3>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => handleEditStart(room, event)}
                          >
                            Upravit
                          </Button>
                        )}
                      </div>
                      {room.description && (
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                      )}
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleRoomClick(room.id)}
                          disabled={!selectedCharacter}
                        >
                          Vstoupit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
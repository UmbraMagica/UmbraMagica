import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  MessageSquare, 
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen
} from "lucide-react";

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
}

interface ArchivedMessage {
  id: number;
  originalMessageId: number;
  roomId: number;
  characterId: number;
  characterName: string;
  content: string;
  messageType: string;
  originalCreatedAt: string;
  archivedAt: string;
}

export default function AdminArchive() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  // Redirect if not admin
  if (user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  const { data: rooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    staleTime: 30000,
  });

  const { data: archiveDates = [] } = useQuery<string[]>({
    queryKey: [`/api/admin/rooms/${selectedRoomId}/archive-dates`],
    enabled: !!selectedRoomId,
    staleTime: 30000,
  });

  const { data: archivedMessages = [], isLoading } = useQuery<ArchivedMessage[]>({
    queryKey: [`/api/admin/rooms/${selectedRoomId}/archived/${selectedArchiveDate}`, page],
    enabled: !!selectedRoomId && !!selectedArchiveDate,
    staleTime: 10000,
  });

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);

  const handleDownloadArchive = async () => {
    if (!selectedRoomId) return;

    try {
      const response = await fetch(`/api/rooms/${selectedRoomId}/download`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'archive.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading archive:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zpět do administrace
            </Button>
            <h1 className="text-2xl font-bold">Archiv chatů</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Room Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chatové místnosti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rooms.map((room) => (
                  <Button
                    key={room.id}
                    variant={selectedRoomId === room.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      setSelectedArchiveDate(null);
                      setPage(0);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {room.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Archive Dates */}
          {selectedRoomId && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Archivní složky
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {archiveDates.length > 0 ? (
                    archiveDates.map((date) => (
                      <Button
                        key={date}
                        variant={selectedArchiveDate === date ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          setSelectedArchiveDate(date);
                          setPage(0);
                        }}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {new Date(date).toLocaleDateString('cs-CZ')}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-4">
                      Žádné archivní složky
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Archive Content */}
          <div className="lg:col-span-2">
            {selectedRoom && selectedArchiveDate ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Archiv: {selectedRoom.name} - {new Date(selectedArchiveDate).toLocaleDateString('cs-CZ')}
                    </CardTitle>
                    <Button
                      onClick={handleDownloadArchive}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Stáhnout vše
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Načítání...</p>
                    </div>
                  ) : archivedMessages.length > 0 ? (
                    <>
                      <div className="space-y-4 mb-4">
                        {archivedMessages.map((message) => (
                          <div key={message.id} className="border-l-2 border-muted pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{message.characterName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {message.messageType}
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">{message.content}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Původní: {new Date(message.originalCreatedAt).toLocaleString('cs-CZ')}</span>
                              <span>Archivováno: {new Date(message.archivedAt).toLocaleString('cs-CZ')}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(0, page - 1))}
                          disabled={page === 0}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Předchozí
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          Stránka {page + 1}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={archivedMessages.length < limit}
                          className="flex items-center gap-2"
                        >
                          Další
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">V této místnosti nejsou žádné archivované zprávy.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : selectedRoom ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Vyberte archivní složku pro zobrazení zpráv.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Vyberte chatovou místnost pro zobrazení archivu.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
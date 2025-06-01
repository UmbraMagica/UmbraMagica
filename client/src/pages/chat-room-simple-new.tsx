import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Edit3, Save, X, BookOpen, Download, Archive, Trash2, Wand2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RoomDescription } from "@/components/RoomDescription";
import { RoomPresence } from "@/components/RoomPresence";
import { CharacterAvatar } from "@/components/CharacterAvatar";

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
    firstName: string;
    middleName?: string | null;
    lastName: string;
    avatar?: string | null;
  };
}

// Function to highlight words in message content
function renderMessageWithHighlight(content: string, highlightWords?: string, highlightColor?: string) {
  if (!highlightWords || !highlightWords.trim()) {
    return content;
  }

  const words = highlightWords.split(',').map(word => word.trim()).filter(word => word.length > 0);
  if (words.length === 0) {
    return content;
  }

  const colorClass = {
    'yellow': 'bg-yellow-200/60 text-yellow-900 dark:bg-yellow-400/30 dark:text-yellow-100',
    'purple': 'bg-purple-200/60 text-purple-900 dark:bg-purple-400/30 dark:text-purple-100',
    'blue': 'bg-blue-200/60 text-blue-900 dark:bg-blue-400/30 dark:text-blue-100',
    'green': 'bg-green-200/60 text-green-900 dark:bg-green-400/30 dark:text-green-100',
    'red': 'bg-red-200/60 text-red-900 dark:bg-red-400/30 dark:text-red-100',
    'pink': 'bg-pink-200/60 text-pink-900 dark:bg-pink-400/30 dark:text-pink-100'
  }[highlightColor || 'yellow'] || 'bg-yellow-200/60 text-yellow-900 dark:bg-yellow-400/30 dark:text-yellow-100';

  let highlightedContent = content;
  
  words.forEach(word => {
    // Escape special regex characters
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Remove word boundaries - search anywhere in text like Ctrl+F, case insensitive
    const regex = new RegExp(`(${escapedWord})`, 'gi');
    const style = (() => {
      switch (highlightColor || 'yellow') {
        case 'yellow': return 'background-color: rgba(254, 240, 138, 0.6); color: rgb(133, 77, 14);';
        case 'purple': return 'background-color: rgba(196, 181, 253, 0.6); color: rgb(88, 28, 135);';
        case 'blue': return 'background-color: rgba(147, 197, 253, 0.6); color: rgb(30, 58, 138);';
        case 'green': return 'background-color: rgba(134, 239, 172, 0.6); color: rgb(20, 83, 45);';
        case 'red': return 'background-color: rgba(252, 165, 165, 0.6); color: rgb(153, 27, 27);';
        case 'pink': return 'background-color: rgba(244, 164, 252, 0.6); color: rgb(131, 24, 67);';
        default: return 'background-color: rgba(254, 240, 138, 0.6); color: rgb(133, 77, 14);';
      }
    })();
    highlightedContent = highlightedContent.replace(regex, `<span class="inline" style="padding: 1px 3px; border-radius: 3px; box-decoration-break: clone; ${style}">$1</span>`);
  });

  return <span dangerouslySetInnerHTML={{ __html: highlightedContent }} />;
}

export default function ChatRoom() {
  const { roomId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [presentCharacters, setPresentCharacters] = useState<Array<{
    id: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName: string;
  }>>([]);
  const [showSpellDialog, setShowSpellDialog] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<any>(null);
  const [chatCharacter, setChatCharacter] = useState<any>(null);
  
  const currentRoomId = roomId ? parseInt(roomId) : null;

  // All hooks must be at the top level - before any conditional returns
  
  // Fetch user's characters for switching (only alive characters)
  const { data: allUserCharacters = [], isLoading: charactersLoading } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Fetch current room info
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", currentRoomId, "messages"],
    queryFn: () =>
      fetch(`/api/chat/rooms/${currentRoomId}/messages`).then(res => res.json()),
    enabled: !!currentRoomId,
    refetchInterval: 5000,
    staleTime: 0, // Always consider data stale
  });

  // Fetch character's spells - ALWAYS called, enabled conditionally
  const { data: characterSpells = [] } = useQuery<any[]>({
    queryKey: [`/api/characters/${chatCharacter?.id || 0}/spells`],
    enabled: !!chatCharacter?.id && !!user,
  });

  // ALL useEffect hooks must be here at the top level
  
  // Initialize chat character when entering chat room
  useEffect(() => {
    // Filter only alive characters (not in cemetery) and exclude system characters
    const filteredCharacters = allUserCharacters.filter((char: any) => {
      const isAlive = !char.deathDate;
      const isNotSystem = !char.isSystem;
      return isAlive && isNotSystem;
    });
    
    // Sort characters according to user's preferred order
    const userCharacters = (() => {
      if (!user?.characterOrder || !Array.isArray(user.characterOrder)) {
        return filteredCharacters;
      }
      
      const orderMap = new Map(user.characterOrder.map((id, index) => [id, index]));
      
      return [...filteredCharacters].sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    })();

    if (!chatCharacter && userCharacters.length > 0) {
      // Use first available character
      const initialCharacter = userCharacters[0];
      if (initialCharacter) {
        console.log('Setting initial chat character:', initialCharacter.firstName, initialCharacter.lastName);
        setChatCharacter(initialCharacter);
      }
    }
  }, [allUserCharacters, chatCharacter, user]);

  // Clear local messages when room changes
  useEffect(() => {
    if (currentRoomId) {
      setLocalMessages([]);
      // Force refetch of messages for the new room
      queryClient.invalidateQueries({ 
        queryKey: ["/api/chat/rooms", currentRoomId, "messages"],
        exact: true 
      });
    }
  }, [currentRoomId, queryClient]);

  // Update local messages when server messages change
  useEffect(() => {
    if (Array.isArray(messages)) {
      if (messages.length > 0) {
        console.log("Messages data:", messages);
        console.log("Messages loading:", messagesLoading);
        console.log("Current room ID:", currentRoomId);
        
        // Sort messages by creation date (newest first for display)
        const sortedMessages = [...messages].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLocalMessages(sortedMessages);
      } else if (!messagesLoading) {
        // Clear local messages if no messages are returned
        setLocalMessages([]);
      }
    }
  }, [messages, messagesLoading, currentRoomId]);

  // WebSocket connection setup
  useEffect(() => {
    if (!currentRoomId || !user) return;

    const token = localStorage.getItem('ws-token') || Math.random().toString(36).substring(7);
    localStorage.setItem('ws-token', token);

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    
    console.log("Setting up WebSocket connection to:", wsUrl);
    
    const newWs = new WebSocket(wsUrl);
    
    newWs.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      setWs(newWs);
      
      // Join the room
      newWs.send(JSON.stringify({
        type: 'join-room',
        roomId: currentRoomId,
        character: chatCharacter ? {
          id: chatCharacter.id,
          firstName: chatCharacter.firstName,
          middleName: chatCharacter.middleName,
          lastName: chatCharacter.lastName
        } : null
      }));
    };

    newWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === 'new-message') {
          setLocalMessages(prev => {
            const messageExists = prev.some(msg => msg.id === data.message.id);
            if (!messageExists) {
              return [data.message, ...prev].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            }
            return prev;
          });
        } else if (data.type === 'room-update') {
          queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        } else if (data.type === 'character-presence') {
          setPresentCharacters(data.characters || []);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    newWs.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      setWs(null);
    };

    newWs.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      if (newWs.readyState === WebSocket.OPEN) {
        newWs.close();
      }
    };
  }, [currentRoomId, user, chatCharacter, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages]);

  // Filter and sort characters - moved to useEffect above
  const filteredCharacters = allUserCharacters.filter((char: any) => !char.deathDate && !char.isSystem);
  const userCharacters = (() => {
    if (!user?.characterOrder || !Array.isArray(user.characterOrder)) {
      return filteredCharacters;
    }
    
    const orderMap = new Map(user.characterOrder.map((id, index) => [id, index]));
    
    return [...filteredCharacters].sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 999;
      const orderB = orderMap.get(b.id) ?? 999;
      return orderA - orderB;
    });
  })();

  // Current character for chat - NEVER change automatically, only when user explicitly chooses
  const currentCharacter = chatCharacter;
  const currentRoom = rooms.find(room => room.id === currentRoomId);





  // Safety check for user data
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Přihlášení vyžadováno</h2>
          <p className="text-muted-foreground">Pro přístup do chatu se musíte přihlásit.</p>
        </div>
      </div>
    );
  }
  
  // Check if user needs a character (non-admin users need a character)
  const needsCharacter = user?.role !== 'admin';
  
  // Debug information
  console.log('Chat access debug:', {
    userRole: user?.role,
    needsCharacter,
    userCharactersLength: userCharacters.length,
    chatCharacter: chatCharacter?.firstName + ' ' + chatCharacter?.lastName,
    allUserCharacters: allUserCharacters.map(c => ({ id: c.id, name: c.firstName + ' ' + c.lastName, deathDate: c.deathDate }))
  });
  
  // For users who need a character, ensure one is always set
  if (needsCharacter && userCharacters.length > 0 && !chatCharacter) {
    // Use first character directly for rendering, useEffect will set it properly
    const tempCharacter = userCharacters[0];
    console.log('Temporarily using character for render:', tempCharacter.firstName, tempCharacter.lastName);
  }
  
  // Show loading while characters are being fetched
  if (needsCharacter && charactersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Načítání postav...</h2>
          <p className="text-muted-foreground">Prosím počkejte.</p>
        </div>
      </div>
    );
  }

  // If user needs a character but has none available
  if (needsCharacter && userCharacters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Postava nenalezena</h2>
          <p className="text-muted-foreground">Pro přístup do chatu potřebujete aktivní postavu.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Celkem postav: {allUserCharacters.length}, Živých postav: {userCharacters.length}
          </p>
          <Link href="/character/edit">
            <Button className="mt-4">Vytvořit postavu</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Hooks already moved to top of component

  const handleSendMessage = async () => {
    if (!currentRoomId) return;
    
    // For non-admin users, require a character
    if (needsCharacter && !currentCharacter) return;

    try {
      // If spell is selected, cast it with the message (even if message is empty)
      if (selectedSpell) {
        try {
          const response = await fetch("/api/game/cast-spell", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomId: currentRoomId,
              characterId: currentCharacter?.id,
              spellId: selectedSpell.id,
              message: messageInput.trim()
            }),
            credentials: "include",
          });
          
          if (!response.ok) {
            // Try to get the error message from the response
            try {
              const errorData = await response.json();
              throw new Error(errorData.message || "Vaše postava potřebuje hůlku pro sesílání kouzel.");
            } catch {
              throw new Error("Vaše postava potřebuje hůlku pro sesílání kouzel.");
            }
          }
          
          setSelectedSpell(null);
          setMessageInput("");
        } catch (spellError: any) {
          // Re-throw the original error to preserve the server message
          throw spellError;
        }
      } else if (messageInput.trim()) {
        // Send regular message only if there's content
        const messageData = {
          roomId: currentRoomId,
          characterId: currentCharacter?.id,
          content: messageInput.trim(),
          messageType: 'text'
        };
        await apiRequest("POST", "/api/chat/messages", messageData);
        setMessageInput("");
      }
    } catch (error: any) {
      console.log('Cast spell error:', error); // Debug log
      let errorMessage = "Nepodařilo se odeslat zprávu.";
      
      // Use the actual server error message for spell casting errors
      if (selectedSpell && error.message) {
        if (error.message.includes("Character doesn't know this spell")) {
          errorMessage = "Vaše postava nezná toto kouzlo.";
        } else {
          // Use the server's Czech error message directly
          errorMessage = error.message;
        }
        console.log('SPELL ERROR DETECTED - Using server message:', errorMessage);
      } else if (error.message && error.message.includes("Character doesn't know this spell")) {
        errorMessage = "Vaše postava nezná toto kouzlo.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('Final error message:', errorMessage); // Debug log
      
      // Show error as both toast and system message in chat
      toast({
        title: "Chyba",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Also add error as a system message to the chat
      const systemMessage: ChatMessage = {
        id: Date.now(),
        roomId: currentRoomId,
        characterId: 0, // Use 0 for system messages
        content: `🚫 ${errorMessage}`,
        messageType: 'system',
        createdAt: new Date().toISOString(),
        character: {
          firstName: 'Systém',
          middleName: null,
          lastName: '',
          avatar: null
        }
      };
      setLocalMessages(prev => [systemMessage, ...prev]);
      
      // Clear the selected spell to reset the state
      setSelectedSpell(null);
    }
  };

  const handleDiceRoll = async () => {
    if (!currentCharacter || !currentRoomId) return;

    try {
      await apiRequest("POST", "/api/game/dice-roll", {
        roomId: currentRoomId,
        characterId: currentCharacter.id
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se hodit kostkou.",
        variant: "destructive",
      });
    }
  };

  const handleCoinFlip = async () => {
    if (!currentCharacter || !currentRoomId) return;

    try {
      await apiRequest("POST", "/api/game/coin-flip", {
        roomId: currentRoomId,
        characterId: currentCharacter.id
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se hodit mincí.",
        variant: "destructive",
      });
    }
  };

  const handleSelectSpell = (spell: any) => {
    setSelectedSpell(spell);
    setShowSpellDialog(false);
    toast({
      title: "Kouzlo vybráno",
      description: `${spell.name} bude sesláno s dalším příspěvkem`,
    });
  };

  const handleDownloadChat = async () => {
    if (!currentRoomId) return;

    try {
      const response = await fetch(`/api/rooms/${currentRoomId}/download`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'chat.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Úspěch",
          description: "Chat byl stažen",
        });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se stáhnout chat.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveMessages = async () => {
    if (!currentRoomId || user?.role !== 'admin') return;

    try {
      const response = await apiRequest("POST", `/api/chat/rooms/${currentRoomId}/archive`);
      const data = await response.json();
      
      toast({
        title: "Úspěch",
        description: data.message,
      });
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/chat/rooms/${currentRoomId}/messages`] });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se archivovat zprávy.",
        variant: "destructive",
      });
    }
  };

  const handleClearMessages = async () => {
    if (!currentRoomId || user?.role !== 'admin') return;

    if (!confirm('Opravdu chcete smazat všechny zprávy z tohoto chatu? Zprávy budou nejprve automaticky archivovány a poté smazány z aktivního chatu.')) {
      return;
    }

    try {
      // First archive messages
      const archiveResponse = await apiRequest("POST", `/api/chat/rooms/${currentRoomId}/archive`);
      const archiveData = await archiveResponse.json();
      
      // Then clear visible messages
      const clearResponse = await apiRequest("DELETE", `/api/admin/rooms/${currentRoomId}/clear`);
      const clearData = await clearResponse.json();
      
      toast({
        title: "Úspěch",
        description: `${archiveData.message} Zprávy byly poté smazány z aktivního chatu.`,
      });
      
      // Refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/chat/rooms/${currentRoomId}/messages`] });
      setLocalMessages([]);
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se archivovat nebo smazat zprávy.",
        variant: "destructive",
      });
    }
  };

  const getCharacterInitials = (character: { firstName: string; lastName: string }) => {
    return `${character.firstName.charAt(0)}${character.lastName.charAt(0)}`;
  };

  const getCurrentUserInitials = () => {
    return `${currentCharacter.firstName.charAt(0)}${currentCharacter.lastName.charAt(0)}`;
  };

  const handleEditDescription = () => {
    setEditedDescription(currentRoom?.longDescription || "");
    setIsEditingDescription(true);
  };

  const handleEditName = () => {
    setEditedName(currentRoom?.name || "");
    setIsEditingName(true);
  };

  const handleSaveDescription = async () => {
    if (!currentRoom) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/chat/rooms/${currentRoom.id}`, {
        longDescription: editedDescription
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      
      setIsEditingDescription(false);
      toast({
        title: "Úspěch",
        description: "Popis místnosti byl aktualizován.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat popis místnosti.",
        variant: "destructive",
      });
    }
  };

  const handleSaveName = async () => {
    if (!currentRoom) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/chat/rooms/${currentRoom.id}`, {
        name: editedName
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
      
      setIsEditingName(false);
      toast({
        title: "Úspěch",
        description: "Název místnosti byl aktualizován.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat název místnosti.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
    setIsEditingName(false);
    setEditedName("");
  };

  // Show loading while rooms are being fetched
  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítám místnost...</p>
        </div>
      </div>
    );
  }

  // Only show room not found after rooms are loaded and room is still not found
  if (!roomsLoading && !currentRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Místnost nenalezena</h2>
          <p className="text-muted-foreground">Požadovaná chatovací místnost neexistuje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex-none border-b bg-card p-4 z-10 h-[84px] flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/chat')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Opustit chat
            </Button>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-bold"
                    placeholder="Název místnosti"
                  />
                  <Button
                    onClick={handleSaveName}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{currentRoom.name}</h1>
                    {currentRoom.description && (
                      <p className="text-sm text-muted-foreground mt-1">{currentRoom.description}</p>
                    )}
                  </div>
                  {user?.role === 'admin' && (
                    <Button
                      onClick={handleEditName}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 opacity-70 hover:opacity-100"
                      title="Upravit název místnosti"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Chat Management Buttons */}
            <Button
              onClick={handleDownloadChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              title="Stáhnout obsah chatu"
            >
              <Download className="h-4 w-4" />
              Stáhnout
            </Button>
            
            {user?.role === 'admin' && (
              <>
                <Button
                  onClick={handleArchiveMessages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Archivovat zprávy (přesun do archivu)"
                >
                  <Archive className="h-4 w-4" />
                  Archivovat
                </Button>
                
                <Button
                  onClick={handleClearMessages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  title="Archivovat a smazat zprávy (automaticky archivuje před smazáním)"
                >
                  <Trash2 className="h-4 w-4" />
                  Archivovat a smazat
                </Button>
              </>
            )}
            
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Připojeno' : 'Odpojeno'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {localMessages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <CharacterAvatar character={message.character} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <Link 
                    href={`/characters/${message.characterId}`}
                    className="font-medium text-sm hover:text-primary hover:underline cursor-pointer"
                  >
                    {message.character.firstName} {message.character.lastName}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString('cs-CZ', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {/* Character change button - show for own messages within 5 minutes */}
                  {(() => {
                    const messageTime = new Date(message.createdAt);
                    const now = new Date();
                    const timeDiffMinutes = (now.getTime() - messageTime.getTime()) / (1000 * 60);
                    const isOwnMessage = userCharacters.some((char: any) => char.id === message.characterId);
                    const canChangeCharacter = isOwnMessage && timeDiffMinutes <= 5;
                    
                    return canChangeCharacter && userCharacters.length > 1 && (
                      <div className="ml-2">
                        <select 
                          className="text-xs bg-muted/50 border border-border rounded px-2 py-1"
                          value={message.characterId}
                          onChange={(e) => {
                            const newCharacterId = parseInt(e.target.value);
                            if (newCharacterId !== message.characterId) {
                              apiRequest("PATCH", `/api/chat/messages/${message.id}/character`, {
                                characterId: newCharacterId
                              })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", currentRoomId, "messages"] });
                                  const newCharacter = userCharacters.find((char: any) => char.id === newCharacterId);
                                  toast({
                                    title: "Postava změněna",
                                    description: `Zpráva nyní patří postavě ${newCharacter?.firstName} ${newCharacter?.lastName}`,
                                  });
                                })
                                .catch(() => {
                                  toast({
                                    title: "Chyba",
                                    description: "Nepodařilo se změnit postavu zprávy",
                                    variant: "destructive",
                                  });
                                });
                            }
                          }}
                        >
                          {userCharacters.map((character: any) => (
                            <option key={character.id} value={character.id}>
                              {character.firstName} {character.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
                <p className={`text-sm break-words whitespace-pre-wrap ${
                  message.character.firstName === 'Správa' && message.character.lastName === 'ubytování' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-foreground'
                }`}>
                  {renderMessageWithHighlight(message.content, user?.highlightWords, user?.highlightColor)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Two Row Layout with Avatar on Left */}
        <div className="flex-none border-t bg-card p-3">
          <div className="flex items-start gap-3">
            {/* Character Avatar - spans both rows */}
            {currentCharacter && (
              <div className="relative flex-shrink-0">
                <CharacterAvatar character={currentCharacter} size="lg" />
                {/* Character selector dropdown for multiple characters */}
                {userCharacters.length > 1 && (
                  <select
                    value={chatCharacter?.id || ''}
                    onChange={(e) => {
                      const selectedChar = userCharacters.find((char: any) => char.id === parseInt(e.target.value));
                      if (selectedChar) setChatCharacter(selectedChar);
                    }}
                    className="absolute -bottom-1 -left-1 text-xs border rounded bg-background w-6 h-6 text-center opacity-80 hover:opacity-100"
                    title="Změnit postavu"
                  >
                    {userCharacters.map((character: any) => (
                      <option key={character.id} value={character.id}>
                        {character.firstName[0]}{character.lastName[0]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
            
            {/* Right side with two rows */}
            <div className="flex-1 space-y-2">
              {/* Top row - Message input */}
              <div className="flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Napište zprávu..."
                  className="flex-1 min-h-[2.5rem] max-h-[10rem] resize-none text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  maxLength={5000}
                  rows={1}
                  style={{
                    height: 'auto',
                    minHeight: '2.5rem',
                    maxHeight: '10rem'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!isConnected || (!messageInput.trim() && !selectedSpell) || messageInput.length > 5000}
                  size="sm"
                  className="h-10 px-4 text-sm"
                >
                  {selectedSpell ? "Seslat" : "Odeslat"}
                </Button>
              </div>
              
              {/* Bottom row - Character selector, action buttons and counter */}
              <div className="flex items-center justify-between">
                {/* Left side - Character selector and action buttons */}
                <div className="flex items-center gap-2">
                  {userCharacters.length > 1 ? (
                    <select
                      value={chatCharacter?.id || ''}
                      onChange={(e) => {
                        const selectedChar = userCharacters.find((char: any) => char.id === parseInt(e.target.value));
                        if (selectedChar) setChatCharacter(selectedChar);
                      }}
                      className="text-sm border rounded px-2 py-1 bg-background"
                    >
                      {userCharacters.map((character: any) => (
                        <option key={character.id} value={character.id}>
                          {character.firstName} {character.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {currentCharacter?.firstName} {currentCharacter?.lastName}
                    </span>
                  )}
                  
                  {/* Action buttons as tiles with text */}
                  <Button
                    onClick={handleDiceRoll}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    title="Hodit kostkou (1d10)"
                  >
                    🎲 Kostka
                  </Button>
                  <Button
                    onClick={handleCoinFlip}
                    disabled={!isConnected}
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    title="Hodit mincí (1d2)"
                  >
                    🪙 Mince
                  </Button>
                  {selectedSpell ? (
                    <Button
                      onClick={() => setSelectedSpell(null)}
                      variant="default"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      title="Zrušit vybrané kouzlo"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      {selectedSpell.name}
                      <X className="h-2 w-2 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowSpellDialog(true)}
                      disabled={!isConnected || characterSpells.length === 0}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      title="Vybrat kouzlo"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Kouzla
                    </Button>
                  )}
                </div>
                
                {/* Right side - Character counter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {messageInput.length}/5000
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Room Description and Presence */}
      <div className="w-80 border-l bg-muted/30 flex flex-col">
        {/* Panel Header - matches main header */}
        <div className="flex-none p-4 border-b bg-card h-[84px] flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Informace o místnosti</span>
          </div>
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              {isEditingDescription ? (
                <>
                  <Button
                    onClick={handleSaveDescription}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Uložit
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Zrušit
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleEditDescription}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit3 className="h-4 w-4" />
                  Upravit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Room Presence */}
          <RoomPresence roomId={currentRoomId!} onlineCharacters={presentCharacters} />
          
          {/* Room Description */}
          {(currentRoom.longDescription || user?.role === 'admin') && (
            <div>
              {isEditingDescription ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-foreground">Popis místnosti</div>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Zadejte popis místnosti..."
                    className="min-h-64 text-sm w-full resize-none"
                    rows={12}
                  />
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    <div className="font-medium mb-1">Formátování:</div>
                    <div>**tučné** → <strong>tučné</strong></div>
                    <div>*kurzíva* → <em>kurzíva</em></div>
                    <div>__podtržené__ → <u>podtržené</u></div>
                    <div className="mt-2">
                      <div className="font-medium mb-1">Odkazy na chaty:</div>
                      <div>[Ulice] → vytvoří odkaz na chat "Ulice"</div>
                      <div>[Příčná ulice] → vytvoří odkaz na kategorie</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-foreground mb-2">Popis místnosti</div>
                  {currentRoom.longDescription ? (
                    <RoomDescription description={currentRoom.longDescription} roomName={currentRoom.name} />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {user?.role === 'admin' ? "Žádný popis místnosti. Klikněte na upravit pro přidání popisu." : ""}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spell Selection Dialog */}
      <Dialog open={showSpellDialog} onOpenChange={setShowSpellDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Vyberte kouzlo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {characterSpells.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Vaše postava nezná žádná kouzla.
              </div>
            ) : (
              characterSpells.map((characterSpell: any) => (
                <Card key={characterSpell.spell.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleSelectSpell(characterSpell.spell)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{characterSpell.spell.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{characterSpell.spell.description}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {characterSpell.spell.category}
                          </span>
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {characterSpell.spell.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
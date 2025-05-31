import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Crown, 
  Users, 
  UsersRound, 
  Circle, 
  MessageCircle,
  Gauge,
  Settings,
  User,
  LogOut,
  Shield,
  Plus,
  Edit,
  ArrowUp,
  Book,
  UserPlus,
  Archive,
  Home,
  Skull,
  AlertTriangle,
  Heart,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Admin() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // State variables
  const [newInviteCode, setNewInviteCode] = useState("");
  const [isUserManagementCollapsed, setIsUserManagementCollapsed] = useState(false);
  const [isChatManagementCollapsed, setIsChatManagementCollapsed] = useState(false);
  
  // Chat management state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomLongDescription, setNewRoomLongDescription] = useState("");
  const [newRoomCategoryId, setNewRoomCategoryId] = useState<number | null>(null);
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [newRoomIsPublic, setNewRoomIsPublic] = useState(true);

  // Data queries
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'] });
  const { data: inviteCodes = [] } = useQuery({ queryKey: ['/api/admin/invite-codes'] });
  const { data: chatCategories = [] } = useQuery({ queryKey: ['/api/admin/chat-categories'] });

  // Generate random invite code function
  const generateRandomInviteCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setNewInviteCode(result);
  };

  // Create invite code mutation
  const createInviteCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/admin/invite-codes", { code });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Zvací kód byl vytvořen",
      });
      setNewInviteCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invite-codes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se vytvořit zvací kód",
        variant: "destructive",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (category: any) => {
      return apiRequest("POST", "/api/admin/chat-categories", category);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Kategorie/oblast byla vytvořena",
      });
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryParentId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se vytvořit kategorii",
        variant: "destructive",
      });
    },
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (room: any) => {
      return apiRequest("POST", "/api/admin/chat-rooms", room);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Místnost byla vytvořena",
      });
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomLongDescription("");
      setNewRoomCategoryId(null);
      setNewRoomPassword("");
      setNewRoomIsPublic(true);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se vytvořit místnost",
        variant: "destructive",
      });
    },
  });

  const handleCreateInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteCode.trim()) return;
    createInviteCodeMutation.mutate(newInviteCode.trim());
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k přístupu do admin rozhraní.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Admin Navigation */}
      <nav className="bg-card border-b border-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-accent to-orange-600 rounded-full flex items-center justify-center mr-3">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl fantasy-font font-bold text-accent">RPG Realm Admin</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-accent/20 text-accent">
                <Shield className="mr-1 h-3 w-3" />
                ADMIN
              </Badge>
              <div className="text-sm text-muted-foreground">{user?.username}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/')}
                className="text-muted-foreground hover:text-accent"
              >
                <Home className="mr-2 h-4 w-4" />
                Hlavní stránka
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8">
          {/* User Management */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer"
                    onClick={() => setIsUserManagementCollapsed(!isUserManagementCollapsed)}>
                  <Settings className="text-accent mr-3 h-5 w-5" />
                  Správa uživatelů ({Array.isArray(users) ? users.length : 0})
                  {isUserManagementCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
                {!isUserManagementCollapsed && (
                  <div className="space-y-3">
                    <form onSubmit={handleCreateInviteCode} className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Nový zvací kód"
                        value={newInviteCode}
                        onChange={(e) => setNewInviteCode(e.target.value)}
                        className="w-40"
                      />
                      <Button 
                        type="button"
                        size="sm" 
                        variant="outline"
                        onClick={generateRandomInviteCode}
                        className="whitespace-nowrap"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Generovat
                      </Button>
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={createInviteCodeMutation.isPending}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Vytvořit
                      </Button>
                    </form>
                    
                    {/* Display existing invite codes */}
                    {Array.isArray(inviteCodes) && inviteCodes.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-foreground mb-2">Existující zvací kódy:</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {inviteCodes.map((code: any) => (
                            <div key={code.id} className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm">
                              <div className="flex items-center space-x-2">
                                <code className="font-mono bg-muted px-2 py-1 rounded text-xs">
                                  {code.code}
                                </code>
                                <Badge variant={code.isUsed ? "secondary" : "default"}>
                                  {code.isUsed ? "Použito" : "Aktivní"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(code.createdAt).toLocaleDateString('cs-CZ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Management */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer"
                    onClick={() => setIsChatManagementCollapsed(!isChatManagementCollapsed)}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Správa chatů
                  {isChatManagementCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </h2>
              </div>

              {!isChatManagementCollapsed && (
                <div className="space-y-6">
                  {/* Create Category */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vytvořit kategorii/oblast</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoryName">Název</Label>
                        <Input
                          id="categoryName"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Název kategorie nebo oblasti"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parentCategory">Typ a umístění</Label>
                        <Select onValueChange={(value) => setNewCategoryParentId(value === "none" ? null : parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte typ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">🌍 Hlavní kategorie (1. úroveň)</SelectItem>
                            {Array.isArray(chatCategories) &&
                              chatCategories
                                .filter((category: any) => category.parentId === null)
                                .map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    📍 Oblast v: {category.name}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Popis (volitelný)</Label>
                      <Textarea
                        id="categoryDescription"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Krátký popis kategorie nebo oblasti"
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        createCategoryMutation.mutate({
                          name: newCategoryName.trim(),
                          description: newCategoryDescription.trim() || null,
                          parentId: newCategoryParentId,
                          sortOrder: 0,
                        });
                      }}
                      disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Vytvořit kategorii
                    </Button>
                  </div>

                  {/* Create Room */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Vytvořit místnost</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="roomName">Název místnosti</Label>
                        <Input
                          id="roomName"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="Název místnosti"
                        />
                      </div>
                      <div>
                        <Label htmlFor="roomCategory">Oblast (kategorie 2. úrovně)</Label>
                        <Select 
                          value={newRoomCategoryId?.toString() || ""} 
                          onValueChange={(value) => setNewRoomCategoryId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte oblast" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(chatCategories) &&
                              chatCategories
                                .filter((category: any) => category.parentId !== null)
                                .map((category: any) => {
                                  const parent = chatCategories.find((c: any) => c.id === category.parentId);
                                  return (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {parent?.name} → {category.name}
                                    </SelectItem>
                                  );
                                })}
                            {Array.isArray(chatCategories) && 
                              chatCategories.filter((category: any) => category.parentId !== null).length === 0 && (
                              <SelectItem value="no-areas" disabled>
                                Nejsou k dispozici žádné oblasti. Nejprve vytvořte oblast (kategorie 2. úrovně).
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="roomDescription">Krátký popis</Label>
                      <Input
                        id="roomDescription"
                        value={newRoomDescription}
                        onChange={(e) => setNewRoomDescription(e.target.value)}
                        placeholder="Krátký popis místnosti"
                      />
                    </div>
                    <div>
                      <Label htmlFor="roomLongDescription">Dlouhý popis</Label>
                      <Textarea
                        id="roomLongDescription"
                        value={newRoomLongDescription}
                        onChange={(e) => setNewRoomLongDescription(e.target.value)}
                        placeholder="Detailní popis místnosti"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="roomIsPublic"
                        checked={newRoomIsPublic}
                        onChange={(e) => setNewRoomIsPublic(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="roomIsPublic">Veřejná místnost (bez hesla)</Label>
                    </div>
                    {!newRoomIsPublic && (
                      <div>
                        <Label htmlFor="roomPassword">Heslo místnosti</Label>
                        <Input
                          id="roomPassword"
                          type="password"
                          value={newRoomPassword}
                          onChange={(e) => setNewRoomPassword(e.target.value)}
                          placeholder="Heslo pro přístup"
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => {
                        if (!newRoomName.trim() || !newRoomCategoryId) return;
                        createRoomMutation.mutate({
                          name: newRoomName.trim(),
                          description: newRoomDescription.trim() || null,
                          longDescription: newRoomLongDescription.trim() || null,
                          categoryId: newRoomCategoryId,
                          password: newRoomIsPublic ? null : newRoomPassword.trim() || null,
                          isPublic: newRoomIsPublic,
                          sortOrder: 0,
                        });
                      }}
                      disabled={!newRoomName.trim() || !newRoomCategoryId || createRoomMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Vytvořit místnost
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
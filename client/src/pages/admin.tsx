import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MessageSquare,
  Trash2,
  Cog
} from "lucide-react";

export default function Admin() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // State variables
  const [newInviteCode, setNewInviteCode] = useState("");
  const [killCharacterData, setKillCharacterData] = useState<{ id: number; name: string } | null>(null);
  const [deathReason, setDeathReason] = useState("");
  const [showConfirmKill, setShowConfirmKill] = useState(false);
  const [isCemeteryCollapsed, setIsCemeteryCollapsed] = useState(true);
  const [isLiveCharactersCollapsed, setIsLiveCharactersCollapsed] = useState(false);
  const [isAdminActivityCollapsed, setIsAdminActivityCollapsed] = useState(true);
  const [isCharacterRequestsCollapsed, setIsCharacterRequestsCollapsed] = useState(false);
  const [isUserManagementCollapsed, setIsUserManagementCollapsed] = useState(false);
  const [isChatManagementCollapsed, setIsChatManagementCollapsed] = useState(false);
  const [banUserData, setBanUserData] = useState<{ id: number; username: string } | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState<{ id: number; username: string } | null>(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [banReason, setBanReason] = useState("");

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
  const { data: allCharacters = [] } = useQuery({ queryKey: ['/api/characters/all'] });
  const { data: characterRequests = [] } = useQuery({ queryKey: ['/api/admin/character-requests'] });
  const { data: adminActivityLog = [] } = useQuery({ queryKey: ['/api/admin/activity-log'] });
  const { data: inviteCodes = [] } = useQuery({ queryKey: ['/api/admin/invite-codes'] });
  const { data: chatCategories = [] } = useQuery({ queryKey: ['/api/admin/chat-categories'] });
  const { data: influenceBar = {} } = useQuery({ queryKey: ['/api/influence-bar'] });

  // Generate random invite code
  const generateRandomInviteCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setNewInviteCode(result);
  };

  // Mutations
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

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Role uživatele byla změněna",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit roli",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("POST", `/api/admin/users/${userId}/reset-password`, {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Úspěch",
        description: `Heslo bylo resetováno. Nové dočasné heslo: ${data.newPassword}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se resetovat heslo",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banReason }: { userId: number; banReason: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/ban`, { reason: banReason });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Uživatel byl zabanován",
      });
      setBanUserData(null);
      setBanReason("");
      setShowConfirmBan(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zabanovat uživatele",
        variant: "destructive",
      });
    },
  });

  const killCharacterMutation = useMutation({
    mutationFn: async ({ characterId, deathReason }: { characterId: number; deathReason: string }) => {
      return apiRequest("POST", `/api/admin/characters/${characterId}/kill`, { deathReason });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Postava byla usmrcena",
      });
      setKillCharacterData(null);
      setDeathReason("");
      setShowConfirmKill(false);
      queryClient.invalidateQueries({ queryKey: ['/api/characters/all'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se usmrtit postavu",
        variant: "destructive",
      });
    },
  });

  const approveCharacterMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest("POST", `/api/admin/character-requests/${requestId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Postava byla schválena",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/character-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/characters/all'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se schválit postavu",
        variant: "destructive",
      });
    },
  });

  const rejectCharacterMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/character-requests/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Postava byla zamítnuta",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/character-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zamítnout postavu",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: any) => {
      return apiRequest("POST", "/api/admin/chat-categories", category);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Kategorie byla vytvořena",
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

  // Event handlers
  const handleCreateInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteCode.trim()) return;
    createInviteCodeMutation.mutate(newInviteCode.trim());
  };

  const toggleUserRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleBanUser = (userId: number, username: string) => {
    setBanUserData({ id: userId, username });
    setBanReason("");
    setShowConfirmBan(false);
  };

  const confirmBanUser = () => {
    if (!banUserData || !banReason.trim()) {
      toast({
        title: "Chyba",
        description: "Důvod banu je povinný",
        variant: "destructive",
      });
      return;
    }

    if (!showConfirmBan) {
      setShowConfirmBan(true);
      return;
    }

    banUserMutation.mutate({
      userId: banUserData.id,
      banReason: banReason.trim()
    });
  };

  const handleResetPassword = (userId: number, username: string) => {
    if (confirm(`Opravdu chcete resetovat heslo pro uživatele ${username}? Bude vygenerováno nové dočasné heslo.`)) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const confirmKillCharacter = () => {
    if (!killCharacterData || !deathReason.trim()) {
      toast({
        title: "Chyba",
        description: "Důvod smrti je povinný",
        variant: "destructive",
      });
      return;
    }

    if (!showConfirmKill) {
      setShowConfirmKill(true);
      return;
    }

    killCharacterMutation.mutate({
      characterId: killCharacterData.id,
      deathReason: deathReason.trim()
    });
  };

  const handleKillCharacter = (characterId: number, characterName: string) => {
    setKillCharacterData({ id: characterId, name: characterName });
    setDeathReason("");
    setShowConfirmKill(false);
  };

  const handleApproveCharacter = (requestId: number) => {
    approveCharacterMutation.mutate(requestId);
  };

  const handleRejectCharacter = (requestId: number) => {
    const reason = prompt("Zadejte důvod zamítnutí:");
    if (reason) {
      rejectCharacterMutation.mutate({ requestId, reason });
    }
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
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Button variant="ghost" className="text-accent hover:text-orange-400" onClick={() => setLocation('/')}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent">
                  <Users className="mr-2 h-4 w-4" />
                  Uživatelé
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent">
                  <UsersRound className="mr-2 h-4 w-4" />
                  Postavy
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-foreground hover:text-accent"
                  onClick={() => setLocation('/chat-categories')}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chaty
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-accent/20 text-accent">
                  <Shield className="mr-1 h-3 w-3" />
                  ADMIN
                </Badge>
                <div className="text-sm text-muted-foreground">{user?.username}</div>
              </div>
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
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400">Uživatelé</h3>
                  <p className="text-2xl font-bold text-foreground">{Array.isArray(users) ? users.length : 0}</p>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(users) ? users.filter((u: any) => u.role === 'admin').length : 0} adminů
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Postavy</h3>
                  <p className="text-2xl font-bold text-foreground">{Array.isArray(allCharacters) ? allCharacters.filter((c: any) => !c.deathDate).length : 0}</p>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(allCharacters) ? allCharacters.filter((c: any) => c.deathDate).length : 0} mrtvých
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <UsersRound className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-purple-400">Influence Bar</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="text-xs font-bold text-red-400">G: {(influenceBar as any)?.grindelwaldPoints || 0}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-blue-500" 
                        style={{ 
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${
                            (((influenceBar as any)?.grindelwaldPoints || 0) / 
                            (((influenceBar as any)?.grindelwaldPoints || 0) + ((influenceBar as any)?.dumbledorePoints || 0))) * 100
                          }%, #3b82f6 ${
                            (((influenceBar as any)?.grindelwaldPoints || 0) / 
                            (((influenceBar as any)?.grindelwaldPoints || 0) + ((influenceBar as any)?.dumbledorePoints || 0))) * 100
                          }%, #3b82f6 100%)` 
                        }}
                      />
                    </div>
                    <div className="text-xs font-bold text-blue-400">D: {(influenceBar as any)?.dumbledorePoints || 0}</div>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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

              {!isUserManagementCollapsed && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.isArray(users) && users
                    .sort((a: any, b: any) => {
                      if (a.role === 'admin' && b.role !== 'admin') return -1;
                      if (a.role !== 'admin' && b.role === 'admin') return 1;
                      return a.username.localeCompare(b.username, 'cs');
                    })
                    .map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === "admin" 
                            ? "bg-gradient-to-br from-accent to-orange-600" 
                            : "bg-gradient-to-br from-primary to-secondary"
                        }`}>
                          {user.role === "admin" ? (
                            <Crown className="text-white h-5 w-5" />
                          ) : (
                            <Users className="text-white h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={
                          user.role === "admin" 
                            ? "bg-accent/20 text-accent" 
                            : "bg-blue-500/20 text-blue-400"
                        }>
                          {user.role.toUpperCase()}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserRole(user.id, user.role)}
                            disabled={updateRoleMutation.isPending}
                            className="text-accent hover:text-secondary"
                            title="Změnit roli"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(user.id, user.username)}
                            disabled={resetPasswordMutation.isPending}
                            className="text-blue-400 hover:text-blue-300"
                            title="Resetovat heslo"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          {user.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBanUser(user.id, user.username)}
                              disabled={banUserMutation.isPending}
                              className="text-red-400 hover:text-red-300"
                              title="Zabanovat uživatele"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other sections would continue here... */}
        </div>

        {/* Dialogs */}
        {killCharacterData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Usmrtit postavu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Opravdu chcete usmrtit postavu <strong>{killCharacterData.name}</strong>?
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deathReason">Důvod smrti (povinný)</Label>
                  <Textarea
                    id="deathReason"
                    value={deathReason}
                    onChange={(e) => setDeathReason(e.target.value)}
                    placeholder="Zadejte důvod smrti..."
                    rows={3}
                  />
                </div>

                {showConfirmKill && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">
                      ⚠️ Poslední potvrzení: Klikněte znovu pro potvrzení smrti postavy
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setKillCharacterData(null);
                      setDeathReason("");
                      setShowConfirmKill(false);
                    }}
                    className="flex-1"
                  >
                    Zrušit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmKillCharacter}
                    disabled={killCharacterMutation.isPending || !deathReason.trim()}
                    className="flex-1"
                  >
                    {showConfirmKill ? "POTVRDIT SMRT" : "Usmrtit postavu"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {banUserData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Zabanovat uživatele</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Opravdu chcete zabanovat uživatele <strong>{banUserData.username}</strong>?
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="banReason">Důvod banu (povinný)</Label>
                  <Textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Zadejte důvod banu..."
                    rows={3}
                  />
                </div>

                {showConfirmBan && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">
                      ⚠️ Poslední potvrzení: Klikněte znovu pro potvrzení banu uživatele
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBanUserData(null);
                      setBanReason("");
                      setShowConfirmBan(false);
                    }}
                    className="flex-1"
                  >
                    Zrušit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmBanUser}
                    disabled={banUserMutation.isPending || !banReason.trim()}
                    className="flex-1"
                  >
                    {showConfirmBan ? "POTVRDIT ZÁKAZ" : "Zabanovat uživatele"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
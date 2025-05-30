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
  ChevronUp
} from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  characters: any[];
}

export default function Admin() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [newInviteCode, setNewInviteCode] = useState("");
  const [killCharacterData, setKillCharacterData] = useState<{ id: number; name: string } | null>(null);
  const [deathReason, setDeathReason] = useState("");
  const [showConfirmKill, setShowConfirmKill] = useState(false);
  const [isCemeteryCollapsed, setIsCemeteryCollapsed] = useState(false);
  const [isLiveCharactersCollapsed, setIsLiveCharactersCollapsed] = useState(false);
  const [isAdminActivityCollapsed, setIsAdminActivityCollapsed] = useState(false);
  const [isCharacterRequestsCollapsed, setIsCharacterRequestsCollapsed] = useState(false);
  const [isUserManagementCollapsed, setIsUserManagementCollapsed] = useState(false);
  const [banUserData, setBanUserData] = useState<{ id: number; username: string } | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState<{ id: number; username: string } | null>(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [banReason, setBanReason] = useState("");

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/users"],
    staleTime: 30000,
  });

  const { data: characterRequests = [] } = useQuery({
    queryKey: ["/api/admin/character-requests"],
    staleTime: 30000,
  });

  const { data: adminActivityLog = [] } = useQuery({
    queryKey: ["/api/admin/activity-log"],
    staleTime: 30000,
  });

  // Fetch all characters for cemetery management
  const { data: allCharacters = [] } = useQuery({
    queryKey: ["/api/characters/all"],
    staleTime: 30000,
  });

  const createInviteCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/admin/invite-codes", { code });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Zvací kód byl vytvořen",
      });
      setNewInviteCode("");
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
      const response = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Role byla aktualizována",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat roli",
        variant: "destructive",
      });
    },
  });

  const approveCharacterRequestMutation = useMutation({
    mutationFn: async ({ requestId, reviewNote }: { requestId: number; reviewNote?: string }) => {
      const response = await apiRequest("POST", `/api/admin/character-requests/${requestId}/approve`, { reviewNote });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Žádost o postavu byla schválena",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/character-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-log"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se schválit žádost",
        variant: "destructive",
      });
    },
  });

  const rejectCharacterRequestMutation = useMutation({
    mutationFn: async ({ requestId, reviewNote }: { requestId: number; reviewNote: string }) => {
      const response = await apiRequest("POST", `/api/admin/character-requests/${requestId}/reject`, { reviewNote });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Žádost o postavu byla zamítnuta",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/character-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-log"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zamítnout žádost",
        variant: "destructive",
      });
    },
  });

  const killCharacterMutation = useMutation({
    mutationFn: async ({ characterId, deathReason }: { characterId: number; deathReason: string }) => {
      const response = await apiRequest("POST", `/api/admin/characters/${characterId}/kill`, { deathReason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Postava byla označena jako zemřelá",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cemetery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-log"] });
      setKillCharacterData(null);
      setDeathReason("");
      setShowConfirmKill(false);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se označit postavu jako zemřelou",
        variant: "destructive",
      });
    },
  });

  const resurrectCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/revive`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Postava byla oživena",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cemetery"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-log"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se oživit postavu",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banReason }: { userId: number; banReason: string }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { banReason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Uživatel byl zabanován",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-log"] });
      setBanUserData(null);
      setBanReason("");
      setShowConfirmBan(false);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zabanovat uživatele",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Úspěch",
        description: `Heslo bylo resetováno na: ${data.newPassword}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-log"] });
      setResetPasswordData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se resetovat heslo",
        variant: "destructive",
      });
    },
  });

  const handleKillCharacter = (characterId: number, characterName: string) => {
    setKillCharacterData({ id: characterId, name: characterName });
    setDeathReason("");
    setShowConfirmKill(false);
  };

  const handleResurrectCharacter = (characterId: number, characterName: string) => {
    if (confirm(`Opravdu chcete oživit postavu ${characterName}? Tato akce odstraní datum smrti a postava se znovu stane aktivní.`)) {
      resurrectCharacterMutation.mutate(characterId);
    }
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
        description: "Důvod zákazu je povinný",
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
      deathReason: deathReason.trim(),
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
      toast({
        title: "Odhlášení",
        description: "Byli jste úspěšně odhlášeni",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odhlásit",
        variant: "destructive",
      });
    }
  };

  const handleCreateInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInviteCode || newInviteCode.length < 6) {
      toast({
        title: "Chyba",
        description: "Zvací kód musí mít alespoň 6 znaků",
        variant: "destructive",
      });
      return;
    }
    createInviteCodeMutation.mutate(newInviteCode);
  };

  const toggleUserRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const stats = {
    totalUsers: users.length,
    activeCharacters: users.reduce((sum, user) => sum + user.characters.length, 0),
    onlineNow: Math.floor(users.length * 0.3), // Mock online count
    activeChats: 5,
  };

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
                title="Přepnout na uživatelské rozhraní"
              >
                <Home className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl fantasy-font font-bold text-accent mb-2">
            Administrátorský panel
          </h1>
          <p className="text-muted-foreground">Správa uživatelů, postav a herního prostředí RPG Realm.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/20 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Celkem uživatelů</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                  <UsersRound className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aktivní postavy</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeCharacters}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-accent/20 text-accent">
                  <Circle className="h-6 w-6 fill-current" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Online nyní</p>
                  <p className="text-2xl font-bold text-foreground">{stats.onlineNow}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aktivní chaty</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeChats}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => setLocation('/admin/archive')}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-amber-500/20 text-amber-400">
                  <Archive className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-foreground">Archiv zpráv</p>
                  <p className="text-sm text-muted-foreground">Prohlížet archivované chaty</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <Settings className="text-accent mr-3 h-5 w-5" />
                  Správa uživatelů
                </h2>
                <form onSubmit={handleCreateInviteCode} className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Nový zvací kód"
                    value={newInviteCode}
                    onChange={(e) => setNewInviteCode(e.target.value)}
                    className="w-32"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={createInviteCodeMutation.isPending}
                    className="bg-primary hover:bg-secondary text-primary-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Vytvořit
                  </Button>
                </form>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users
                  .sort((a, b) => {
                    // First sort by role (admin first)
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    // Then sort alphabetically by username
                    return a.username.localeCompare(b.username, 'cs');
                  })
                  .map((user) => (
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
                          <User className="text-white h-5 w-5" />
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
            </CardContent>
          </Card>

          {/* Role & Permission Management */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center cursor-pointer"
                  onClick={() => setIsUserManagementCollapsed(!isUserManagementCollapsed)}>
                <Shield className="text-accent mr-3 h-5 w-5" />
                Správa rolí a oprávnění
                {isUserManagementCollapsed ? (
                  <ChevronDown className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-2 h-4 w-4" />
                )}
              </h2>

              {!isUserManagementCollapsed && (
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-3">Dostupné role</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-foreground">User</span>
                        <p className="text-xs text-muted-foreground">Základní hráčské oprávnění</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        Výchozí
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-foreground">Admin</span>
                        <p className="text-xs text-muted-foreground">Plná správa systému</p>
                      </div>
                      <Badge className="bg-accent/20 text-accent">
                        Privilegovaná
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between opacity-60">
                      <div>
                        <span className="text-sm font-medium text-foreground">Vypravěč</span>
                        <p className="text-xs text-muted-foreground">Správa příběhů a NPC</p>
                      </div>
                      <Badge variant="secondary">
                        Připravuje se
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-3">Rychlé akce</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="ghost"
                      className="w-full justify-start p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all duration-200 text-sm"
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Povýšit na admin
                    </Button>
                    <Button 
                      variant="ghost"
                      className="w-full justify-start p-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-all duration-200 text-sm"
                    >
                      <Book className="mr-2 h-4 w-4" />
                      Udělit právo vypravěče
                    </Button>
                    <Button 
                      variant="ghost"
                      className="w-full justify-start p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all duration-200 text-sm"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Povolit více postav
                    </Button>
                  </div>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Character Requests Management */}
        <div className="mt-8 grid grid-cols-1 gap-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsCharacterRequestsCollapsed(!isCharacterRequestsCollapsed)}>
                  <UserPlus className="text-accent mr-3 h-5 w-5" />
                  Žádosti o nové postavy
                  {characterRequests.filter((req: any) => req.status === 'pending').length > 0 && (
                    <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                      {characterRequests.filter((req: any) => req.status === 'pending').length} čeká
                    </Badge>
                  )}
                  {isCharacterRequestsCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isCharacterRequestsCollapsed && (
              <div className="space-y-4">
                {characterRequests.length > 0 ? (
                  characterRequests.map((request: any) => (
                    <div key={request.id} className="bg-muted/30 rounded-lg p-4 border-l-4 border-l-accent/30">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">
                              {request.firstName} {request.middleName} {request.lastName}
                            </h4>
                            <Badge variant={request.status === 'pending' ? 'secondary' : request.status === 'approved' ? 'default' : 'destructive'}>
                              {request.status === 'pending' ? 'Čeká na posouzení' : 
                               request.status === 'approved' ? 'Schváleno' : 'Zamítnuto'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Uživatel: {request.user.username} ({request.user.email})</p>
                            <p>Datum narození: {new Date(request.birthDate).toLocaleDateString('cs-CZ')}</p>
                            {request.school && <p>Škola: {request.school}</p>}
                          </div>
                          <p className="text-sm">{request.reason}</p>
                          {request.reviewNote && (
                            <div className="p-3 bg-muted/50 rounded">
                              <p className="text-sm font-medium">Poznámka administrátora:</p>
                              <p className="text-sm">{request.reviewNote}</p>
                            </div>
                          )}
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                const reviewNote = prompt("Poznámka pro schválení (volitelné):");
                                approveCharacterRequestMutation.mutate({ 
                                  requestId: request.id, 
                                  reviewNote: reviewNote || undefined 
                                });
                              }}
                              disabled={approveCharacterRequestMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Schválit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reviewNote = prompt("Důvod zamítnutí (povinné):");
                                if (reviewNote) {
                                  rejectCharacterRequestMutation.mutate({ 
                                    requestId: request.id, 
                                    reviewNote 
                                  });
                                }
                              }}
                              disabled={rejectCharacterRequestMutation.isPending}
                            >
                              Zamítnout
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Žádné žádosti o nové postavy</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Active Character Management */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsLiveCharactersCollapsed(!isLiveCharactersCollapsed)}>
                  <Users className="text-green-400 mr-3 h-5 w-5" />
                  Správa živých postav
                  {isLiveCharactersCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isLiveCharactersCollapsed && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allCharacters.filter((char: any) => !char.deathDate).sort((a: any, b: any) => 
                  `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'cs')
                ).length > 0 ? (
                  allCharacters.filter((char: any) => !char.deathDate).sort((a: any, b: any) => 
                    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'cs')
                  ).map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {character.firstName[0]}{character.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {character.firstName} {character.middleName} {character.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {character.school || 'Bez školy'} • Vytvořeno: {new Date(character.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/characters/${character.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Upravit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setKillCharacterData({
                            id: character.id,
                            name: `${character.firstName} ${character.lastName}`
                          })}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Skull className="h-4 w-4 mr-1" />
                          Označit jako zemřelou
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Žádné živé postavy</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Cemetery Management */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setIsCemeteryCollapsed(!isCemeteryCollapsed)}
                  className="flex items-center p-0 h-auto hover:bg-transparent"
                >
                  <h2 className="text-xl font-semibold text-foreground flex items-center">
                    <Skull className="text-red-400 mr-3 h-5 w-5" />
                    Správa postav - Hřbitov
                    {isCemeteryCollapsed ? (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    )}
                  </h2>
                </Button>
              </div>

              {!isCemeteryCollapsed && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                {allCharacters.filter((char: any) => char.deathDate).length > 0 ? (
                  allCharacters.filter((char: any) => char.deathDate).map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {character.firstName[0]}{character.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {character.firstName} {character.middleName} {character.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            @{character.user?.username} • ID: {character.id}
                          </p>
                          <p className="text-xs text-red-400">
                            Zemřel: {new Date(character.deathDate).toLocaleDateString('cs-CZ')}
                            {character.deathReason && ` • ${character.deathReason}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResurrectCharacter(character.id, `${character.firstName} ${character.lastName}`)}
                        className="flex items-center gap-2 text-green-400 border-green-400 hover:bg-green-400 hover:text-white"
                      >
                        <Heart className="h-4 w-4" />
                        Oživit
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Hřbitov je prázdný - všechny postavy jsou naživu</p>
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Activity Log */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsAdminActivityCollapsed(!isAdminActivityCollapsed)}>
                  <Book className="text-accent mr-3 h-5 w-5" />
                  Administrační aktivita
                  {isAdminActivityCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isAdminActivityCollapsed && (
              <div className="space-y-3">
                {adminActivityLog.length > 0 ? (
                  adminActivityLog.slice(0, 10).map((activity: any) => (
                    <div key={activity.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.admin.username}
                            {activity.targetUser && ` → ${activity.targetUser.username}`}
                            {activity.details && ` • ${activity.details}`}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString('cs-CZ')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Žádná administrační aktivita</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kill Character Dialog */}
        {killCharacterData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-lg font-semibold text-foreground">
                  Označit postavu jako zemřelou
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Opravdu chcete označit postavu <strong>{killCharacterData.name}</strong> jako zemřelou?
                Tato akce je nevratná.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Důvod smrti (povinné)
                  </label>
                  <Input
                    value={deathReason}
                    onChange={(e) => setDeathReason(e.target.value)}
                    placeholder="Napište důvod smrti..."
                    className="mt-1"
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
                    {showConfirmKill ? "POTVRDIT SMRT" : "Označit jako zemřelou"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban User Dialog */}
        {banUserData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-lg font-semibold text-foreground">
                  Zabanovat uživatele
                </h3>
              </div>
              
              <p className="text-muted-foreground mb-4">
                Opravdu chcete zabanovat uživatele <strong>{banUserData.username}</strong>?
                Uživatel nebude moci přistupovat k aplikaci.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Důvod zákazu (povinné)
                  </label>
                  <Input
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Napište důvod zákazu..."
                    className="mt-1"
                  />
                </div>

                {showConfirmBan && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400 font-medium">
                      ⚠️ Poslední potvrzení: Klikněte znovu pro potvrzení zákazu
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

import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
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

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Admin() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [newInviteCode, setNewInviteCode] = useState("");
  const [killCharacterData, setKillCharacterData] = useState<{ id: number; name: string } | null>(null);
  const [deathReason, setDeathReason] = useState("");
  const [showConfirmKill, setShowConfirmKill] = useState(false);
  const [isCemeteryCollapsed, setIsCemeteryCollapsed] = useState(true);
  const [isLiveCharactersCollapsed, setIsLiveCharactersCollapsed] = useState(true);
  const [isAdminActivityCollapsed, setIsAdminActivityCollapsed] = useState(true);
  const [isCharacterRequestsCollapsed, setIsCharacterRequestsCollapsed] = useState(true);
  const [isUserManagementCollapsed, setIsUserManagementCollapsed] = useState(true);
  const [banUserData, setBanUserData] = useState<{ id: number; username: string } | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState<{ id: number; username: string } | null>(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [banReason, setBanReason] = useState("");

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/users"],
    staleTime: 30000,
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: characterRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/character-requests"],
    staleTime: 30000,
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: adminActivityLog = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/activity-log"],
    staleTime: 30000,
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch all characters for cemetery management
  const { data: allCharacters = [] } = useQuery<any[]>({
    queryKey: ["/api/characters/all"],
    staleTime: 30000,
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const createInviteCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", `${API_URL}/api/admin/invite-codes`, { code });
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
      const response = await apiRequest("PATCH", `${API_URL}/api/users/${userId}/role`, { role });
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
      const response = await apiRequest("POST", `${API_URL}/api/admin/character-requests/${requestId}/approve`, { reviewNote });
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
      const response = await apiRequest("POST", `${API_URL}/api/admin/character-requests/${requestId}/reject`, { reviewNote });
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
      const response = await apiRequest("POST", `${API_URL}/api/admin/characters/${characterId}/kill`, { deathReason });
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
      const response = await apiRequest("POST", `${API_URL}/api/characters/${characterId}/revive`);
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
      const response = await apiRequest("POST", `${API_URL}/api/admin/users/${userId}/ban`, { banReason });
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
      const response = await apiRequest("POST", `${API_URL}/api/admin/users/${userId}/reset-password`);
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
                <span className="text-xl fantasy-font font-bold text-accent">Umbra Magica Admin</span>
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
          <p className="text-muted-foreground">Správa uživatelů, postav a herního prostředí Umbra Magica.</p>
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

          <Card className="bg-card border-border hover:border-accent/50 transition-colors cursor-pointer"
                onClick={() => setLocation('/admin/spells')}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                  <Book className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-foreground">Správa kouzel</p>
                  <p className="text-sm text-muted-foreground">Spravovat databázi kouzel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Spell Actions */}
        <div className="mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                    <Book className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Rychlé akce s kouzly</h3>
                    <p className="text-sm text-muted-foreground">Inicializujte základní kouzla nebo přejděte do detailní správy</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      fetch(`${API_URL}/api/admin/spells/initialize`, { 
                        method: 'POST',
                        credentials: 'include'
                      })
                      .then(res => res.json())
                      .then(() => {
                        toast({
                          title: "Úspěch",
                          description: "Základní kouzla byla inicializována a přidána ke všem postavám",
                        });
                      })
                      .catch(() => {
                        toast({
                          title: "Chyba", 
                          description: "Nepodařilo se inicializovat kouzla",
                          variant: "destructive",
                        });
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Inicializovat základní kouzla
                  </Button>
                  <Button
                    onClick={() => setLocation('/admin/spells')}
                    variant="default"
                    size="sm"
                  >
                    Detailní správa kouzel
                  </Button>
                  <Button
                    onClick={() => setLocation('/admin/wand-components')}
                    variant="default"
                    size="sm"
                  >
                    Komponenty hůlek
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Influence Bar Management */}
        <div className="mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center mb-6">
                  <div className="text-accent mr-3">⚔️</div>
                  Správa magického vlivu
                </h2>
                
                {(() => {
                  const { data: influenceData, refetch: refetchInfluence } = useQuery({
                    queryKey: ['/api/influence-bar'],
                    staleTime: 5000,
                  });

                  const adjustInfluence = useMutation({
                    mutationFn: async ({ side, points }: { side: 'grindelwald' | 'dumbledore', points: number }) => {
                      const response = await fetch(`${API_URL}/api/admin/influence-bar/adjust`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ side, points }),
                      });
                      if (!response.ok) throw new Error('Failed to adjust influence');
                      return response.json();
                    },
                    onSuccess: () => {
                      refetchInfluence();
                      toast({
                        title: "Úspěch",
                        description: "Vliv byl úspěšně upraven",
                      });
                    },
                    onError: () => {
                      toast({
                        title: "Chyba",
                        description: "Nepodařilo se upravit vliv",
                        variant: "destructive",
                      });
                    },
                  });

                  const setInfluence = useMutation({
                    mutationFn: async ({ grindelwaldPoints, dumbledorePoints }: { grindelwaldPoints: number, dumbledorePoints: number }) => {
                      const response = await fetch(`${API_URL}/api/admin/influence-bar/set`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ grindelwaldPoints, dumbledorePoints }),
                      });
                      if (!response.ok) throw new Error('Failed to set influence');
                      return response.json();
                    },
                    onSuccess: () => {
                      refetchInfluence();
                      toast({
                        title: "Úspěch",
                        description: "Vliv byl úspěšně nastaven",
                      });
                    },
                    onError: () => {
                      toast({
                        title: "Chyba",
                        description: "Nepodařilo se nastavit vliv",
                        variant: "destructive",
                      });
                    },
                  });

                  if (!influenceData) {
                    return <div className="text-center text-muted-foreground">Načítání...</div>;
                  }

                  const totalPoints = influenceData.grindelwaldPoints + influenceData.dumbledorePoints;
                  const grindelwaldPercentage = totalPoints > 0 ? (influenceData.grindelwaldPoints / totalPoints) * 100 : 50;
                  const dumbledorePercentage = totalPoints > 0 ? (influenceData.dumbledorePoints / totalPoints) * 100 : 50;

                  return (
                    <div className="space-y-6">
                      {/* Current Status */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                            <span className="font-medium text-red-700 dark:text-red-400">Grindelwald</span>
                            <span className="ml-2 text-muted-foreground">({influenceData.grindelwaldPoints})</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-muted-foreground">({influenceData.dumbledorePoints})</span>
                            <span className="font-medium text-blue-700 dark:text-blue-400">Brumbál</span>
                            <div className="w-3 h-3 bg-blue-600 rounded-full ml-2"></div>
                          </div>
                        </div>
                        
                        <div className="relative w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 ease-in-out"
                            style={{ width: `${grindelwaldPercentage}%` }}
                          ></div>
                          <div 
                            className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-600 to-blue-500 transition-all duration-1000 ease-in-out"
                            style={{ width: `${dumbledorePercentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold drop-shadow-lg">
                              {Math.round(grindelwaldPercentage)}% : {Math.round(dumbledorePercentage)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Adjustments */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-red-700 dark:text-red-400">Grindelwald</h4>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: 1 })}>+1</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: 2 })}>+2</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: 5 })}>+5</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: 10 })}>+10</Button>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: -1 })}>-1</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: -2 })}>-2</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: -5 })}>-5</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'grindelwald', points: -10 })}>-10</Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-700 dark:text-blue-400">Brumbál</h4>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: 1 })}>+1</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: 2 })}>+2</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: 5 })}>+5</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: 10 })}>+10</Button>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: -1 })}>-1</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: -2 })}>-2</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: -5 })}>-5</Button>
                            <Button size="sm" variant="outline" onClick={() => adjustInfluence.mutate({ side: 'dumbledore', points: -10 })}>-10</Button>
                          </div>
                        </div>
                      </div>

                      {/* Reset Controls */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Rychlé nastavení</h4>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setInfluence.mutate({ grindelwaldPoints: 50, dumbledorePoints: 50 })}>
                            Vyrovnané (50:50)
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setInfluence.mutate({ grindelwaldPoints: 0, dumbledorePoints: 0 })}>
                            Reset (0:0)
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
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
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Crown, 
  Home, 
  LogOut, 
  Users, 
  UsersRound, 
  MessageCircle, 
  Circle,
  Settings,
  Shield,
  Plus,
  Edit,
  ArrowUp,
  UserPlus,
  Book,
  Skull,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Cog
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function AdminClean() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for various dialogs and forms
  const [newInviteCode, setNewInviteCode] = useState("");
  const [isUserManagementCollapsed, setIsUserManagementCollapsed] = useState(false);
  const [isLiveCharactersCollapsed, setIsLiveCharactersCollapsed] = useState(false);
  const [isDeadCharactersCollapsed, setIsDeadCharactersCollapsed] = useState(true);
  const [isCharacterRequestsCollapsed, setIsCharacterRequestsCollapsed] = useState(false);
  const [isAdminActivityCollapsed, setIsAdminActivityCollapsed] = useState(true);
  const [showQuickInfluenceSettings, setShowQuickInfluenceSettings] = useState(false);
  
  // Kill character state
  const [killCharacterData, setKillCharacterData] = useState<{id: number, name: string} | null>(null);
  const [deathReason, setDeathReason] = useState("");
  const [showConfirmKill, setShowConfirmKill] = useState(false);
  
  // Ban user state
  const [banUserData, setBanUserData] = useState<{id: number, username: string} | null>(null);
  const [banReason, setBanReason] = useState("");
  const [showConfirmBan, setShowConfirmBan] = useState(false);

  // Data queries
  const { data: user } = useQuery({ queryKey: ['/api/auth/user'] });
  const { data: users = [] } = useQuery({ queryKey: ['/api/users'] });
  const { data: allCharacters = [] } = useQuery({ queryKey: ['/api/characters/all'] });
  const { data: characterRequests = [] } = useQuery({ queryKey: ['/api/admin/character-requests'] });
  const { data: adminActivityLog = [] } = useQuery({ queryKey: ['/api/admin/activity-log'] });
  const { data: inviteCodes = [] } = useQuery({ queryKey: ['/api/admin/invite-codes'] });

  // Generate random invite code function
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
      const response = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) throw new Error('Failed to create invite code');
      return response.json();
    },
    onSuccess: () => {
      setNewInviteCode("");
      toast({ title: "Úspěch", description: "Zvací kód byl vytvořen" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invite-codes'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se vytvořit zvací kód", variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: number, newRole: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Role uživatele byla změněna" });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se změnit roli", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Úspěch", 
        description: `Heslo bylo resetováno na: ${data.newPassword}` 
      });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se resetovat heslo", variant: "destructive" });
    },
  });

  const killCharacterMutation = useMutation({
    mutationFn: async ({ characterId, reason }: { characterId: number, reason: string }) => {
      const response = await fetch(`/api/admin/characters/${characterId}/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deathReason: reason }),
      });
      if (!response.ok) throw new Error('Failed to kill character');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Postava byla označena jako zemřelá" });
      queryClient.invalidateQueries({ queryKey: ['/api/characters/all'] });
      setKillCharacterData(null);
      setDeathReason("");
      setShowConfirmKill(false);
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se označit postavu jako zemřelou", variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number, reason: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banReason: reason }),
      });
      if (!response.ok) throw new Error('Failed to ban user');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Uživatel byl zabanován" });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setBanUserData(null);
      setBanReason("");
      setShowConfirmBan(false);
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se zabanovat uživatele", variant: "destructive" });
    },
  });

  const approveCharacterRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await fetch(`/api/admin/character-requests/${requestId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve character request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Žádost o postavu byla schválena" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/character-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/characters/all'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se schválit žádost", variant: "destructive" });
    },
  });

  const rejectCharacterRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: number, reason: string }) => {
      const response = await fetch(`/api/admin/character-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNote: reason }),
      });
      if (!response.ok) throw new Error('Failed to reject character request');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Žádost o postavu byla zamítnuta" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/character-requests'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se zamítnout žádost", variant: "destructive" });
    },
  });

  // Helper functions
  const handleCreateInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInviteCode.trim()) {
      createInviteCodeMutation.mutate(newInviteCode.trim());
    }
  };

  const toggleUserRole = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    updateRoleMutation.mutate({ userId, newRole });
  };

  const handleResetPassword = (userId: number, username: string) => {
    if (confirm(`Opravdu chcete resetovat heslo pro uživatele ${username}?`)) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const confirmKillCharacter = () => {
    if (!showConfirmKill) {
      setShowConfirmKill(true);
      return;
    }
    if (killCharacterData && deathReason.trim()) {
      killCharacterMutation.mutate({
        characterId: killCharacterData.id,
        reason: deathReason.trim()
      });
    }
  };

  const handleBanUser = (userId: number, username: string) => {
    setBanUserData({ id: userId, username });
    setBanReason("");
    setShowConfirmBan(false);
  };

  const confirmBanUser = () => {
    if (!showConfirmBan) {
      setShowConfirmBan(true);
      return;
    }
    if (banUserData && banReason.trim()) {
      banUserMutation.mutate({
        userId: banUserData.id,
        reason: banReason.trim()
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    activeCharacters: users.reduce((sum: number, user: any) => sum + (user.characters?.length || 0), 0),
    onlineNow: Math.floor(users.length * 0.3),
    activeChats: 5,
  };

  if (!user || user.role !== 'admin') {
    return <div>Access denied</div>;
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
                className="text-muted-foreground hover:text-accent flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Hlavní stránka</span>
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
          <Card>
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
          <Card>
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
          <Card>
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
          <Card>
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

        {/* Influence Bar Management */}
        <div className="mb-8">
          <Card>
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
                    const response = await fetch('/api/admin/influence-bar/adjust', {
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
                    const response = await fetch('/api/admin/influence-bar/set', {
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
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Rychlé nastavení</h4>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowQuickInfluenceSettings(!showQuickInfluenceSettings)}
                          className="p-1"
                        >
                          <Cog className="h-4 w-4" />
                        </Button>
                      </div>
                      {showQuickInfluenceSettings && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => {
                              if (confirm("Opravdu chcete nastavit vyrovnaný stav (50:50)?")) {
                                setInfluence.mutate({ grindelwaldPoints: 50, dumbledorePoints: 50 });
                              }
                            }}
                          >
                            Vyrovnané (50:50)
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => {
                              if (confirm("Opravdu chcete resetovat všechny body na nulu (0:0)?")) {
                                setInfluence.mutate({ grindelwaldPoints: 0, dumbledorePoints: 0 });
                              }
                            }}
                          >
                            Reset (0:0)
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
                    <Book className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Rychlé akce</h3>
                    <p className="text-sm text-muted-foreground">Správa systému a herních prvků</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setLocation('/admin/archive')}
                    variant="outline"
                    size="sm"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Archiv chatů
                  </Button>
                  <Button
                    onClick={() => setLocation('/admin/spells')}
                    variant="default"
                    size="sm"
                  >
                    Správa kouzel
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

        <div className="grid grid-cols-1 gap-8">
          {/* User Management */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer"
                    onClick={() => setIsUserManagementCollapsed(!isUserManagementCollapsed)}>
                  <Settings className="text-accent mr-3 h-5 w-5" />
                  Správa uživatelů ({users.length})
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
                    {inviteCodes.length > 0 && (
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
                  {users
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

          {/* Live Characters Management */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsLiveCharactersCollapsed(!isLiveCharactersCollapsed)}>
                  <UsersRound className="text-green-500 mr-3 h-5 w-5" />
                  Živé postavy ({allCharacters.filter((char: any) => !char.deathDate).length})
                  {isLiveCharactersCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isLiveCharactersCollapsed && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allCharacters.filter((char: any) => !char.deathDate).length > 0 ? (
                  allCharacters.filter((char: any) => !char.deathDate).map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {character.firstName[0]}{character.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {character.firstName} {character.middleName ? character.middleName + ' ' : ''}{character.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {character.school || 'Bez školy'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/character/edit?id=${character.id}`)}
                          title="Upravit postavu"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setKillCharacterData({
                            id: character.id,
                            name: `${character.firstName} ${character.lastName}`
                          })}
                          title="Označit jako mrtvou"
                        >
                          <Skull className="h-4 w-4" />
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsDeadCharactersCollapsed(!isDeadCharactersCollapsed)}>
                  <Skull className="text-red-500 mr-3 h-5 w-5" />
                  Správa hřbitova ({allCharacters.filter((char: any) => char.deathDate).length})
                  {isDeadCharactersCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isDeadCharactersCollapsed && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allCharacters.filter((char: any) => char.deathDate).length > 0 ? (
                  allCharacters.filter((char: any) => char.deathDate).map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg opacity-75">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold">
                          {character.firstName[0]}{character.lastName[0]}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground line-through">
                            {character.firstName} {character.middleName ? character.middleName + ' ' : ''}{character.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            † {new Date(character.deathDate).toLocaleDateString('cs-CZ')} - {character.deathReason}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/characters/${character.id}`)}
                          title="Zobrazit postavu"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Skull className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Žádné mrtvé postavy</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Character Requests Management */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsCharacterRequestsCollapsed(!isCharacterRequestsCollapsed)}>
                  <UserPlus className="text-yellow-500 mr-3 h-5 w-5" />
                  Žádosti o postavy ({characterRequests.length})
                  {isCharacterRequestsCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isCharacterRequestsCollapsed && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {characterRequests.length > 0 ? (
                  characterRequests.map((request: any) => (
                    <div key={request.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {request.firstName} {request.middleName ? request.middleName + ' ' : ''}{request.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Od: {request.user?.username} | {new Date(request.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          ČEKÁ
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="font-medium">Škola:</span> {request.school}
                        </div>
                        <div>
                          <span className="font-medium">Kolej:</span> {request.house}
                        </div>
                        <div>
                          <span className="font-medium">Ročník:</span> {request.year}
                        </div>
                        <div>
                          <span className="font-medium">Pohlaví:</span> {request.gender === 'male' ? 'Muž' : 'Žena'}
                        </div>
                      </div>
                      {request.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <span className="font-medium">Popis:</span> {request.description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            if (confirm(`Opravdu chcete schválit žádost o postavu ${request.firstName} ${request.middleName ? request.middleName + ' ' : ''}${request.lastName}?`)) {
                              approveCharacterRequestMutation.mutate(request.id);
                            }
                          }}
                          disabled={approveCharacterRequestMutation.isPending}
                        >
                          Schválit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const reason = prompt("Důvod zamítnutí (povinné, minimálně 10 znaků):");
                            if (reason && reason.trim().length >= 10) {
                              rejectCharacterRequestMutation.mutate({
                                requestId: request.id,
                                reason: reason.trim()
                              });
                            } else if (reason !== null) {
                              toast({
                                title: "Chyba",
                                description: "Důvod zamítnutí musí mít minimálně 10 znaků",
                                variant: "destructive"
                              });
                            }
                          }}
                          disabled={rejectCharacterRequestMutation.isPending}
                        >
                          Zamítnout
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Žádné nové žádosti</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Activity Log */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center cursor-pointer" 
                    onClick={() => setIsAdminActivityCollapsed(!isAdminActivityCollapsed)}>
                  <Book className="text-purple-500 mr-3 h-5 w-5" />
                  Administrátorská aktivita ({adminActivityLog.length})
                  {isAdminActivityCollapsed ? (
                    <ChevronDown className="ml-2 h-4 w-4" />
                  ) : (
                    <ChevronUp className="ml-2 h-4 w-4" />
                  )}
                </h2>
              </div>

              {!isAdminActivityCollapsed && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {adminActivityLog.length > 0 ? (
                  adminActivityLog.slice(0, 20).map((log: any) => (
                    <div key={log.id} className="p-3 bg-muted/20 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-purple-400">{log.admin?.username}</span>
                          <span className="text-muted-foreground"> {log.action}</span>
                          {log.targetUser && (
                            <span className="text-accent"> {log.targetUser.username}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('cs-CZ')}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Žádné záznamy</p>
                  </div>
                )}
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialogs for Kill Character */}
        {killCharacterData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <Skull className="h-6 w-6 text-red-400" />
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
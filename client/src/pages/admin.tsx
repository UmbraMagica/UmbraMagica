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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Crown, 
  Users, 
  UsersRound, 
  Circle, 
  MessageCircle,
  UserPlus,
  Gauge,
  Settings,
  User,
  LogOut,
  Shield,
  Plus,
  Edit,
  ArrowUp,
  Book,
  BookOpen,
  Eye,
  Archive,
  Home,
  Skull,
  AlertTriangle,
  Heart,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Trash2,
  Cog,
  Wand2,
  Activity
} from "lucide-react";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  characters: any[];
}

interface ChatCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  sortOrder: number;
}

interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  longDescription?: string;
  categoryId: number;
  password?: string;
  isPublic: boolean;
  sortOrder: number;
}

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
  const [isCemeteryCollapsed, setIsCemeteryCollapsed] = useState(false);
  const [isLiveCharactersCollapsed, setIsLiveCharactersCollapsed] = useState(false);
  const [isAdminActivityCollapsed, setIsAdminActivityCollapsed] = useState(false);
  const [isCharacterRequestsCollapsed, setIsCharacterRequestsCollapsed] = useState(false);
  const [isUserManagementCollapsed, setIsUserManagementCollapsed] = useState(false);
  const [isChatManagementCollapsed, setIsChatManagementCollapsed] = useState(false);
  const [isExistingRoomsCollapsed, setIsExistingRoomsCollapsed] = useState(true);
  const [isExistingCategoriesCollapsed, setIsExistingCategoriesCollapsed] = useState(true);
  const [isSpellManagementCollapsed, setIsSpellManagementCollapsed] = useState(false);
  const [banUserData, setBanUserData] = useState<{ id: number; username: string } | null>(null);
  const [resetPasswordData, setResetPasswordData] = useState<{ id: number; username: string } | null>(null);
  const [showConfirmBan, setShowConfirmBan] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [showInfluenceSettings, setShowInfluenceSettings] = useState(false);
  const [influenceDialog, setInfluenceDialog] = useState<{
    open: boolean;
    side: 'grindelwald' | 'dumbledore';
    points: number;
    reason: string;
  }>({
    open: false,
    side: 'grindelwald',
    points: 0,
    reason: ''
  });
  const [resetConfirmation, setResetConfirmation] = useState<{
    open: boolean;
    type: '0:0' | '50:50';
  }>({
    open: false,
    type: '0:0'
  });
  const [showInviteCodes, setShowInviteCodes] = useState(false);

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
  
  // Edit states
  const [editingCategory, setEditingCategory] = useState<ChatCategory | null>(null);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryParentId, setEditCategoryParentId] = useState<number | null>(null);
  const [editRoomName, setEditRoomName] = useState("");
  const [editRoomDescription, setEditRoomDescription] = useState("");
  const [editRoomLongDescription, setEditRoomLongDescription] = useState("");
  const [editRoomCategoryId, setEditRoomCategoryId] = useState<number | null>(null);
  const [editRoomPassword, setEditRoomPassword] = useState("");
  const [editRoomIsPublic, setEditRoomIsPublic] = useState(true);

  // Data queries
  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/users"],
    staleTime: 30000,
  });
  const { data: allCharacters = [] } = useQuery({ queryKey: ['/api/characters/all'] });
  const { data: characterRequests = [] } = useQuery({ queryKey: ['/api/admin/character-requests'] });
  const { data: housingRequests = [] } = useQuery({ queryKey: ['/api/admin/housing-requests'] });
  const { data: adminActivityLog = [] } = useQuery({ queryKey: ['/api/admin/activity-log'] });
  const { data: inviteCodes = [] } = useQuery({ queryKey: ['/api/admin/invite-codes'] });
  const { data: chatCategories = [] } = useQuery({ queryKey: ['/api/admin/chat-categories'] });
  const { data: influenceBar = {} } = useQuery({ queryKey: ['/api/influence-bar'] });
  const { data: influenceHistory = [] } = useQuery({ queryKey: ['/api/influence-history'] });
  const { data: onlineUsersData = {} } = useQuery({ queryKey: ['/api/admin/online-users'] });
  const { data: chatRooms = [] } = useQuery({ queryKey: ['/api/chat/rooms'] });

  // Stats calculations
  const stats = {
    totalUsers: Array.isArray(users) ? users.length : 0,
    adminUsers: Array.isArray(users) ? users.filter((u: any) => u.role === 'admin').length : 0,
    activeCharacters: Array.isArray(allCharacters) ? allCharacters.filter((c: any) => !c.deathDate).length : 0,
    deadCharacters: Array.isArray(allCharacters) ? allCharacters.filter((c: any) => c.deathDate).length : 0,
    onlineNow: (onlineUsersData as any)?.count || 0,
    pendingRequests: (Array.isArray(characterRequests) ? characterRequests.length : 0) + (Array.isArray(housingRequests) ? housingRequests.length : 0),
  };

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

  // Housing request mutations
  const approveHousingMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const assignedAddress = prompt("Přidělená adresa (povinné):");
      if (!assignedAddress) throw new Error("Adresa je povinná");
      const reviewNote = prompt("Poznámka (volitelné):") || "";
      return apiRequest("POST", `/api/admin/housing-requests/${requestId}/approve`, { 
        assignedAddress, 
        reviewNote 
      });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Žádost o bydlení byla schválena",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/housing-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se schválit žádost o bydlení",
        variant: "destructive",
      });
    },
  });

  const rejectHousingMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const reviewNote = prompt("Důvod vrácení k přepracování (povinné):");
      if (!reviewNote) throw new Error("Důvod je povinný");
      return apiRequest("POST", `/api/admin/housing-requests/${requestId}/return`, { 
        reviewNote 
      });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Žádost byla vrácena k přepracování",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/housing-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se vrátit žádost",
        variant: "destructive",
      });
    },
  });

  const denyHousingMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const reviewNote = prompt("Důvod zamítnutí (povinné):");
      if (!reviewNote) throw new Error("Důvod je povinný");
      return apiRequest("POST", `/api/admin/housing-requests/${requestId}/reject`, { 
        reviewNote 
      });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Žádost o bydlení byla zamítnuta",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/housing-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zamítnout žádost",
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

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PUT", `/api/admin/chat-categories/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Kategorie byla upravena",
      });
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit kategorii",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/chat-categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Kategorie byla smazána",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-categories'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat kategorii",
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PUT", `/api/admin/chat-rooms/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Místnost byla upravena",
      });
      setEditingRoom(null);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit místnost",
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/chat-rooms/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Místnost byla smazána",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/rooms'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat místnost",
        variant: "destructive",
      });
    },
  });

  const adjustInfluenceMutation = useMutation({
    mutationFn: async ({ side, points, reason }: { side: string; points: number; reason: string }) => {
      return apiRequest("POST", "/api/admin/influence-bar/adjust-with-history", { 
        changeType: side, 
        points, 
        reason 
      });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Magický vliv byl upraven",
      });
      setInfluenceDialog({ open: false, side: 'grindelwald', points: 0, reason: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/influence-bar'] });
      queryClient.invalidateQueries({ queryKey: ['/api/influence-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit magický vliv",
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

  const handleInfluenceAdjustment = (side: 'grindelwald' | 'dumbledore') => {
    setInfluenceDialog({ open: true, side, points: 0, reason: '' });
  };

  const applyInfluenceChange = () => {
    if (!influenceDialog.reason.trim() || influenceDialog.points === 0) {
      toast({
        title: "Chyba",
        description: "Zadejte body a důvod změny",
        variant: "destructive",
      });
      return;
    }

    adjustInfluenceMutation.mutate({
      side: influenceDialog.side,
      points: influenceDialog.points,
      reason: influenceDialog.reason
    });
  };

  const handleQuickInfluenceAdjustment = (side: 'grindelwald' | 'dumbledore', points: number) => {
    setInfluenceDialog({ 
      open: true, 
      side, 
      points, 
      reason: '' 
    });
  };

  const handleInfluenceReset = (type: '0:0' | '50:50') => {
    setResetConfirmation({ open: true, type });
  };

  const confirmInfluenceReset = () => {
    const resetValues = resetConfirmation.type === '0:0' 
      ? { grindelwald: 0, dumbledore: 0 }
      : { grindelwald: 50, dumbledore: 50 };

    // Calculate changes needed and add to history
    const currentGrindelwald = (influenceBar as any)?.grindelwaldPoints || 0;
    const currentDumbledore = (influenceBar as any)?.dumbledorePoints || 0;
    
    const grindelwaldChange = resetValues.grindelwald - currentGrindelwald;
    const dumbledoreChange = resetValues.dumbledore - currentDumbledore;

    // Create promise chain for both changes
    const promises = [];
    
    if (grindelwaldChange !== 0) {
      promises.push(
        apiRequest("POST", "/api/admin/influence-bar/adjust-with-history", {
          changeType: "grindelwald",
          points: grindelwaldChange,
          reason: `Admin reset na ${resetConfirmation.type} - Grindelwald`
        })
      );
    }
    
    if (dumbledoreChange !== 0) {
      promises.push(
        apiRequest("POST", "/api/admin/influence-bar/adjust-with-history", {
          changeType: "dumbledore", 
          points: dumbledoreChange,
          reason: `Admin reset na ${resetConfirmation.type} - Brumbál`
        })
      );
    }

    Promise.all(promises)
      .then(() => {
        toast({
          title: "Úspěch",
          description: `Magický vliv byl resetován na ${resetConfirmation.type}`,
        });
        setResetConfirmation({ open: false, type: '0:0' });
        queryClient.invalidateQueries({ queryKey: ['/api/influence-bar'] });
        queryClient.invalidateQueries({ queryKey: ['/api/influence-history'] });
      })
      .catch((error: any) => {
        toast({
          title: "Chyba",
          description: error.message || "Nepodařilo se resetovat magický vliv",
          variant: "destructive",
        });
      });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Přístup odepřen</h2>
          <p className="text-muted-foreground">Nemáte oprávnění k přístupu do administrátorského panelu.</p>
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
                <span className="text-xl fantasy-font font-bold text-accent">Administrátorský panel</span>
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
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-400">Uživatelé</h3>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">{stats.adminUsers} adminů</p>
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
                  <h3 className="text-lg font-semibold text-green-400">Aktivní postavy</h3>
                  <p className="text-2xl font-bold text-foreground">{stats.activeCharacters}</p>
                  <p className="text-sm text-muted-foreground">{stats.deadCharacters} mrtvých</p>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <UsersRound className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-400">Online nyní</h3>
                  <p className="text-2xl font-bold text-foreground">{stats.onlineNow}</p>
                  <p className="text-sm text-muted-foreground">ze {stats.totalUsers} celkem</p>
                </div>
                <div className="h-12 w-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Circle className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-purple-400">Nevyřízené žádosti</h3>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
                  <p className="text-sm text-muted-foreground">čekajících na vyřízení</p>
                </div>
                <div className="h-12 w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Správa magického vlivu */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground flex items-center justify-between">
              <div className="flex items-center">
                <Gauge className="text-purple-400 mr-3 h-5 w-5" />
                Správa magického vlivu
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-accent"
                      title="Historie změn magického vlivu"
                    >
                      <Book className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-96">
                    <DialogHeader>
                      <DialogTitle>Historie změn magického vlivu</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-80 overflow-y-auto">
                      {!influenceHistory ? (
                        <div className="text-center text-muted-foreground py-8">Načítání historie...</div>
                      ) : influenceHistory.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">Zatím žádné změny</div>
                      ) : (
                        <div className="space-y-3">
                          {influenceHistory.map((entry: any) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-card/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  entry.changeType === 'grindelwald' ? 'bg-red-600' : 'bg-blue-600'
                                }`}></div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {entry.changeType === 'grindelwald' ? 'Grindelwald' : 'Brumbál'}: 
                                    <span className={`ml-1 ${entry.pointsChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {entry.pointsChanged > 0 ? '+' : ''}{entry.pointsChanged}
                                    </span>
                                    <span className="text-muted-foreground ml-1">
                                      ({entry.previousTotal} → {entry.newTotal})
                                    </span>
                                  </div>
                                  {entry.reason && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {entry.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleString('cs-CZ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInfluenceSettings(!showInfluenceSettings)}
                  className="text-muted-foreground hover:text-accent"
                  title="Nastavení magického vlivu"
                >
                  <Cog className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-red-400">
                  Grindelwald: {(influenceBar as any)?.grindelwaldPoints || 0} bodů
                </div>
                <div className="text-sm font-medium text-blue-400">
                  Brumbál: {(influenceBar as any)?.dumbledorePoints || 0} bodů
                </div>
              </div>
              
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
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

              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Grindelwald buttons */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-400 text-center">Grindelwald</div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('grindelwald', 1)}
                      className="text-red-400 border-red-400 hover:bg-red-400/10 flex-1"
                    >
                      +1
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('grindelwald', 2)}
                      className="text-red-400 border-red-400 hover:bg-red-400/10 flex-1"
                    >
                      +2
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('grindelwald', 5)}
                      className="text-red-400 border-red-400 hover:bg-red-400/10 flex-1"
                    >
                      +5
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('grindelwald', 10)}
                      className="text-red-400 border-red-400 hover:bg-red-400/10 flex-1"
                    >
                      +10
                    </Button>
                  </div>
                </div>

                {/* Brumbál buttons */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-blue-400 text-center">Brumbál</div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('dumbledore', 1)}
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10 flex-1"
                    >
                      +1
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('dumbledore', 2)}
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10 flex-1"
                    >
                      +2
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('dumbledore', 5)}
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10 flex-1"
                    >
                      +5
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickInfluenceAdjustment('dumbledore', 10)}
                      className="text-blue-400 border-blue-400 hover:bg-blue-400/10 flex-1"
                    >
                      +10
                    </Button>
                  </div>
                </div>
              </div>

              {/* Reset options */}
              {showInfluenceSettings && (
                <div className="mt-4 p-4 bg-muted/20 rounded-lg border">
                  <h4 className="text-sm font-medium mb-3">Nastavení magického vlivu</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleInfluenceReset('0:0')}
                      className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                    >
                      Reset na 0:0
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>



        {/* Admin Sections */}
        <div className="grid grid-cols-1 gap-8">
          {/* Správa uživatelů */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsUserManagementCollapsed(!isUserManagementCollapsed)}>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <Settings className="text-blue-400 mr-3 h-5 w-5" />
                Správa uživatelů ({stats.totalUsers})
                {isUserManagementCollapsed ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-auto h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            
            {!isUserManagementCollapsed && (
              <CardContent>
                {/* Invite Codes Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Zvací kódy</h3>
                  <div className="flex space-x-2 mb-4">
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
                      >
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
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowInviteCodes(!showInviteCodes)}
                      className="ml-auto"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      {showInviteCodes ? 'Skrýt' : 'Zobrazit'} existující ({Array.isArray(inviteCodes) ? inviteCodes.length : 0})
                    </Button>
                  </div>
                  
                  {showInviteCodes && Array.isArray(inviteCodes) && inviteCodes.length > 0 && (
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
                  )}
                </div>

                {/* Users List */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Seznam uživatelů</h3>
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
              </CardContent>
            )}
          </Card>

          {/* Správa postav */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsLiveCharactersCollapsed(!isLiveCharactersCollapsed)}>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <Heart className="text-green-400 mr-3 h-5 w-5" />
                Správa postav ({stats.activeCharacters} živých)
                {isLiveCharactersCollapsed ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-auto h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            {!isLiveCharactersCollapsed && (
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.isArray(allCharacters) && allCharacters
                    .filter((character: any) => !character.deathDate)
                    .map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {character.avatar ? (
                          <img 
                            src={character.avatar} 
                            alt={`Avatar ${character.firstName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-accent to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {character.firstName.charAt(0)}{character.lastName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {character.firstName} {character.middleName ? `${character.middleName} ` : ''}{character.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {character.school || 'Neznámá škola'} • 
                            {character.birthDate ? new Date(character.birthDate).toLocaleDateString('cs-CZ') : 'Neznámé datum narození'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/admin/spells/character/${character.id}`)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Zobrazit kouzel postavy"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/character-edit/${character.id}`)}
                          className="text-green-400 hover:text-green-300"
                          title="Editovat postavu"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleKillCharacter(character.id, `${character.firstName} ${character.lastName}`)}
                          className="text-red-400 hover:text-red-300"
                          title="Usmrtit postavu"
                        >
                          <Skull className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {Array.isArray(allCharacters) && allCharacters.filter((c: any) => !c.deathDate).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Žádné živé postavy
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>



          {/* Uživatelské žádosti */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsCharacterRequestsCollapsed(!isCharacterRequestsCollapsed)}>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <UserPlus className="text-blue-400 mr-3 h-5 w-5" />
                Uživatelské žádosti ({(Array.isArray(characterRequests) ? characterRequests.length : 0) + (Array.isArray(housingRequests) ? housingRequests.length : 0)})
                {isCharacterRequestsCollapsed ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-auto h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            {!isCharacterRequestsCollapsed && (
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Character Requests */}
                  {Array.isArray(characterRequests) && characterRequests.map((request: any) => (
                    <div key={`char-${request.id}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-l-4 border-l-blue-500">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <UserPlus className="text-white h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {request.firstName} {request.middleName ? `${request.middleName} ` : ''}{request.lastName}
                            </p>
                            <Badge variant="secondary" className="text-xs">Postava</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.user?.username} • {request.school || 'Neznámá škola'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Požádáno: {new Date(request.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveCharacter(request.id)}
                          disabled={approveCharacterMutation.isPending}
                          className="text-green-400 hover:text-green-300"
                        >
                          Schválit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectCharacter(request.id)}
                          disabled={rejectCharacterMutation.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          Zamítnout
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Housing Requests */}
                  {Array.isArray(housingRequests) && housingRequests.map((request: any) => (
                    <div key={`house-${request.id}`} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-l-4 border-l-green-500">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <Home className="text-white h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {request.character?.firstName} {request.character?.middleName ? `${request.character.middleName} ` : ''}{request.character?.lastName}
                            </p>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-600">Bydlení</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {request.user?.username} • {request.requestType === 'dormitory' ? 'Ubytovna' : request.requestType === 'shared' ? 'Sdílené bydlení' : 'Vlastní bydlení'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Místo: {request.location} • Požádáno: {new Date(request.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveHousingMutation.mutate(request.id)}
                          disabled={approveHousingMutation.isPending}
                          className="text-green-400 hover:text-green-300"
                        >
                          Schválit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectHousingMutation.mutate(request.id)}
                          disabled={rejectHousingMutation.isPending}
                          className="text-orange-400 hover:text-orange-300"
                        >
                          Vrátit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => denyHousingMutation.mutate(request.id)}
                          disabled={denyHousingMutation.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          Zamítnout
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {Array.isArray(characterRequests) && characterRequests.length === 0 && 
                   Array.isArray(housingRequests) && housingRequests.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Žádné čekající žádosti
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Správa chatů */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsChatManagementCollapsed(!isChatManagementCollapsed)}>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <MessageSquare className="text-purple-400 mr-3 h-5 w-5" />
                Správa chatů
                {isChatManagementCollapsed ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-auto h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            {!isChatManagementCollapsed && (
              <CardContent>
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

                  {/* Existing Categories Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExistingCategoriesCollapsed(!isExistingCategoriesCollapsed)}>
                      <h3 className="text-lg font-medium flex items-center">
                        Správa existujících kategorií
                        {isExistingCategoriesCollapsed ? (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        )}
                      </h3>
                    </div>
                    
                    {!isExistingCategoriesCollapsed && (
                      <div className="border rounded-lg">
                        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                          {Array.isArray(chatCategories) && chatCategories.length > 0 ? (
                          chatCategories.map((category: any) => (
                            <div key={category.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">
                                    {category.parentId ? "📍" : "🌍"} {category.name}
                                  </h4>
                                  <Badge variant={category.parentId ? "secondary" : "default"} className="text-xs">
                                    {category.parentId ? "Oblast" : "Kategorie"}
                                  </Badge>
                                </div>
                                {category.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  ID: {category.id} • Pořadí: {category.sortOrder}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setEditCategoryName(category.name);
                                    setEditCategoryDescription(category.description || "");
                                    setEditCategoryParentId(category.parentId);
                                  }}
                                  className="text-yellow-400 hover:text-yellow-300"
                                  title="Upravit kategorii"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Opravdu chcete smazat kategorii "${category.name}"? Tato akce je nevratná.`)) {
                                      deleteCategoryMutation.mutate(category.id);
                                    }
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                  title="Smazat kategorii"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            Žádné kategorie
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Existing Rooms Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExistingRoomsCollapsed(!isExistingRoomsCollapsed)}>
                      <h3 className="text-lg font-medium flex items-center">
                        Správa existujících místností
                        {isExistingRoomsCollapsed ? (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        )}
                      </h3>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation('/admin/archive');
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        Archiv zpráv
                      </Button>
                    </div>
                    
                    {!isExistingRoomsCollapsed && (
                      <div className="border rounded-lg">
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                          {Array.isArray(chatRooms) && chatRooms.length > 0 ? (
                            chatRooms.map((room: any) => (
                              <div key={room.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-foreground">{room.name}</h4>
                                    <Badge variant={room.isPublic ? "default" : "secondary"} className="text-xs">
                                      {room.isPublic ? "Veřejná" : "Privátní"}
                                    </Badge>
                                  </div>
                                  {room.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    ID: {room.id} • Vytvořeno: {new Date(room.createdAt).toLocaleDateString('cs-CZ')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLocation(`/chat/${room.id}`)}
                                    className="text-blue-400 hover:text-blue-300"
                                    title="Otevřít chat"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingRoom(room);
                                      setEditRoomName(room.name);
                                      setEditRoomDescription(room.description || "");
                                      setEditRoomLongDescription(room.longDescription || "");
                                      setEditRoomCategoryId(room.categoryId);
                                      setEditRoomPassword("");
                                      setEditRoomIsPublic(room.isPublic);
                                    }}
                                    className="text-yellow-400 hover:text-yellow-300"
                                    title="Upravit místnost"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Opravdu chcete smazat místnost "${room.name}"? Tato akce je nevratná a smaže všechny zprávy v místnosti.`)) {
                                        deleteRoomMutation.mutate(room.id);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                    title="Smazat místnost"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted-foreground py-8">
                              Žádné místnosti
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Správa magických předmětů a kouzel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🪄</div>
                  Správa magických předmětů a kouzel
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setLocation('/admin/spells')}
                  variant="outline"
                  className="p-6 h-auto flex flex-col items-center justify-center text-center hover:bg-purple-50 dark:hover:bg-purple-950 border-purple-200 dark:border-purple-800"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-medium text-lg mb-1">Databáze kouzel</div>
                  <div className="text-sm text-muted-foreground">Správa kouzel, jejich vlastností a kategorií</div>
                </Button>
                
                <Button
                  onClick={() => setLocation('/admin/wand-components')}
                  variant="outline"
                  className="p-6 h-auto flex flex-col items-center justify-center text-center hover:bg-amber-50 dark:hover:bg-amber-950 border-amber-200 dark:border-amber-800"
                >
                  <div className="text-3xl mb-2">🌳</div>
                  <div className="font-medium text-lg mb-1">Hůlkové komponenty</div>
                  <div className="text-sm text-muted-foreground">Editace dřev, jader, délek a ohebností hůlek</div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hřbitov */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => setIsCemeteryCollapsed(!isCemeteryCollapsed)}>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <Skull className="text-red-400 mr-3 h-5 w-5" />
                Hřbitov ({stats.deadCharacters} mrtvých)
                {isCemeteryCollapsed ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-auto h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            {!isCemeteryCollapsed && (
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.isArray(allCharacters) && allCharacters
                    .filter((character: any) => character.deathDate)
                    .map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <Skull className="text-white h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {character.firstName} {character.middleName ? `${character.middleName} ` : ''}{character.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {character.school || 'Neznámá škola'} • 
                            Zemřel(a): {character.deathDate ? new Date(character.deathDate).toLocaleDateString('cs-CZ') : 'Neznámé datum'}
                          </p>
                          {character.deathReason && (
                            <p className="text-xs text-red-400 italic">Důvod: {character.deathReason}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                        MRTVÝ
                      </Badge>
                    </div>
                  ))}
                  {Array.isArray(allCharacters) && allCharacters.filter((c: any) => c.deathDate).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Hřbitov je prázdný
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Logy administrátorské činnosti */}
          <Card data-section="admin-activity">
            <CardHeader className="cursor-pointer" onClick={() => setIsAdminActivityCollapsed(!isAdminActivityCollapsed)}>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                <Activity className="text-indigo-400 mr-3 h-5 w-5" />
                Logy administrátorské činnosti ({Array.isArray(adminActivityLog) ? adminActivityLog.length : 0})
                {isAdminActivityCollapsed ? (
                  <ChevronDown className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronUp className="ml-auto h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>

            {!isAdminActivityCollapsed && (
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.isArray(adminActivityLog) && adminActivityLog.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <Activity className="text-white h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{log.action}</p>
                          <p className="text-sm text-muted-foreground">
                            Admin: {log.admin?.username} 
                            {log.targetUser && ` • Cíl: ${log.targetUser.username}`}
                          </p>
                          {log.details && (
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString('cs-CZ')} {new Date(log.createdAt).toLocaleTimeString('cs-CZ')}
                      </div>
                    </div>
                  ))}
                  {Array.isArray(adminActivityLog) && adminActivityLog.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Žádná aktivita
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
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

        {influenceDialog.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Upravit Magický vliv - {influenceDialog.side === 'grindelwald' ? 'Grindelwald' : 'Brumbál'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="influencePoints">Body</Label>
                  <Input
                    id="influencePoints"
                    type="number"
                    value={influenceDialog.points}
                    onChange={(e) => setInfluenceDialog({...influenceDialog, points: parseInt(e.target.value) || 0})}
                    placeholder="Počet bodů (kladný nebo záporný)"
                  />
                </div>
                <div>
                  <Label htmlFor="influenceReason">Poznámka k změně</Label>
                  <Textarea
                    id="influenceReason"
                    value={influenceDialog.reason}
                    onChange={(e) => setInfluenceDialog({...influenceDialog, reason: e.target.value})}
                    placeholder="Zadejte důvod změny magického vlivu..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setInfluenceDialog({ open: false, side: 'grindelwald', points: 0, reason: '' })}
                    className="flex-1"
                  >
                    Zrušit
                  </Button>
                  <Button
                    onClick={applyInfluenceChange}
                    disabled={adjustInfluenceMutation.isPending || !influenceDialog.reason.trim() || influenceDialog.points === 0}
                    className="flex-1"
                  >
                    Upravit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {resetConfirmation.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Potvrzení resetu</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Opravdu chcete resetovat magický vliv na <strong>{resetConfirmation.type}</strong>?
              </p>
              <p className="text-xs text-yellow-400 mb-4">
                ⚠️ Tato akce je nevratná a ovlivní celou hru!
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setResetConfirmation({ open: false, type: '0:0' })}
                  className="flex-1"
                >
                  Zrušit
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmInfluenceReset}
                  className="flex-1"
                >
                  Potvrdit reset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={() => setEditingRoom(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upravit místnost</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editRoomName">Název místnosti</Label>
              <Input
                id="editRoomName"
                value={editRoomName}
                onChange={(e) => setEditRoomName(e.target.value)}
                placeholder="Název místnosti"
              />
            </div>
            <div>
              <Label htmlFor="editRoomDescription">Krátký popis</Label>
              <Input
                id="editRoomDescription"
                value={editRoomDescription}
                onChange={(e) => setEditRoomDescription(e.target.value)}
                placeholder="Krátký popis místnosti"
              />
            </div>
            <div>
              <Label htmlFor="editRoomLongDescription">Detailní popis</Label>
              <Textarea
                id="editRoomLongDescription"
                value={editRoomLongDescription}
                onChange={(e) => setEditRoomLongDescription(e.target.value)}
                placeholder="Detailní popis místnosti"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editRoomCategory">Oblast (kategorie)</Label>
              <Select 
                value={editRoomCategoryId?.toString() || ""} 
                onValueChange={(value) => setEditRoomCategoryId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte oblast" />
                </SelectTrigger>
                <SelectContent>
                  {chatCategories?.filter(cat => cat.parentId !== null).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editRoomIsPublic"
                checked={editRoomIsPublic}
                onChange={(e) => setEditRoomIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="editRoomIsPublic">Veřejná místnost</Label>
            </div>
            {!editRoomIsPublic && (
              <div>
                <Label htmlFor="editRoomPassword">Heslo pro přístup</Label>
                <Input
                  id="editRoomPassword"
                  type="password"
                  value={editRoomPassword}
                  onChange={(e) => setEditRoomPassword(e.target.value)}
                  placeholder="Nové heslo (ponechte prázdné pro zachování)"
                />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingRoom(null)}>
                Zrušit
              </Button>
              <Button
                onClick={() => {
                  if (!editRoomName.trim() || !editRoomCategoryId) return;
                  const updates: any = {
                    name: editRoomName.trim(),
                    description: editRoomDescription.trim() || null,
                    longDescription: editRoomLongDescription.trim() || null,
                    categoryId: editRoomCategoryId,
                    isPublic: editRoomIsPublic,
                  };
                  if (!editRoomIsPublic && editRoomPassword.trim()) {
                    updates.password = editRoomPassword.trim();
                  }
                  updateRoomMutation.mutate({ id: editingRoom!.id, updates });
                }}
                disabled={!editRoomName.trim() || !editRoomCategoryId || updateRoomMutation.isPending}
              >
                {updateRoomMutation.isPending ? "Ukládám..." : "Uložit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upravit kategorii</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryName">Název</Label>
              <Input
                id="editCategoryName"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Název kategorie"
              />
            </div>
            <div>
              <Label htmlFor="editCategoryDescription">Popis</Label>
              <Textarea
                id="editCategoryDescription"
                value={editCategoryDescription}
                onChange={(e) => setEditCategoryDescription(e.target.value)}
                placeholder="Popis kategorie"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editCategoryParent">Nadřazená kategorie</Label>
              <Select 
                value={editCategoryParentId?.toString() || "none"} 
                onValueChange={(value) => setEditCategoryParentId(value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">🌍 Hlavní kategorie</SelectItem>
                  {chatCategories?.filter(cat => cat.parentId === null && cat.id !== editingCategory?.id).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      📍 {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                Zrušit
              </Button>
              <Button
                onClick={() => {
                  if (!editCategoryName.trim()) return;
                  updateCategoryMutation.mutate({
                    id: editingCategory!.id,
                    updates: {
                      name: editCategoryName.trim(),
                      description: editCategoryDescription.trim() || null,
                      parentId: editCategoryParentId,
                    }
                  });
                }}
                disabled={!editCategoryName.trim() || updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? "Ukládám..." : "Uložit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
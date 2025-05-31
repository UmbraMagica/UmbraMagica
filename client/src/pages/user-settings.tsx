import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { characterRequestSchema, insertHousingRequestSchema } from "@shared/schema";
import { z } from "zod";
import { 
  User, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Home,
  ArrowLeft,
  UserPlus,
  Settings,
  Lock,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";
import { CharacterAvatar } from "@/components/CharacterAvatar";

type CharacterRequestForm = z.infer<typeof characterRequestSchema>;
type HousingRequestForm = z.infer<typeof insertHousingRequestSchema>;

interface CharacterRequest {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  school?: string;
  description?: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string;
  createdAt: string;
}

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  
  // Password and email change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Email form state
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    confirmPassword: ''
  });

  // Housing form state
  const [showHousingForm, setShowHousingForm] = useState(false);
  const [housingType, setHousingType] = useState<'dormitory' | 'custom' | null>(null);
  const [locationType, setLocationType] = useState<'area' | 'custom' | null>(null);

  const form = useForm<CharacterRequestForm>({
    resolver: zodResolver(characterRequestSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: "",
      school: "",
      description: "",
      reason: "",
    },
  });

  const housingForm = useForm<HousingRequestForm>({
    resolver: zodResolver(insertHousingRequestSchema),
    defaultValues: {
      characterId: 0,
      requestType: "",
      size: "",
      location: "",
      customLocation: "",
      selectedArea: "",
      description: "",
    },
  });

  // Fetch user's character requests
  const { data: characterRequests = [] } = useQuery<CharacterRequest[]>({
    queryKey: ["/api/character-requests/my"],
    enabled: !!user,
  });

  // Fetch user's housing requests
  const { data: housingRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/housing-requests/my"],
    enabled: !!user,
  });

  // Fetch user's characters (filter only alive characters)
  const { data: allUserCharacters = [] } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Filter only alive characters (not in cemetery)
  const userCharacters = allUserCharacters.filter((char: any) => !char.deathDate);



  // Create character request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: CharacterRequestForm) => {
      const response = await apiRequest("POST", "/api/character-requests", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Žádost odeslána",
        description: "Vaše žádost o novou postavu byla odeslána k posouzení administrátorům.",
      });
      form.reset();
      setShowNewRequestForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/character-requests/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odeslat žádost",
        variant: "destructive",
      });
    },
  });

  // Delete character request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("DELETE", `/api/character-requests/${requestId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Žádost stažena",
        description: "Vaše žádost o novou postavu byla úspěšně stažena.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/character-requests/my"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se stáhnout žádost",
        variant: "destructive",
      });
    },
  });

  // Create housing request mutation
  const createHousingRequestMutation = useMutation({
    mutationFn: async (data: HousingRequestForm) => {
      const response = await apiRequest("POST", "/api/housing-requests", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nepodařilo se odeslat žádost o bydlení");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/housing-requests/my"] });
      toast({
        title: "Žádost odeslána",
        description: "Vaše žádost o bydlení byla úspěšně odeslána a čeká na vyřízení.",
      });
      housingForm.reset();
      setShowHousingForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba při odesílání žádosti",
        description: error.message || "Nepodařilo se odeslat žádost o bydlení",
        variant: "destructive",
      });
    },
  });



  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nepodařilo se změnit heslo");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Heslo změněno",
        description: "Vaše heslo bylo úspěšně změněno.",
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba při změně hesla",
        description: error.message || "Nepodařilo se změnit heslo",
        variant: "destructive",
      });
    },
  });

  // Change email mutation
  const changeEmailMutation = useMutation({
    mutationFn: async (data: { newEmail: string; confirmPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-email", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Nepodařilo se změnit email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email změněn",
        description: "Váš email byl úspěšně změněn.",
      });
      setEmailForm({ newEmail: '', confirmPassword: '' });
      setShowEmailForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba při změně emailu",
        description: error.message || "Nepodařilo se změnit email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CharacterRequestForm) => {
    createRequestMutation.mutate(data);
  };

  const onHousingSubmit = (data: HousingRequestForm) => {
    if (!user) return;
    
    // Pro ubytovnu automaticky nastavíme požadované hodnoty
    if (housingType === 'dormitory') {
      createHousingRequestMutation.mutate({
        ...data,
        userId: user.id,
        requestType: 'dormitory',
        size: 'jednolůžkový pokoj',
        location: 'Ubytovna U starého Šeptáka',
        description: 'Žádost o pokoj na ubytovně',
      });
    } else {
      createHousingRequestMutation.mutate({
        ...data,
        userId: user.id,
      });
    }
  };

  // Validation functions
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Heslo musí mít alespoň 8 znaků";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Heslo musí obsahovat alespoň jedno malé písmeno";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Heslo musí obsahovat alespoň jedno velké písmeno";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Heslo musí obsahovat alespoň jednu číslici";
    }
    return null;
  };

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Neplatný formát emailu";
    }
    return null;
  };

  // Handler functions
  const handlePasswordChange = () => {
    const passwordError = validatePassword(passwordForm.newPassword);
    if (passwordError) {
      toast({
        title: "Neplatné heslo",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Hesla se neshodují",
        description: "Nové heslo a potvrzení hesla se musí shodovat",
        variant: "destructive",
      });
      return;
    }

    if (!passwordForm.currentPassword) {
      toast({
        title: "Chybí současné heslo",
        description: "Pro změnu hesla musíte zadat současné heslo",
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleEmailChange = () => {
    const emailError = validateEmail(emailForm.newEmail);
    if (emailError) {
      toast({
        title: "Neplatný email",
        description: emailError,
        variant: "destructive",
      });
      return;
    }

    if (!emailForm.confirmPassword) {
      toast({
        title: "Chybí heslo",
        description: "Pro změnu emailu musíte zadat současné heslo",
        variant: "destructive",
      });
      return;
    }

    changeEmailMutation.mutate({
      newEmail: emailForm.newEmail,
      confirmPassword: emailForm.confirmPassword,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Čeká na posouzení</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Schváleno</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Zamítnuto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Přihlaste se pro přístup k nastavení</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na hlavní stránku
            </Button>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6" />
              <h1 className="text-2xl font-bold">Nastavení uživatele</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              <User className="mr-1 h-3 w-3" />
              {user.username}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Account Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Bezpečnost účtu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Account Info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Aktuální údaje</h4>
                    <p className="text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email: {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Change Password */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Změna hesla</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                      {showPasswordForm ? "Zrušit" : "Změnit heslo"}
                    </Button>
                  </div>
                  
                  {showPasswordForm && (
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="currentPassword">Současné heslo</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                            placeholder="Zadejte současné heslo"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">Nové heslo</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                            placeholder="Zadejte nové heslo"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimálně 8 znaků, obsahuje velké a malé písmeno a číslici
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Potvrzení nového hesla</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                            placeholder="Potvrďte nové heslo"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handlePasswordChange}
                        disabled={changePasswordMutation.isPending}
                        className="w-full"
                      >
                        {changePasswordMutation.isPending ? "Měním heslo..." : "Změnit heslo"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Change Email */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Změna emailu</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmailForm(!showEmailForm)}
                    >
                      {showEmailForm ? "Zrušit" : "Změnit email"}
                    </Button>
                  </div>
                  
                  {showEmailForm && (
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="newEmail">Nový email</Label>
                        <Input
                          id="newEmail"
                          type="email"
                          value={emailForm.newEmail}
                          onChange={(e) => setEmailForm({...emailForm, newEmail: e.target.value})}
                          placeholder="Zadejte nový email"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPasswordEmail">Potvrďte heslem</Label>
                        <Input
                          id="confirmPasswordEmail"
                          type="password"
                          value={emailForm.confirmPassword}
                          onChange={(e) => setEmailForm({...emailForm, confirmPassword: e.target.value})}
                          placeholder="Zadejte současné heslo"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Pro změnu emailu musíte zadat současné heslo
                        </p>
                      </div>
                      
                      <Button
                        onClick={handleEmailChange}
                        disabled={changeEmailMutation.isPending}
                        className="w-full"
                      >
                        {changeEmailMutation.isPending ? "Měním email..." : "Změnit email"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Character Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Správa postav
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userCharacters.length > 0 ? (
                <div className="space-y-3">
                  {userCharacters.length > 1 && (
                    <div className="text-sm text-muted-foreground mb-3">
                      Vyberte svou primární postavu, která se zobrazí po přihlášení:
                    </div>
                  )}
                  {userCharacters.map((character: any) => (
                    <div key={character.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <CharacterAvatar character={character} size="md" />
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">
                              {character.firstName} {character.middleName} {character.lastName}
                            </h4>
                            {userCharacters.length > 1 && mainCharacter?.id === (character as any)?.id && (
                              <div className="flex items-center space-x-1">
                                <span className="text-yellow-500">👑</span>
                                <Badge className="bg-accent/20 text-accent">Primární</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/characters/${character.id}`}
                        >
                          Zobrazit profil
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/character/edit?characterId=${character.id}`}
                        >
                          Upravit
                        </Button>
                        {userCharacters.length > 1 && mainCharacter?.id !== (character as any)?.id && (
                          <Button
                            size="sm"
                            onClick={() => setMainCharacterMutation.mutate(character.id)}
                            disabled={setMainCharacterMutation.isPending}
                            className="bg-accent hover:bg-accent/90"
                          >
                            Nastavit jako primární
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Zatím nemáte žádné postavy</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Požádejte o vytvoření nové postavy níže
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Character Requests Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Žádosti o nové postavy
                </CardTitle>
                {!showNewRequestForm && (
                  <Button 
                    onClick={() => setShowNewRequestForm(true)}
                    className="bg-accent hover:bg-accent/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Požádat o novou postavu
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Request Form */}
              {showNewRequestForm && (
                <Card className="border-2 border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Nová žádost o postavu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="firstName">Křestní jméno *</Label>
                          <Input
                            id="firstName"
                            {...form.register("firstName")}
                            placeholder="Křestní jméno"
                          />
                          {form.formState.errors.firstName && (
                            <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="middleName">Prostřední jméno</Label>
                          <Input
                            id="middleName"
                            {...form.register("middleName")}
                            placeholder="Prostřední jméno (volitelné)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Příjmení *</Label>
                          <Input
                            id="lastName"
                            {...form.register("lastName")}
                            placeholder="Příjmení"
                          />
                          {form.formState.errors.lastName && (
                            <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="birthDate">Datum narození *</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            min="1860-01-01"
                            max="1910-12-31"
                            {...form.register("birthDate")}
                            onFocus={(e) => {
                              // Nastavit výchozí rok na herní dobu
                              if (!e.target.value) {
                                e.target.value = "1900-01-01";
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Roky 1860-1910 (věk v roce 1926: 16-66 let)
                          </p>
                          {form.formState.errors.birthDate && (
                            <p className="text-sm text-destructive">{form.formState.errors.birthDate.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="school">Škola</Label>
                          <Input
                            id="school"
                            {...form.register("school")}
                            placeholder="Například Bradavice, Durmstrang..."
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Popis postavy</Label>
                        <Textarea
                          id="description"
                          {...form.register("description")}
                          placeholder="Stručný popis vzhledu, osobnosti, pozadí..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="reason">Důvod pro vytvoření postavy *</Label>
                        <Textarea
                          id="reason"
                          {...form.register("reason")}
                          placeholder="Vysvětlete, proč chcete vytvořit tuto postavu a jak zapadne do příběhu..."
                          rows={4}
                        />
                        {form.formState.errors.reason && (
                          <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowNewRequestForm(false);
                            form.reset();
                          }}
                        >
                          Zrušit
                        </Button>
                        <Button
                          type="submit"
                          disabled={createRequestMutation.isPending}
                          className="bg-accent hover:bg-accent/90"
                        >
                          {createRequestMutation.isPending ? "Odesílám..." : "Odeslat žádost"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Existing Requests */}
              {characterRequests.length > 0 ? (
                <div className="space-y-3">
                  {characterRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-accent/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">
                                {request.firstName} {request.middleName} {request.lastName}
                              </h4>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Datum narození: {formatDate(request.birthDate)}</p>
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
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-muted-foreground">
                              {formatDate(request.createdAt)}
                            </div>
                            {request.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm("Opravdu chcete stáhnout tuto žádost? Tato akce je nevratná.")) {
                                    deleteRequestMutation.mutate(request.id);
                                  }
                                }}
                                disabled={deleteRequestMutation.isPending}
                                className="text-xs"
                              >
                                Stáhnout žádost
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Zatím nemáte žádné žádosti o nové postavy</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Klikněte na tlačítko výše pro vytvoření nové žádosti
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Housing Requests Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Žádosti o bydlení
                </CardTitle>
                <Button 
                  onClick={() => setShowHousingForm(!showHousingForm)}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Požádat o bydlení
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Housing Request Form */}
              {showHousingForm && (
                <Card className="border-2 border-accent/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Nová žádost o bydlení</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Požádejte o přidělení bytu, domu, sídla nebo pokoje na ubytovně pro svou postavu. Po schválení bude adresa přidána do profilu postavy a bude vytvořena soukromá místnost pro roleplay, v případě ubytovny se jedná o veřejný chat.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={housingForm.handleSubmit(onHousingSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="characterId" className="text-foreground">Postava *</Label>
                        <select
                          id="characterId"
                          {...housingForm.register("characterId", { valueAsNumber: true })}
                          className="w-full p-2 border rounded-md bg-background text-foreground"
                        >
                          <option value="">Vyberte postavu</option>
                          {userCharacters?.map((character: any) => (
                            <option key={character.id} value={character.id}>
                              {character.firstName} {character.middleName ? `${character.middleName} ` : ''}{character.lastName}
                            </option>
                          ))}
                        </select>
                        {housingForm.formState.errors.characterId && (
                          <p className="text-sm text-destructive">{housingForm.formState.errors.characterId.message}</p>
                        )}
                      </div>

                      {/* Typ bydlení - checkboxy */}
                      <div className="space-y-3">
                        <Label className="text-foreground">Typ žádosti *</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="custom-housing"
                              checked={housingType === 'custom'}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setHousingType('custom');
                                  housingForm.setValue('requestType', 'apartment');
                                } else {
                                  setHousingType(null);
                                  housingForm.setValue('requestType', '');
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label htmlFor="custom-housing" className="text-foreground">Vlastní bydlení</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="dormitory-housing"
                              checked={housingType === 'dormitory'}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setHousingType('dormitory');
                                  housingForm.setValue('requestType', 'dormitory');
                                } else {
                                  setHousingType(null);
                                  housingForm.setValue('requestType', '');
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <label htmlFor="dormitory-housing" className="text-foreground">Pokoj na ubytovně</label>
                          </div>
                        </div>
                      </div>

                      {/* Pokud je vybrána ubytovna */}
                      {housingType === 'dormitory' && (
                        <div className="bg-accent/10 p-4 rounded-md">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Vítejte v ubytovně U starého Šeptáka</h3>
                          <p className="text-muted-foreground">
                            Vaše žádost o pokoj na ubytovně bude automaticky schválena. Ubytovna poskytuje základní ubytování pro začínající čaroděje.
                          </p>
                        </div>
                      )}

                      {/* Pokud je vybráno vlastní bydlení */}
                      {housingType === 'custom' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="requestType" className="text-foreground">Typ bydlení *</Label>
                              <select
                                id="requestType"
                                {...housingForm.register("requestType")}
                                className="w-full p-2 border rounded-md bg-background text-foreground"
                              >
                                <option value="">Vyberte typ</option>
                                <option value="apartment">Byt</option>
                                <option value="house">Dům</option>
                                <option value="mansion">Sídlo</option>
                              </select>
                              {housingForm.formState.errors.requestType && (
                                <p className="text-sm text-destructive">{housingForm.formState.errors.requestType.message}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="size" className="text-foreground">Velikost</Label>
                              <Input
                                id="size"
                                {...housingForm.register("size")}
                                placeholder="např. 2+1, malý dům, prostorné sídlo"
                                className="bg-background text-foreground"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="housingName" className="text-foreground">Název bydlení</Label>
                              <Input
                                id="housingName"
                                {...housingForm.register("housingName")}
                                placeholder="např. Villa Rosewood, Apartmán u Zlaté Konvice"
                                className="bg-background text-foreground"
                              />
                            </div>
                            <div>
                              <Label htmlFor="housingPassword" className="text-foreground">Heslo pro vstup</Label>
                              <Input
                                id="housingPassword"
                                {...housingForm.register("housingPassword")}
                                placeholder="heslo pro přístup do soukromé místnosti"
                                className="bg-background text-foreground"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Umístění pouze pro vlastní bydlení */}
                      {housingType === 'custom' && (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-foreground">Umístění *</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="area-location"
                                  checked={locationType === 'area'}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setLocationType('area');
                                      housingForm.setValue('location', 'area');
                                      housingForm.setValue('customLocation', '');
                                    } else {
                                      setLocationType(null);
                                      housingForm.setValue('location', '');
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <label htmlFor="area-location" className="text-foreground">Oblast z nabídky</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="custom-location"
                                  checked={locationType === 'custom'}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setLocationType('custom');
                                      housingForm.setValue('location', 'custom');
                                      housingForm.setValue('selectedArea', '');
                                    } else {
                                      setLocationType(null);
                                      housingForm.setValue('location', '');
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                                <label htmlFor="custom-location" className="text-foreground">Vlastní adresa</label>
                              </div>
                            </div>
                          </div>

                          {/* Oblast z nabídky */}
                          {locationType === 'area' && (
                            <div>
                              <Label htmlFor="selectedArea" className="text-foreground">Vyberte oblast</Label>
                              <select
                                id="selectedArea"
                                {...housingForm.register("selectedArea")}
                                className="w-full p-2 border rounded-md bg-background text-foreground"
                              >
                                <option value="">Vyberte oblast</option>
                                <option value="Bradavice a okolí">Bradavice a okolí</option>
                                <option value="Londýn - centrum">Londýn - centrum</option>
                                <option value="Londýn - předměstí">Londýn - předměstí</option>
                                <option value="Diagon Alley">Diagon Alley</option>
                                <option value="Knockturn Alley">Knockturn Alley</option>
                                <option value="Hogsmeade">Hogsmeade</option>
                                <option value="Godric's Hollow">Godric's Hollow</option>
                                <option value="Little Whinging">Little Whinging</option>
                                <option value="Grimmauld Place a okolí">Grimmauld Place a okolí</option>
                                <option value="Venkov - Anglie">Venkov - Anglie</option>
                                <option value="Skotsko">Skotsko</option>
                                <option value="Wales">Wales</option>
                                <option value="Irsko">Irsko</option>
                              </select>
                            </div>
                          )}

                          {/* Vlastní adresa */}
                          {locationType === 'custom' && (
                            <div>
                              <Label htmlFor="customLocation" className="text-foreground">Vlastní adresa</Label>
                              <Input
                                id="customLocation"
                                {...housingForm.register("customLocation")}
                                placeholder="Zadejte konkrétní adresu"
                                className="bg-background text-foreground"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Popis pouze pokud není ubytovna */}
                      {housingType && housingType !== 'dormitory' && (
                        <div>
                          <Label htmlFor="description" className="text-foreground">Popis žádosti *</Label>
                          <Textarea
                            id="description"
                            {...housingForm.register("description")}
                            placeholder="Popište důvod žádosti, specifické požadavky a jakékoliv další informace pro administrátory..."
                            rows={4}
                            className="bg-background text-foreground"
                          />
                          {housingForm.formState.errors.description && (
                            <p className="text-sm text-destructive">{housingForm.formState.errors.description.message}</p>
                          )}
                        </div>
                      )}

                      {/* Tlačítko odesílání - vždy zobrazeno */}
                      {housingType && (
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={createHousingRequestMutation.isPending}
                            className="bg-accent hover:bg-accent/90"
                          >
                            {createHousingRequestMutation.isPending ? "Odesílám..." : "Odeslat žádost"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowHousingForm(false);
                              setHousingType(null);
                              setLocationType(null);
                              housingForm.reset();
                            }}
                          >
                            Zrušit
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Existing Housing Requests */}
              {housingRequests && housingRequests.length > 0 ? (
                <div className="space-y-3">
                  {housingRequests.map((request: any) => (
                    <Card key={request.id} className="border-l-4 border-l-accent">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                request.status === 'pending' ? 'default' :
                                request.status === 'approved' ? 'secondary' : 'destructive'
                              }>
                                {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                {request.status === 'pending' ? 'Čeká na vyřízení' :
                                 request.status === 'approved' ? 'Schváleno' : 'Zamítnuto'}
                              </Badge>
                              <span className="font-medium">
                                {request.requestType === 'apartment' ? 'Byt' :
                                 request.requestType === 'house' ? 'Dům' : 'Kolej'}
                              </span>
                              {request.size && <span className="text-muted-foreground">({request.size})</span>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(request.createdAt)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Postava:</span> {request.character?.firstName} {request.character?.lastName}
                            </div>
                            <div>
                              <span className="font-medium">Umístění:</span> {
                                request.location === 'area' ? request.selectedArea : request.customLocation
                              }
                            </div>
                          </div>

                          {request.assignedAddress && (
                            <div className="text-sm">
                              <span className="font-medium text-green-600">Přidělená adresa:</span> {request.assignedAddress}
                            </div>
                          )}

                          <div className="text-sm">
                            <span className="font-medium">Popis:</span> {request.description}
                          </div>

                          {request.reviewNote && (
                            <div className="text-sm">
                              <span className="font-medium">Poznámka administrátora:</span> {request.reviewNote}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Zatím nemáte žádné žádosti o bydlení</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Klikněte na tlačítko výše pro vytvoření nové žádosti
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
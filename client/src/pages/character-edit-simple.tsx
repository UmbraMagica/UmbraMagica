import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateGameAge } from "@/lib/gameDate";
import { 
  User, 
  ArrowLeft,
  Save,
  Calendar,
  UserCircle,
  Lock
} from "lucide-react";
import { z } from "zod";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Simple schema for user edits (only school and description)
const userEditSchema = z.object({
  school: z.string().optional(),
  description: z.string().optional(),
});

// Admin schema (all fields)
const adminEditSchema = z.object({
  firstName: z.string().min(1, "Jméno je povinné"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Příjmení je povinné"),
  birthDate: z.string().min(1, "Datum narození je povinné"),
  school: z.string().optional(),
  description: z.string().optional(),
});

type UserEditForm = z.infer<typeof userEditSchema>;
type AdminEditForm = z.infer<typeof adminEditSchema>;

export default function CharacterEditSimple() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get character ID from URL search params if available
  const urlParams = new URLSearchParams(window.location.search);
  const characterIdFromUrl = urlParams.get('characterId');

  // Fetch the main character from API
  const { data: mainCharacter } = useQuery<any>({
    queryKey: ["/api/characters/main"],
    enabled: !!user && !characterIdFromUrl,
  });

  // Fetch specific character if ID provided in URL
  const { data: specificCharacter } = useQuery<any>({
    queryKey: ["/api/characters", characterIdFromUrl],
    enabled: !!characterIdFromUrl,
  });

  // Use specific character if available, otherwise main character
  const primaryCharacter = specificCharacter || mainCharacter;
  const isAdmin = user?.role === 'admin';

  // Form for regular users
  const userForm = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      school: "",
      description: "",
    },
  });

  // Form for admins
  const adminForm = useForm<AdminEditForm>({
    resolver: zodResolver(adminEditSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: "",
      school: "",
      description: "",
    },
  });

  // Security check: ensure user can only edit their own characters
  if (primaryCharacter && primaryCharacter.userId !== user?.id && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Přístup zamítnut</h3>
          <p className="text-muted-foreground">
            Nemáte oprávnění upravovat tuto postavu.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => setLocation('/')}
          >
            Zpět na domovskou stránku
          </Button>
        </div>
      </div>
    );
  }

  // Update form values when character data loads
  useEffect(() => {
    if (primaryCharacter) {
      userForm.reset({
        school: primaryCharacter.school || "",
        description: primaryCharacter.description || "",
      });
      
      adminForm.reset({
        firstName: primaryCharacter.firstName || "",
        middleName: primaryCharacter.middleName || "",
        lastName: primaryCharacter.lastName || "",
        birthDate: primaryCharacter.birthDate || "",
        school: primaryCharacter.school || "",
        description: primaryCharacter.description || "",
      });
    }
  }, [primaryCharacter, userForm, adminForm]);

  const updateCharacterMutation = useMutation({
    mutationFn: async (data: UserEditForm | AdminEditForm) => {
      if (!primaryCharacter?.id) {
        throw new Error("Žádná postava k úpravě");
      }
      return apiRequest("PATCH", `/api/characters/${primaryCharacter.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Postava byla úspěšně aktualizována",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${primaryCharacter?.id}`] });
      setLocation(`/character/${primaryCharacter?.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat postavu",
        variant: "destructive",
      });
    },
  });

  const onUserSubmit = (data: UserEditForm) => {
    updateCharacterMutation.mutate(data);
  };

  const onAdminSubmit = (data: AdminEditForm) => {
    updateCharacterMutation.mutate(data);
  };

  if (!primaryCharacter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Žádná postava k úpravě</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Zpět na dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentAge = primaryCharacter.birthDate ? calculateGameAge(primaryCharacter.birthDate) : 0;

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="mr-4 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na dashboard
              </Button>
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                  <UserCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl fantasy-font font-bold text-accent">Úprava postavy</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">{user?.username}</div>
              {isAdmin && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                  <Lock className="h-3 w-3 mr-1" />
                  Admin
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Preview */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                  <User className="text-accent mr-3 h-5 w-5" />
                  Náhled postavy
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  {primaryCharacter.firstName?.[0] || "?"}{primaryCharacter.lastName?.[0] || "?"}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {primaryCharacter.firstName} {primaryCharacter.middleName && `${primaryCharacter.middleName} `}{primaryCharacter.lastName}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {currentAge} let (rok 1926)
                </p>
                {(primaryCharacter as any)?.school && (
                  <p className="text-muted-foreground text-xs mb-3">
                    {(primaryCharacter as any).school}
                  </p>
                )}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Aktivní
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Save className="text-accent mr-3 h-5 w-5" />
                  Upravit informace o postavě
                </CardTitle>
                {!isAdmin && (
                  <p className="text-sm text-muted-foreground">
                    Jméno a datum narození může změnit pouze administrátor
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-6">
                    {/* Admin fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-foreground">Jméno *</Label>
                        <Input
                          id="firstName"
                          {...adminForm.register("firstName")}
                          placeholder="Zadejte jméno"
                          className="bg-muted border-border text-foreground"
                        />
                        {adminForm.formState.errors.firstName && (
                          <p className="text-sm text-destructive">{adminForm.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-foreground">Příjmení *</Label>
                        <Input
                          id="lastName"
                          {...adminForm.register("lastName")}
                          placeholder="Zadejte příjmení"
                          className="bg-muted border-border text-foreground"
                        />
                        {adminForm.formState.errors.lastName && (
                          <p className="text-sm text-destructive">{adminForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName" className="text-foreground">Prostřední jméno</Label>
                      <Input
                        id="middleName"
                        {...adminForm.register("middleName")}
                        placeholder="Zadejte prostřední jméno (volitelné)"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-accent" />
                        Datum narození *
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...adminForm.register("birthDate")}
                        className="bg-muted border-border text-foreground"
                        min="1860-01-01"
                        max="1910-12-31"
                      />
                      {adminForm.formState.errors.birthDate && (
                        <p className="text-sm text-destructive">{adminForm.formState.errors.birthDate.message}</p>
                      )}
                    </div>

                    <hr className="border-border" />

                    <div className="space-y-2">
                      <Label htmlFor="school" className="text-foreground">Škola</Label>
                      <Input
                        id="school"
                        {...adminForm.register("school")}
                        placeholder="Zadejte název školy (volitelné)"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground">Popis postavy</Label>
                      <p className="text-xs text-muted-foreground">
                        Podporuje HTML formátování: <code>&lt;b&gt;tučné&lt;/b&gt;</code>, <code>&lt;i&gt;kurzíva&lt;/i&gt;</code>, <code>&lt;u&gt;podtržené&lt;/u&gt;</code>, odkazy, obrázky
                      </p>
                      <Textarea
                        id="description"
                        {...adminForm.register("description")}
                        placeholder="Napište krátký popis vaší postavy (volitelné)"
                        className="bg-muted border-border text-foreground min-h-[100px]"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setLocation("/")}
                        className="border-border text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Zrušit
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateCharacterMutation.isPending}
                        className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-primary-foreground"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCharacterMutation.isPending ? "Ukládám..." : "Uložit změny"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                    {/* Read-only fields for regular users */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                        Informace pouze pro čtení
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Celé jméno:</span>
                          <p className="text-foreground">{primaryCharacter.firstName} {primaryCharacter.middleName} {primaryCharacter.lastName}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Věk:</span>
                          <p className="text-foreground">{currentAge} let</p>
                        </div>
                      </div>
                    </div>

                    {/* Editable fields for regular users */}
                    <div className="space-y-2">
                      <Label htmlFor="school" className="text-foreground">Škola</Label>
                      <Input
                        id="school"
                        {...userForm.register("school")}
                        placeholder="Zadejte název školy (volitelné)"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground">Popis postavy</Label>
                      <p className="text-xs text-muted-foreground">
                        Podporuje HTML formátování: <code>&lt;b&gt;tučné&lt;/b&gt;</code>, <code>&lt;i&gt;kurzíva&lt;/i&gt;</code>, <code>&lt;u&gt;podtržené&lt;/u&gt;</code>, odkazy, obrázky
                      </p>
                      <Textarea
                        id="description"
                        {...userForm.register("description")}
                        placeholder="Napište krátký popis vaší postavy (volitelné)"
                        className="bg-muted border-border text-foreground min-h-[100px]"
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-border">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setLocation("/")}
                        className="border-border text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Zrušit
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={updateCharacterMutation.isPending}
                        className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-primary-foreground"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCharacterMutation.isPending ? "Ukládám..." : "Uložit změny"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
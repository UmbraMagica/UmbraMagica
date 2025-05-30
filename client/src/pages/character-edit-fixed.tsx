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

export default function CharacterEditFixed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get character ID from URL search params if available
  const urlParams = new URLSearchParams(window.location.search);
  const characterIdFromUrl = urlParams.get('characterId');

  const isAdmin = user?.role === 'admin';

  // Always call hooks in the same order
  const { data: mainCharacter } = useQuery<any>({
    queryKey: ["/api/characters/main"],
    enabled: !!user,
  });

  const { data: specificCharacter } = useQuery<any>({
    queryKey: ["/api/characters", characterIdFromUrl],
    enabled: !!characterIdFromUrl && !!user,
  });

  const userForm = useForm<UserEditForm>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      school: "",
      description: "",
    },
  });

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

  // Determine which character to use - handle if it's an array
  let primaryCharacter;
  if (characterIdFromUrl) {
    primaryCharacter = specificCharacter;
  } else {
    primaryCharacter = mainCharacter;
  }
  
  // If primaryCharacter is an array, get the first item
  if (Array.isArray(primaryCharacter) && primaryCharacter.length > 0) {
    primaryCharacter = primaryCharacter[0];
  }

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
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters/main"] });
      setLocation(`/characters/${primaryCharacter?.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat postavu",
        variant: "destructive",
      });
    },
  });

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

  const currentForm = isAdmin ? adminForm : userForm;
  const currentAge = primaryCharacter ? calculateGameAge(primaryCharacter.birthDate) : 0;

  const onSubmit = (data: UserEditForm | AdminEditForm) => {
    updateCharacterMutation.mutate(data);
  };

  // Security and loading checks after all hooks
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Musíte být přihlášeni pro editaci profilu.</p>
        </div>
      </div>
    );
  }

  if (!primaryCharacter) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Načítám data postavy...</p>
        </div>
      </div>
    );
  }

  if (primaryCharacter && primaryCharacter.userId !== user.id && !isAdmin) {
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

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
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
                {primaryCharacter?.school && (
                  <p className="text-muted-foreground text-xs mb-3">
                    {primaryCharacter.school}
                  </p>
                )}
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Jméno a datum narození může změnit pouze administrátor
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-6">
                  {isAdmin && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground">Základní informace</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Jméno *</Label>
                          <Input
                            id="firstName"
                            {...adminForm.register("firstName")}
                            className="mt-1"
                          />
                          {adminForm.formState.errors.firstName && (
                            <p className="text-sm text-red-500 mt-1">
                              {adminForm.formState.errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="middleName">Prostřední jméno</Label>
                          <Input
                            id="middleName"
                            {...adminForm.register("middleName")}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Příjmení *</Label>
                          <Input
                            id="lastName"
                            {...adminForm.register("lastName")}
                            className="mt-1"
                          />
                          {adminForm.formState.errors.lastName && (
                            <p className="text-sm text-red-500 mt-1">
                              {adminForm.formState.errors.lastName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="birthDate">Datum narození *</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            {...adminForm.register("birthDate")}
                            className="mt-1"
                          />
                          {adminForm.formState.errors.birthDate && (
                            <p className="text-sm text-red-500 mt-1">
                              {adminForm.formState.errors.birthDate.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-foreground flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                        Informace pouze pro čtení
                      </h3>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Celé jméno:
                            </Label>
                            <p className="text-foreground">
                              {primaryCharacter.firstName} {primaryCharacter.middleName && `${primaryCharacter.middleName} `}{primaryCharacter.lastName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Věk:
                            </Label>
                            <p className="text-foreground">{currentAge} let</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="school">Škola</Label>
                      <Input
                        id="school"
                        {...(isAdmin ? adminForm.register("school") : userForm.register("school"))}
                        className="mt-1"
                        placeholder="Například: Bradavice"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Popis postavy</Label>
                      <Textarea
                        id="description"
                        {...(isAdmin ? adminForm.register("description") : userForm.register("description"))}
                        className="mt-1 min-h-[120px]"
                        placeholder="Podporuje HTML formátování: <b>tučné</b>, <i>kurzíva</i>, <u>podtržené</u>, odkazy, obrázky"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Můžete použít základní HTML tagy pro formátování textu.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={updateCharacterMutation.isPending}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {updateCharacterMutation.isPending ? "Ukládám..." : "Uložit změny"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation(`/characters/${primaryCharacter?.id}`)}
                      className="border-border hover:bg-muted"
                    >
                      Zrušit
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
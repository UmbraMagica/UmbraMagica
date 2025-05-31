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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { characterEditSchema, characterAdminEditSchema } from "../../../shared/schema";

type UserEditForm = z.infer<typeof characterEditSchema>;
type AdminEditForm = z.infer<typeof characterAdminEditSchema>;

// Seznam kouzelných škol seřazený abecedně
const MAGICAL_SCHOOLS = [
  "Bradavice",
  "Durmstrang", 
  "Ilvermorny",
  "Koldovstoretz",
  "Krásnohůlky",
  "Kruval",
  "Mahoutokoro",
  "Salemská škola pro čarodějky",
  "Uagadou",
  "Domácí vzdělávání"
];

export default function CharacterEditFixedNav() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Get character ID from URL path parameters
  const pathParts = window.location.pathname.split('/');
  const characterIdFromUrl = pathParts[pathParts.length - 1] !== 'edit' ? pathParts[pathParts.length - 1] : null;

  // Fetch main character if no ID provided
  const { data: primaryCharacter } = useQuery({
    queryKey: characterIdFromUrl ? ['/api/characters', characterIdFromUrl] : ['/api/characters/main'],
    enabled: !!user,
  });

  const characterId = characterIdFromUrl || primaryCharacter?.id;

  const isAdmin = user?.role === 'admin';

  // User form for editing limited fields
  const userForm = useForm<UserEditForm>({
    resolver: zodResolver(characterEditSchema),
    defaultValues: {
      school: primaryCharacter?.school || "",
      description: primaryCharacter?.description || "",
      height: primaryCharacter?.height || undefined,
      weight: primaryCharacter?.weight || undefined,
    },
  });

  // Admin form for editing all fields
  const adminForm = useForm<AdminEditForm>({
    resolver: zodResolver(characterAdminEditSchema),
    defaultValues: {
      firstName: primaryCharacter?.firstName || "",
      middleName: primaryCharacter?.middleName || "",
      lastName: primaryCharacter?.lastName || "",
      birthDate: primaryCharacter?.birthDate || "",
      school: primaryCharacter?.school || "",
      description: primaryCharacter?.description || "",
    },
  });

  // Update forms when character data loads
  useEffect(() => {
    if (primaryCharacter) {
      userForm.reset({
        school: primaryCharacter.school || "",
        description: primaryCharacter.description || "",
        height: primaryCharacter.height || undefined,
        weight: primaryCharacter.weight || undefined,
      });
      
      adminForm.reset({
        firstName: primaryCharacter.firstName || "",
        middleName: primaryCharacter.middleName || "",
        lastName: primaryCharacter.lastName || "",
        birthDate: primaryCharacter.birthDate || "",
        school: primaryCharacter.school || "",
        description: primaryCharacter.description || "",
        height: primaryCharacter.height || undefined,
        weight: primaryCharacter.weight || undefined,
      });
    }
  }, [primaryCharacter, userForm, adminForm]);

  // Calculate age for display
  const currentAge = primaryCharacter?.birthDate ? calculateGameAge(primaryCharacter.birthDate) : 0;

  // Watch form changes for live preview
  const watchedAdminData = adminForm.watch();
  const watchedUserData = userForm.watch();

  // Calculate age from watched birth date
  const previewAge = watchedAdminData.birthDate ? calculateGameAge(watchedAdminData.birthDate) : currentAge;

  const updateCharacterMutation = useMutation({
    mutationFn: async (data: Partial<UserEditForm> | Partial<AdminEditForm>) => {
      if (!characterId) throw new Error("No character ID");
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update character");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Postava upravena",
        description: "Změny byly úspěšně uloženy.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      queryClient.invalidateQueries({ queryKey: ['/api/characters/main'] });
      if (characterId) {
        queryClient.invalidateQueries({ queryKey: ['/api/characters', characterId.toString()] });
      }
      // Redirect back to character profile
      setLocation(`/character/${characterId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit postavu.",
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání postavy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <UserCircle className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Editace postavy</h1>
                <p className="text-sm text-muted-foreground">
                  {primaryCharacter.firstName} {primaryCharacter.middleName && `${primaryCharacter.middleName} `}{primaryCharacter.lastName}
                </p>
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
                  {(isAdmin ? watchedAdminData.firstName : primaryCharacter.firstName)?.[0] || "?"}{(isAdmin ? watchedAdminData.lastName : primaryCharacter.lastName)?.[0] || "?"}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {isAdmin ? (
                    <>
                      {watchedAdminData.firstName || primaryCharacter.firstName} {watchedAdminData.middleName && `${watchedAdminData.middleName} `}{watchedAdminData.lastName || primaryCharacter.lastName}
                    </>
                  ) : (
                    <>
                      {primaryCharacter.firstName} {primaryCharacter.middleName && `${primaryCharacter.middleName} `}{primaryCharacter.lastName}
                    </>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {previewAge} let (rok 1926)
                </p>
                {(isAdmin ? watchedAdminData.school : watchedUserData.school || primaryCharacter.school) && (
                  <p className="text-muted-foreground text-xs mb-3">
                    {isAdmin ? watchedAdminData.school : watchedUserData.school || primaryCharacter.school}
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
                <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                  <Calendar className="text-accent mr-3 h-5 w-5" />
                  {isAdmin ? "Úprava postavy (Admin)" : "Editace profilu"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={isAdmin ? adminForm.handleSubmit(onAdminSubmit) : userForm.handleSubmit(onUserSubmit)} className="space-y-6">
                  {/* Basic info - editable for admins, read-only for users */}
                  {isAdmin ? (
                    <div className="space-y-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <h4 className="font-medium text-foreground">Základní informace (administrátorská editace)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-firstName" className="text-foreground">Křestní jméno</Label>
                          <Input
                            id="admin-firstName"
                            {...adminForm.register("firstName")}
                            placeholder="Křestní jméno"
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-middleName" className="text-foreground">Prostřední jméno (volitelné)</Label>
                          <Input
                            id="admin-middleName"
                            {...adminForm.register("middleName")}
                            placeholder="Prostřední jméno"
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-lastName" className="text-foreground">Příjmení</Label>
                          <Input
                            id="admin-lastName"
                            {...adminForm.register("lastName")}
                            placeholder="Příjmení"
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-birthDate" className="text-foreground">Datum narození</Label>
                          <Input
                            id="admin-birthDate"
                            type="date"
                            {...adminForm.register("birthDate")}
                            className="bg-muted border-border text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-foreground">Základní informace (pouze pro čtení)</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Jméno:</span>
                          <p className="font-medium text-foreground">
                            {primaryCharacter.firstName} {primaryCharacter.middleName && `${primaryCharacter.middleName} `}{primaryCharacter.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Věk:</span>
                          <p className="font-medium text-foreground">{currentAge} let</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="school" className="text-foreground flex items-center gap-2">
                      Škola
                      {primaryCharacter?.schoolSetAt && !isAdmin && (
                        <Lock className="h-4 w-4 text-amber-500" />
                      )}
                    </Label>
                    <Select
                      value={isAdmin ? (adminForm.watch("school") || "none") : (userForm.watch("school") || "none")}
                      onValueChange={(value) => {
                        if (isAdmin) {
                          adminForm.setValue("school", value === "none" ? "" : value);
                        } else {
                          userForm.setValue("school", value === "none" ? "" : value);
                        }
                      }}
                      disabled={!!primaryCharacter?.schoolSetAt && !isAdmin}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue placeholder="Vyberte školu (volitelné)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Žádná škola</SelectItem>
                        {MAGICAL_SCHOOLS.map((school) => (
                          <SelectItem key={school} value={school}>
                            {school}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {primaryCharacter?.schoolSetAt && (
                      <p className="text-sm text-amber-600 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Škola již byla nastavena a nemůže být změněna
                      </p>
                    )}
                  </div>

                  {/* Fyzické vlastnosti */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Fyzické vlastnosti</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-foreground flex items-center gap-2">
                          Výška (cm)
                          {primaryCharacter?.heightSetAt && (
                            <Lock className="h-4 w-4 text-amber-500" />
                          )}
                        </Label>
                        <Input
                          id="height"
                          type="number"
                          min="120"
                          max="250"
                          {...(isAdmin ? adminForm.register("height", { valueAsNumber: true }) : userForm.register("height", { valueAsNumber: true }))}
                          placeholder="např. 175"
                          disabled={!!primaryCharacter?.heightSetAt && !isAdmin}
                          className="bg-muted border-border text-foreground disabled:opacity-50"
                        />
                        {primaryCharacter?.heightSetAt && (
                          <p className="text-xs text-muted-foreground">
                            Výška byla nastavena jednou a nelze ji změnit
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-foreground">Váha (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="30"
                          max="300"
                          {...(isAdmin ? adminForm.register("weight", { valueAsNumber: true }) : userForm.register("weight", { valueAsNumber: true }))}
                          placeholder="např. 70"
                          className="bg-muted border-border text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-foreground">Popis postavy</Label>
                    <Textarea
                      id="description"
                      {...(isAdmin ? adminForm.register("description") : userForm.register("description"))}
                      placeholder="Napište krátký popis vaší postavy (volitelné)"
                      className="bg-muted border-border text-foreground min-h-[100px]"
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Podporuje HTML formátování: <code>&lt;b&gt;tučné&lt;/b&gt;</code>, <code>&lt;i&gt;kurzíva&lt;/i&gt;</code>, <code>&lt;u&gt;podtržené&lt;/u&gt;</code>, odkazy, obrázky
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setLocation(isAdmin ? "/admin" : `/character/${characterId}`)}
                      className="border-border text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {isAdmin ? "Zpět do administrace" : "Zrušit"}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
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
  Lock,
  Upload,
  X
} from "lucide-react";
import { characterEditSchema, characterAdminEditSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";
import { CharacterAvatar } from "@/components/CharacterAvatar";

type UserEditForm = z.infer<typeof characterEditSchema>;
type AdminEditForm = z.infer<typeof characterAdminEditSchema>;

export default function CharacterEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';

  // Fetch the main character
  const { data: mainCharacter } = useQuery<any>({
    queryKey: ["/api/characters/main"],
    enabled: !!user,
  });

  const primaryCharacter = mainCharacter;

  // Regular user form (only school and description)
  const userForm = useForm<UserEditForm>({
    resolver: zodResolver(characterEditSchema),
    defaultValues: {
      school: "",
      description: "",
    },
  });

  // Admin form (all fields)
  const adminForm = useForm<AdminEditForm>({
    resolver: zodResolver(characterAdminEditSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: "",
      school: "",
      description: "",
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
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
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

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!primaryCharacter?.id) {
        throw new Error("Žádná postava k nahrání avataru");
      }
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(`/api/characters/${primaryCharacter.id}/avatar`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Nepodařilo se nahrát avatar');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Úspěch",
        description: "Avatar byl úspěšně nahrán",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se nahrát avatar",
        variant: "destructive",
      });
      setAvatarPreview(null);
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!primaryCharacter?.id) {
        throw new Error("Žádná postava k odstranění avataru");
      }
      
      const response = await fetch(`/api/characters/${primaryCharacter.id}/avatar`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Nepodařilo se odstranit avatar');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Avatar byl úspěšně odstraněn",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odstranit avatar",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserEditForm | AdminEditForm) => {
    updateCharacterMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Chyba",
        description: "Prosím vyberte obrázek",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Chyba", 
        description: "Obrázek je příliš velký. Maximální velikost je 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadAvatarMutation.mutate(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    removeAvatarMutation.mutate();
  };

  // Get current values for preview
  const getCurrentValues = () => {
    if (!primaryCharacter) {
      return {
        firstName: "",
        middleName: "",
        lastName: "",
        birthDate: "",
        school: "",
        description: "",
      };
    }

    if (isAdmin) {
      const values = adminForm.watch();
      return {
        firstName: values.firstName || primaryCharacter.firstName || "",
        middleName: values.middleName || primaryCharacter.middleName || "",
        lastName: values.lastName || primaryCharacter.lastName || "",
        birthDate: values.birthDate || primaryCharacter.birthDate || "",
        school: values.school || primaryCharacter.school || "",
        description: values.description || primaryCharacter.description || "",
      };
    } else {
      const values = userForm.watch();
      return {
        firstName: primaryCharacter.firstName || "",
        middleName: primaryCharacter.middleName || "",
        lastName: primaryCharacter.lastName || "",
        birthDate: primaryCharacter.birthDate || "",
        school: values.school || primaryCharacter.school || "",
        description: values.description || primaryCharacter.description || "",
      };
    }
  };

  const currentValues = getCurrentValues();

  // Show loading while character data is being fetched
  if (!primaryCharacter) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Načítám data postavy...</p>
        </div>
      </div>
    );
  }

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
                <div className="mb-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar náhled"
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-muted"
                    />
                  ) : primaryCharacter?.avatar ? (
                    <img
                      src={primaryCharacter.avatar}
                      alt="Současný avatar"
                      className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-muted"
                    />
                  ) : (
                    <CharacterAvatar 
                      character={{
                        firstName: getCurrentValues().firstName,
                        lastName: getCurrentValues().lastName,
                        avatar: null
                      }} 
                      size="lg" 
                      className="w-24 h-24 mx-auto"
                    />
                  )}
                </div>
                
                {/* Avatar management */}
                <div className="mb-4 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={uploadAvatarMutation.isPending}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadAvatarMutation.isPending ? "Nahrávám..." : "Nahrát avatar"}
                  </Button>
                  
                  {(primaryCharacter?.avatar || avatarPreview) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={removeAvatarMutation.isPending}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {removeAvatarMutation.isPending ? "Odstraňuji..." : "Odstranit avatar"}
                    </Button>
                  )}
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {getCurrentValues().firstName || "Jméno"} {getCurrentValues().middleName && `${getCurrentValues().middleName} `}{getCurrentValues().lastName || "Příjmení"}
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  {getCurrentValues().birthDate ? 
                    `${calculateGameAge(getCurrentValues().birthDate)} let` : 
                    "Věk nezadán"
                  }
                </p>
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
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <form onSubmit={adminForm.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Label htmlFor="birthDate" className="text-foreground">Datum narození *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...adminForm.register("birthDate")}
                        className="bg-muted border-border text-foreground"
                      />
                      {adminForm.formState.errors.birthDate && (
                        <p className="text-sm text-destructive">{adminForm.formState.errors.birthDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school" className="text-foreground">Škola</Label>
                      <Input
                        id="school"
                        {...adminForm.register("school")}
                        placeholder="Zadejte školu"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground">Popis postavy</Label>
                      <Textarea
                        id="description"
                        {...adminForm.register("description")}
                        placeholder="Popište svou postavu..."
                        className="bg-muted border-border text-foreground min-h-[120px]"
                      />
                    </div>

                    <div className="flex items-center space-x-4 pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={updateCharacterMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCharacterMutation.isPending ? "Ukládám..." : "Uložit změny"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation('/')}
                        className="text-foreground border-border hover:bg-muted"
                      >
                        Zrušit
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={userForm.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="school" className="text-foreground">Škola</Label>
                      <Input
                        id="school"
                        {...userForm.register("school")}
                        placeholder="Zadejte školu"
                        className="bg-muted border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-foreground">Popis postavy</Label>
                      <Textarea
                        id="description"
                        {...userForm.register("description")}
                        placeholder="Popište svou postavu..."
                        className="bg-muted border-border text-foreground min-h-[120px]"
                      />
                    </div>

                    <div className="flex items-center space-x-4 pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={updateCharacterMutation.isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCharacterMutation.isPending ? "Ukládám..." : "Uložit změny"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation('/')}
                        className="text-foreground border-border hover:bg-muted"
                      >
                        Zrušit
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
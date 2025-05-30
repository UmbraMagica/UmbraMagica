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
import { characterRequestSchema } from "@shared/schema";
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
  Settings
} from "lucide-react";

type CharacterRequestForm = z.infer<typeof characterRequestSchema>;

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

  // Fetch user's character requests
  const { data: characterRequests = [] } = useQuery<CharacterRequest[]>({
    queryKey: ["/api/character-requests/my"],
    enabled: !!user,
  });

  // Fetch user's characters (filter only alive characters)
  const { data: allUserCharacters = [] } = useQuery({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Filter only alive characters (not in cemetery)
  const userCharacters = allUserCharacters.filter((char: any) => !char.deathDate);

  // Fetch main character
  const { data: mainCharacter } = useQuery({
    queryKey: ["/api/characters/main"],
    enabled: !!user,
  });

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

  // Set main character mutation
  const setMainCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/set-main`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Primární postava nastavena",
        description: "Vaše primární postava byla úspěšně změněna.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters/main"] });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se nastavit primární postavu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CharacterRequestForm) => {
    createRequestMutation.mutate(data);
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
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">
                              {character.firstName} {character.middleName} {character.lastName}
                            </h4>
                            {userCharacters.length > 1 && mainCharacter?.id === character.id && (
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
                        {userCharacters.length > 1 && mainCharacter?.id !== character.id && (
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
        </div>
      </div>
    </div>
  );
}
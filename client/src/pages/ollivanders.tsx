import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Sparkles, ArrowLeft, Eye, EyeOff, Settings, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import type { Wand } from "@shared/types";
import { apiFetch } from "@/lib/queryClient";

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Ollivanders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showWandDetails, setShowWandDetails] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  
  // Custom wand creation state
  const [customWand, setCustomWand] = useState({
    wood: "",
    core: "",
    length: "",
    flexibility: "",
    description: ""
  });

  // Get current user and characters
  const { data: user } = useQuery({
    queryKey: [`${API_URL}/api/auth/user`]
  });

  const { data: allCharacters = [] } = useQuery({
    queryKey: ['/api/characters'],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0     // Don't cache
  });

  // Get user's alive characters and find the active one
  const userCharacters = Array.isArray(allCharacters) ? allCharacters.filter((char: any) => !char.deathDate && !char.isSystem) : [];
  const activeCharacter = userCharacters.find((char: any) => char.isActive);
  
  // Load character from localStorage (same as home page)
  useEffect(() => {
    if (userCharacters && userCharacters.length > 0) {
      const savedCharacterId = localStorage.getItem('selectedCharacterId');
      if (savedCharacterId) {
        const savedCharacter = userCharacters.find((char: any) => char.id === parseInt(savedCharacterId));
        if (savedCharacter && !savedCharacter.deathDate) {
          setSelectedCharacter(savedCharacter);
          return;
        }
      }
      
      // If no saved character, use active character first, then first alive character
      const activeCharacter = userCharacters.find((char: any) => char.isActive && !char.deathDate);
      const firstAliveCharacter = userCharacters.find((char: any) => !char.deathDate);
      const characterToUse = activeCharacter || firstAliveCharacter;
      
      if (characterToUse && !selectedCharacter) {
        setSelectedCharacter(characterToUse);
        localStorage.setItem('selectedCharacterId', characterToUse.id.toString());
      }
    }
  }, [userCharacters]);

  // Debug: log načítání všech postav
  useEffect(() => {
    if (allCharacters) {
      console.log("[Ollivanders] Načteno allCharacters:", allCharacters);
    }
  }, [allCharacters]);

  // Debug: log načítání uživatelských postav
  useEffect(() => {
    if (userCharacters) {
      console.log("[Ollivanders] Načteno userCharacters:", userCharacters);
    }
  }, [userCharacters]);

  // Funkce pro změnu postavy v roletce Ollivandera
  const handleCharacterChange = (characterId: string) => {
    console.log("[Ollivanders] handleCharacterChange na:", characterId);
    const selectedChar = userCharacters.find((char: any) => char.id === parseInt(characterId));
    if (selectedChar) {
      setSelectedCharacter(selectedChar);
      localStorage.setItem('selectedCharacterId', selectedChar.id.toString());
      console.log("[Ollivanders] Nastaven selectedCharacter:", selectedChar);
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${selectedChar.id}/wand`] });
    }
  };

  const mainCharacter = selectedCharacter || activeCharacter;

  // Function to refresh cache
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
    queryClient.removeQueries({ queryKey: ['/api/characters'] }); // Force complete removal
    // Invalidate all wand queries for any character
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.includes('/api/characters/') && key.includes('/wand');
      }
    });
  };

  // Refresh cache when selected character changes
  useEffect(() => {
    if (selectedCharacter) {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${selectedCharacter.id}/wand`] });
    }
  }, [selectedCharacter, queryClient]);

  // Auto-refresh when component mounts to ensure fresh data
  useEffect(() => {
    refreshData();
  }, []);

  // Get currently selected character's wand
  const { data: characterWand, isLoading: wandLoading } = useQuery<Wand | null>({
    queryKey: [`/api/characters/${mainCharacter?.id}/wand`],
    enabled: !!mainCharacter?.id && mainCharacter.id !== undefined,
    staleTime: 0, // Force fresh data
    gcTime: 0     // Don't cache (TanStack Query v5)
  });

  console.log('Ollivanders - Character wand query key:', `/api/characters/${mainCharacter?.id}/wand`);
  console.log('Ollivanders - Character wand data:', characterWand);

  // Debug: log načítání hůlky
  useEffect(() => {
    if (mainCharacter?.id && characterWand !== undefined) {
      console.log("[Ollivanders] Načítám hůlku pro postavu:", mainCharacter.id, characterWand);
    }
  }, [mainCharacter?.id, characterWand]);

  // Get wand components for manual selection
  const { data: wandComponents } = useQuery<{
    woods: Array<{ name: string; shortDescription: string; longDescription: string; availableForRandom?: boolean }>;
    cores: Array<{ name: string; category: string; description: string; availableForRandom?: boolean }>;
    lengths: Array<{ name: string; description: string; availableForRandom?: boolean }>;
    flexibilities: Array<{ name: string; description: string; availableForRandom?: boolean }>;
  }>({
    queryKey: ['/api/wand-components'],
    queryFn: async () => {
      return apiFetch(`${API_URL}/api/wand-components`);
    },
  });

  // Debug: log načítání komponent hůlky
  useEffect(() => {
    if (wandComponents) {
      console.log("[Ollivanders] Načteny wandComponents:", wandComponents);
    }
  }, [wandComponents]);

  // Debug: log načítání hůlky
  useEffect(() => {
    if (mainCharacter?.id) {
      console.log("[Ollivanders] Načítám hůlku pro postavu:", mainCharacter.id);
    }
  }, [mainCharacter?.id]);

  // Visit Ollivanders mutation (random wand)
  const visitOllivandersMutation = useMutation({
    mutationFn: async () => {
      if (!mainCharacter?.id) throw new Error("No character selected");
      console.log("[Ollivanders] Posílám požadavek na návštěvu Ollivandera pro postavu:", mainCharacter.id);
      const response = await fetch(`${API_URL}/api/characters/${mainCharacter.id}/visit-ollivanders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('jwt_token') ? { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` } : {}),
        },
        credentials: 'include'
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("[Ollivanders] Chyba při návštěvě Ollivandera:", text);
        throw new Error(text || 'Failed to visit Ollivanders');
      }
      const data = await response.json();
      console.log("[Ollivanders] Odpověď z API:", data);
      return data;
    },
    onSuccess: (newWand) => {
      console.log("[Ollivanders] Návštěva Ollivandera úspěšná, nová hůlka:", newWand);
      toast({
        title: "Gratulujeme!",
        description: `${mainCharacter?.firstName} získal novou hůlku od pana Ollivandera!`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${mainCharacter?.id}/wand`] });
    },
    onError: (error) => {
      console.error("[Ollivanders] Chyba při návštěvě Ollivandera (mutace):", error);
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create custom wand mutation
  const createCustomWandMutation = useMutation({
    mutationFn: async () => {
      if (!mainCharacter?.id) throw new Error("No character selected");
      console.log("[Ollivanders] Posílám požadavek na tvorbu vlastní hůlky pro postavu:", mainCharacter.id, customWand);
      const response = await fetch(`${API_URL}/api/characters/${mainCharacter.id}/create-custom-wand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('jwt_token') ? { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` } : {}),
        },
        body: JSON.stringify(customWand),
        credentials: 'include'
      });
      if (!response.ok) {
        const text = await response.text();
        console.error("[Ollivanders] Chyba při tvorbě vlastní hůlky:", text);
        throw new Error(text || 'Failed to create custom wand');
      }
      const data = await response.json();
      console.log("[Ollivanders] Odpověď z API:", data);
      return data;
    },
    onSuccess: (newWand) => {
      console.log("[Ollivanders] Vlastní hůlka úspěšně vytvořena:", newWand);
      toast({
        title: "Hůlka vytvořena!",
        description: `${mainCharacter?.firstName} má novou vlastní hůlku!`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${mainCharacter?.id}/wand`] });
    },
    onError: (error) => {
      console.error("[Ollivanders] Chyba při tvorbě vlastní hůlky (mutace):", error);
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Přepis dalších fetch volání na apiFetch
  async function visitOllivanders() {
    if (!mainCharacter) return;
    await apiFetch(`${API_URL}/api/characters/${mainCharacter.id}/visit-ollivanders`, { method: 'POST' });
  }

  async function createCustomWand() {
    if (!mainCharacter) return;
    await apiFetch(`${API_URL}/api/characters/${mainCharacter.id}/create-custom-wand`, { method: 'POST' });
  }

  if (!user || !mainCharacter) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Vyberte si postavu pro návštěvu U Ollivandera.</p>
        </div>
      </div>
    );
  }

  // If character is dead, they can't visit
  if (mainCharacter.deathDate) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Mrtvé postavy nemohou navštívit obchod s hůlkami.</p>
            <Button 
              onClick={() => setLocation('/')} 
              className="mt-4"
              variant="outline"
            >
              Zpět domů
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasWand = !wandLoading && characterWand !== null && characterWand !== undefined;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět domů
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-8 w-8" />
            U Ollivandera - Výrobce hůlek
          </h1>
        </div>
        
        {/* Character Info + roletka pro výběr postavy */}
        {userCharacters.length > 1 && (
          <Select
            value={mainCharacter?.id?.toString() || ""}
            onValueChange={handleCharacterChange}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Vyberte postavu">
                {mainCharacter ? (
                  <div className="flex items-center gap-2">
                    <CharacterAvatar character={mainCharacter} size="sm" />
                    <span className="truncate">
                      {mainCharacter.firstName} {mainCharacter.lastName}
                    </span>
                  </div>
                ) : (
                  "Vyberte postavu"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {userCharacters.filter((char: any) => !char.deathDate).map((character: any) => (
                <SelectItem key={character.id} value={character.id.toString()}>
                  <div className="flex items-center gap-2">
                    <CharacterAvatar character={character} size="sm" />
                    <span>
                      {character.firstName} {character.lastName}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {userCharacters.length === 1 && mainCharacter && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Postava:</span>
            <div className="flex items-center gap-2">
              <CharacterAvatar character={mainCharacter} size="sm" />
              <span className="font-medium text-foreground">
                {mainCharacter.firstName} {mainCharacter.lastName}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Shop Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Vítejte v nejlepším obchodě s hůlkami v kouzelné Anglii!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Pan Ollivander vás vítá ve svém slavném obchodě. Každá hůlka je jedinečná a vybírá si svého čaroděje. 
              Zde naleznete hůlky vyrobené z nejkvalitnějších materiálů s jádry z dračí blány, 
              vlasu jednorožce nebo péra fénixe.
            </p>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Pamatujte:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Hůlka si vybírá čaroděje, ne naopak</li>
                <li>• Každá hůlka má své vlastní jádro, dřevo, délku a ohebnost</li>
                <li>• Bez hůlky nelze sesílat kouzla</li>
                <li>• Každá postava může mít pouze jednu hůlku</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Dostupnost komponent:</p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <span className="font-medium">Náhodný výběr:</span> Ollivander vybírá ze standardně dostupných komponent</li>
                <li>• <span className="font-medium">Ruční tvorba:</span> Můžete si vybrat z úplného sortimentu včetně vzácných materiálů</li>
                <li>• <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1 rounded text-xs">Ruční pouze</span> komponenty nejsou používány při náhodném výběru</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Character's Current Wand */}
        {hasWand && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vaše současná hůlka</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWandDetails(!showWandDetails)}
                >
                  {showWandDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showWandDetails ? "Skrýt detaily" : "Zobrazit detaily"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-sm">
                    {characterWand.wood}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {characterWand.core}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {characterWand.length}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {characterWand.flexibility}
                  </Badge>
                </div>
                
                {showWandDetails && characterWand.description && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {characterWand.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Získáno: {new Date(characterWand.acquiredAt).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    ✅ Vaša postava má hůlku a může sesílat kouzla!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Get a Wand */}
        {!hasWand && !wandLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Získejte svou první hůlku</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Pan Ollivander pozorně sleduje vaši postavu a je připraven vám pomoci najít tu pravou hůlku.
                Můžete nechat výběr na něm, nebo si pečlivě vybrat jednotlivé komponenty sami.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">ℹ️ Informace o výběru komponent</h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p>• <strong>Náhodný výběr:</strong> Ollivander vybírá pouze z komponent povolených administrátory</p>
                  <p>• <strong>Ruční výběr:</strong> Můžete si vybrat z všech dostupných komponent</p>
                  <p>• <strong>Štítek "Pouze ruční výběr":</strong> Tyto komponenty nejsou dostupné v náhodném výběru</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Bez hůlky nemůžete sesílat kouzla v chatech!
                </p>
              </div>

              <Tabs defaultValue="random" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="random" className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4" />
                    Náhodný výběr
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Vlastní výběr
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="random" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Nechte pana Ollivandera vybrat hůlku, která si vás zvolí. Každá hůlka je jedinečná
                    a pan Ollivander má zkušenosti s párovániím hůlek s jejich budoucími majiteli.
                  </p>
                  <Button
                    onClick={() => visitOllivandersMutation.mutate()}
                    disabled={visitOllivandersMutation.isPending}
                    size="lg"
                    className="w-full"
                  >
                    <Wand2 className="h-5 w-5 mr-2" />
                    {visitOllivandersMutation.isPending ? "Vybírám hůlku..." : "Nechat Ollivandera vybrat"}
                  </Button>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vyberte si jednotlivé komponenty hůlky podle svých preferencí. Pan Ollivander
                    respektuje vaše přání a pomůže vám vytvořit jedinečnou hůlku.
                  </p>
                  
                  {wandComponents && (
                    <div className="grid gap-4">
                      {/* Wood Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Dřevo hůlky</label>
                        <Select value={customWand.wood} onValueChange={(value) => setCustomWand(prev => ({ ...prev, wood: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte dřevo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wandComponents?.woods?.map((wood) => (
                              <SelectItem key={wood.name} value={wood.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{wood.name}</span>
                                    {wood.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Pouze ruční výběr</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-normal break-words">{wood.shortDescription}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Core Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Jádro hůlky</label>
                        <Select value={customWand.core} onValueChange={(value) => setCustomWand(prev => ({ ...prev, core: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte jádro..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wandComponents?.cores?.map((core) => (
                              <SelectItem key={core.name} value={core.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{core.name}</span>
                                    {core.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Pouze ruční výběr</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-normal break-words">{core.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Length Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Délka hůlky</label>
                        <Select value={customWand.length} onValueChange={(value) => setCustomWand(prev => ({ ...prev, length: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte délku..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wandComponents?.lengths?.map((length) => (
                              <SelectItem key={typeof length === 'string' ? length : length.name} value={typeof length === 'string' ? length : length.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{typeof length === 'string' ? length : length.name}</span>
                                    {typeof length === 'object' && length.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Pouze ruční výběr</span>
                                    )}
                                  </div>
                                  {typeof length === 'object' && length.description && (
                                    <div className="text-xs text-muted-foreground whitespace-normal break-words">{length.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Flexibility Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Ohebnost hůlky</label>
                        <Select value={customWand.flexibility} onValueChange={(value) => setCustomWand(prev => ({ ...prev, flexibility: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte ohebnost..." />
                          </SelectTrigger>
                          <SelectContent>
                            {wandComponents?.flexibilities?.map((flexibility) => (
                              <SelectItem key={typeof flexibility === 'string' ? flexibility : flexibility.name} value={typeof flexibility === 'string' ? flexibility : flexibility.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{typeof flexibility === 'string' ? flexibility : flexibility.name}</span>
                                    {typeof flexibility === 'object' && flexibility.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Pouze ruční výběr</span>
                                    )}
                                  </div>
                                  {typeof flexibility === 'object' && flexibility.description && (
                                    <div className="text-xs text-muted-foreground whitespace-normal break-words">{flexibility.description}</div>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Custom Description */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Vlastní popis (volitelný)</label>
                        <Textarea
                          value={customWand.description}
                          onChange={(e) => setCustomWand(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Můžete přidat vlastní popis hůlky..."
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={() => createCustomWandMutation.mutate()}
                        disabled={createCustomWandMutation.isPending || !customWand.wood || !customWand.core || !customWand.length || !customWand.flexibility}
                        size="lg"
                        className="w-full"
                      >
                        <Wand2 className="h-5 w-5 mr-2" />
                        {createCustomWandMutation.isPending ? "Vytvářím hůlku..." : "Vytvořit vlastní hůlku"}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {wandLoading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Kontroluji vaši hůlku...</p>
            </CardContent>
          </Card>
        )}

        {/* Wand Information */}
        <Card>
          <CardHeader>
            <CardTitle>O hůlkách</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {wandComponents && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Woods */}
                  <div>
                    <h4 className="font-medium mb-2 text-amber-600 dark:text-amber-400">
                      🌳 Hůlková dřeva ({wandComponents.woods?.length || 0} druhů)
                    </h4>
                    <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                      {wandComponents.woods?.map((wood) => (
                        <div key={wood.name} className="flex items-start gap-1">
                          <p>
                            <strong>{wood.name}:</strong> {wood.shortDescription}
                            {wood.availableForRandom === false && (
                              <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">
                                Pouze ruční výběr
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cores */}
                  <div>
                    <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                      🔥 Jádra hůlek ({wandComponents.cores?.length || 0} druhů)
                    </h4>
                    <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                      {wandComponents.cores?.map((core) => (
                        <div key={core.name} className="flex items-start gap-1">
                          <p>
                            <strong>{core.name}:</strong> {core.description}
                            {core.availableForRandom === false && (
                              <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">
                                Pouze ruční výběr
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                  {/* Lengths */}
                  <div>
                    <h4 className="font-medium mb-2 text-purple-600 dark:text-purple-400">
                      📏 Délky hůlek ({wandComponents.lengths?.length || 0} velikostí)
                    </h4>
                    <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                      {wandComponents.lengths?.map((length) => (
                        <div key={length.name} className="flex items-start gap-1">
                          <p>
                            <strong>{length.name}:</strong> {length.description}
                            {length.availableForRandom === false && (
                              <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">
                                Pouze ruční výběr
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flexibilities */}
                  <div>
                    <h4 className="font-medium mb-2 text-indigo-600 dark:text-indigo-400">
                      🌊 Ohebnost ({wandComponents.flexibilities?.length || 0} stupňů)
                    </h4>
                    <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                      {wandComponents.flexibilities?.map((flexibility) => (
                        <div key={flexibility.name} className="flex items-start gap-1">
                          <p>
                            <strong>{flexibility.name}:</strong> {flexibility.description}
                            {flexibility.availableForRandom === false && (
                              <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-1 py-0.5 rounded">
                                Pouze ruční výběr
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">📊 Celkové statistiky:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-amber-800 dark:text-amber-200">
                    <div className="text-center">
                      <div className="font-bold text-lg">{wandComponents.woods?.length || 0}</div>
                      <div>Druhů dřev</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{wandComponents.cores?.length || 0}</div>
                      <div>Typů jader</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{wandComponents.lengths?.length || 0}</div>
                      <div>Délek hůlek</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{wandComponents.flexibilities?.length || 0}</div>
                      <div>Stupňů ohebnosti</div>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 text-center">
                    Celkem možných kombinací: <strong>
                      {(wandComponents.woods?.length || 0) * 
                       (wandComponents.cores?.length || 0) * 
                       (wandComponents.lengths?.length || 0) * 
                       (wandComponents.flexibilities?.length || 0)
                      }</strong> různých hůlek!
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
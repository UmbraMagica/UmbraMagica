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
import type { Wand } from "@shared/schema";

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
    queryKey: ['/api/auth/user']
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
      
      // If no saved character, use first alive character
      const firstAliveCharacter = userCharacters.find((char: any) => !char.deathDate);
      if (firstAliveCharacter && !selectedCharacter) {
        setSelectedCharacter(firstAliveCharacter);
      }
    }
  }, [userCharacters]);

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

  // Get wand components for manual selection
  const { data: wandComponents } = useQuery<{
    woods: Array<{ name: string; shortDescription: string; availableForRandom?: boolean }>;
    cores: Array<{ name: string; shortDescription: string; availableForRandom?: boolean }>;
    lengths: Array<{ name: string; shortDescription: string; availableForRandom?: boolean }>;
    flexibilities: Array<{ name: string; shortDescription: string; availableForRandom?: boolean }>;
  }>({
    queryKey: ['/api/wand-components']
  });

  // Visit Ollivanders mutation (random wand)
  const visitOllivandersMutation = useMutation({
    mutationFn: async () => {
      if (!mainCharacter?.id) throw new Error("No character selected");
      
      const response = await fetch(`/api/characters/${mainCharacter.id}/visit-ollivanders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to visit Ollivanders');
      }
      
      return response.json();
    },
    onSuccess: (newWand: Wand) => {
      toast({
        title: "Gratulujeme!",
        description: `${mainCharacter?.firstName} získal novou hůlku od pana Ollivandera!`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${mainCharacter?.id}/wand`] });
    },
    onError: (error: Error) => {
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
      
      const response = await fetch(`/api/characters/${mainCharacter.id}/create-custom-wand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customWand)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create custom wand');
      }
      
      return response.json();
    },
    onSuccess: (newWand: Wand) => {
      toast({
        title: "Hůlka vytvořena!",
        description: `${mainCharacter?.firstName} si pečlivě vybral svou jedinečnou hůlku!`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${mainCharacter?.id}/wand`] });
      // Reset form
      setCustomWand({
        wood: "",
        core: "",
        length: "",
        flexibility: "",
        description: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive"
      });
    }
  });

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
        
        {/* Character Info - shows currently selected character from main navbar */}
        {mainCharacter && (
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
                                  <div className="text-xs text-muted-foreground whitespace-normal break-words">{core.shortDescription}</div>
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
                                  {typeof length === 'object' && length.shortDescription && (
                                    <div className="text-xs text-muted-foreground whitespace-normal break-words">{length.shortDescription}</div>
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
                                  {typeof flexibility === 'object' && flexibility.shortDescription && (
                                    <div className="text-xs text-muted-foreground whitespace-normal break-words">{flexibility.shortDescription}</div>
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Woods */}
              <div>
                <h4 className="font-medium mb-2 text-amber-600 dark:text-amber-400">🌳 Hůlková dřeva (38 druhů)</h4>
                <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                  <p><strong>Akácie:</strong> Vzácná a temperamentní hůlka pro neobyčejně nadané kouzelníky</p>
                  <p><strong>Anglický dub:</strong> Silná, věrná a intuitivní hůlka pro čaroděje s odvahou</p>
                  <p><strong>Borovice:</strong> Nezávislá a kreativní hůlka pro dobrodružné duše</p>
                  <p><strong>Buk:</strong> Hůlka pro ty s bohatými zkušenostmi a hlubokou moudrostí</p>
                  <p><strong>Cedr:</strong> Věrná hůlka s pronikavým úsudkem o charakteru</p>
                  <p><strong>Cesmína:</strong> Hůlka schopná překonat hněv a impulzivnost svého majitele</p>
                  <p><strong>Cypřiš:</strong> Vzácná hůlka spojená s noblesou a tragédií</p>
                  <p><strong>Černý bez:</strong> Neobvyklé dřevo plné energie s turbulentním osudem</p>
                  <p><strong>Černý ořech:</strong> Velmi vnímavé dřevo vyžadující čistého ducha</p>
                  <p><strong>Červený dub:</strong> Hůlka rychlých reakcí a bystré mysli</p>
                  <p><strong>Dřín:</strong> Zlomyslné a hravé dřevo se smyslem pro humor</p>
                  <p><strong>Eben:</strong> Temné a mocné dřevo pro silné individuality</p>
                  <p><strong>Habr:</strong> Věrná hůlka pro čaroděje s jedinou vášní</p>
                  <p><strong>Hloh:</strong> Silné a rozporuplné dřevo pro léčení i kletby</p>
                  <p><strong>Hrušeň:</strong> Zlatavé dřevo pro šlechetné a přívětivé duše</p>
                  <p><strong>Jabloň:</strong> Mocné dřevo vhodné pro ty s vysokými cíli</p>
                  <p><strong>Jasan:</strong> Hůlky pevně přilnou ke svému majiteli</p>
                  <p><strong>Javor:</strong> Vyhledávají dobrodruzi a cestovatelé</p>
                  <p><strong>Jedle:</strong> Odolné dřevo vyžadující cílevědomé majitele</p>
                  <p><strong>Jeřáb:</strong> Výborné pro ochranná kouzla a jasnou mysl</p>
                  <p><strong>Jilm:</strong> Preferuje kouzelníky s důstojností a obratností</p>
                  <p><strong>Kaštan:</strong> Mění charakter podle jádra, hodí se pro bylinkáře</p>
                  <p><strong>Lípa stříbřitá:</strong> Atraktivní dřevo oblíbené u jasnovidců</p>
                  <p><strong>Líska:</strong> Citlivá hůlka reagující na emoce majitele</p>
                  <p><strong>Modřín:</strong> Pevné a odolné dřevo pro odvážné a věrné</p>
                  <p><strong>Olše:</strong> Nepoddajné dřevo ideální pro nápomocné kouzelníky</p>
                  <p><strong>Osika:</strong> Bílé a jemné dřevo pro sebevědomé duely</p>
                  <p><strong>Sekvoj:</strong> Vzácné dřevo nepřinášející štěstí, ale mocné</p>
                  <p><strong>Smrk:</strong> Stabilní a spolehlivé dřevo pro věrné čaroděje</p>
                  <p><strong>Tis:</strong> Nejobtížněji spárovatelné, často zlé pověsti</p>
                  <p><strong>Topol černý:</strong> Pružné dřevo pro konzistentní kouzelníky</p>
                  <p><strong>Třešeň:</strong> Velmi vzácné dřevo s výjimečnými vlastnostmi</p>
                  <p><strong>Vinná réva:</strong> Hůlky skryté povahy s překvapivými schopnostmi</p>
                  <p><strong>Vrba:</strong> Neobyčejné léčivé schopnosti</p>
                  <p><strong>Wiggentree:</strong> Mocné ochranné vlastnosti</p>
                  <p><strong>Zimostráz:</strong> Výdrž a neústupnost v těžkých chvílích</p>
                  <p><strong>Žebrácká hůl:</strong> Stará magická tradice pokory</p>
                </div>
              </div>

              {/* Cores */}
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">🔥 Jádra hůlek (22 druhů)</h4>
                <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                  <div className="font-medium text-green-600 dark:text-green-400">Nejvznešenější jádra:</div>
                  <p><strong>🐉 Blána z dračího srdce:</strong> Silné a temperamentní jádro s velkou mocí</p>
                  <p><strong>🦄 Vlas z hřívy jednorožce:</strong> Nejvěrnější a nejstabilnější typ jádra</p>
                  <p><strong>🔥 Pero fénixe:</strong> Nejnáročnější, ale nejsilnější a nejvzácnější jádro</p>
                  
                  <div className="font-medium text-blue-600 dark:text-blue-400 mt-2">Tradičníjádra:</div>
                  <p><strong>🌙 Vlákno lunární můry:</strong> Spojené s nocní magií a intuicí</p>
                  <p><strong>🦅 Péro Thunderbirda:</strong> Amerikanské jádro pro silné bouřné kouzla</p>
                  <p><strong>🐍 Roh Rozpustilce:</strong> Americké jádro pro osobité čaroděje</p>
                  <p><strong>🌿 Vlákno Bowtrucklea:</strong> Spojené s ochranou stromů a lesa</p>
                  
                  <div className="font-medium text-purple-600 dark:text-purple-400 mt-2">Mořská jádra:</div>
                  <p><strong>🌊 Vlákno Kelpie:</strong> Vodní magické jádro s přizpůsobivou povahou</p>
                  <p><strong>🐚 Slupka mořské panny:</strong> Vzácné jádro spojené s hlubinami</p>
                  
                  <div className="font-medium text-orange-600 dark:text-orange-400 mt-2">Dračí jádra:</div>
                  <p><strong>🔥 Srdcová blána Hebridského draka:</strong> Temperamentní skotské jádro</p>
                  <p><strong>🐲 Srdcová blána Waleského draka:</strong> Silné britské dračí jádro</p>
                  <p><strong>⚡ Srdcová blána Rohatého draka:</strong> Maďarské jádro s bouřlivou povahou</p>
                  
                  <div className="font-medium text-gray-600 dark:text-gray-400 mt-2">Vzácná jádra:</div>
                  <p><strong>🦄 Chlupy z ocasu jednorožce:</strong> Alternativa k vlasu z hřívy</p>
                  <p><strong>🌟 Péro Jobertunkela:</strong> Neobvykle vzácné andělské jádro</p>
                  <p><strong>🕊️ Péro běloskvostného ptáka:</strong> Jádro čistoty a míru</p>
                  <p><strong>⚡ Kožené vlákno Thunderbirda:</strong> Silnější varianta Thunderbird péra</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
              {/* Lengths */}
              <div>
                <h4 className="font-medium mb-2 text-purple-600 dark:text-purple-400">📏 Délky hůlek (10 velikostí)</h4>
                <div className="text-xs space-y-1">
                  <p><strong>7":</strong> Krátká, vhodná pro precizní, rychlé kouzlení. Často u velmi mladých čarodějů</p>
                  <p><strong>8":</strong> Lehce podprůměrná, oblíbená u diskrétních, taktických kouzelníků</p>
                  <p><strong>9":</strong> Neutrální délka, snadno ovladatelná – vhodná pro většinu uživatelů</p>
                  <p><strong>10":</strong> Běžná délka. Vyvážená hůlka pro různorodé účely</p>
                  <p><strong>11":</strong> Mírně delší, ideální pro čaroděje se silným charakterem nebo rozsáhlou magickou silou</p>
                  <p><strong>12":</strong> Výrazná hůlka, častá u mágů s dominantní povahou nebo hlubokým nitrem</p>
                  <p><strong>13":</strong> Pro ty, kteří mají neobyčejný potenciál nebo extrémní specializaci</p>
                  <p><strong>14":</strong> Dlouhá hůlka, vhodná pro formální, velkolepou nebo rituální magii</p>
                  <p><strong>15":</strong> Rarita – vyžaduje silné zaměření, ale odmění velkým dosahem a účinkem</p>
                  <p><strong>16+":</strong> Neobvyklá až výstřední délka. Obvykle jen u obrů, divotvůrců nebo výjimečných osobností</p>
                </div>
              </div>

              {/* Flexibilities */}
              <div>
                <h4 className="font-medium mb-2 text-indigo-600 dark:text-indigo-400">🌊 Ohebnost (11 stupňů)</h4>
                <div className="text-xs space-y-1">
                  <p><strong>Nezlomná:</strong> Extrémně pevná pro silnou vůli a nekompromisní povahu</p>
                  <p><strong>Velmi nepoddajná:</strong> Tvrdá hůlka pro rozhodné majitele a přímočaré kouzla</p>
                  <p><strong>Nepoddajná:</strong> Pevná hůlka pro stabilní a spolehlivé čaroděje</p>
                  <p><strong>Tvrdá:</strong> Poměrně pevná s dobrou odezvou pro tradiční magii</p>
                  <p><strong>Mírně nepoddajná:</strong> Lehce tužší pro dobrou kontrolu a metodické čaroděje</p>
                  <p><strong>Pevná:</strong> Vyvážená ohebnost s univerzální stabilitou i flexibilitou</p>
                  <p><strong>Ohebná:</strong> Flexibilní a přizpůsobivá pro kreativní čaroděje</p>
                  <p><strong>Pružná:</strong> Velmi ohebná podporující inovativní a experimentální kouzla</p>
                  <p><strong>Velmi pružná:</strong> Extrémně flexibilní pro proměnlivé povahy a improvisaci</p>
                  <p><strong>Výjimečně poddajná:</strong> Mimořádně ohebná reagující na nejjemnější pohyby</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">📊 Celkové statistiky:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-amber-800 dark:text-amber-200">
                <div className="text-center">
                  <div className="font-bold text-lg">38</div>
                  <div>Druhů dřev</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">22</div>
                  <div>Typů jader</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">10</div>
                  <div>Délek hůlek</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg">11</div>
                  <div>Stupňů ohebnosti</div>
                </div>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 text-center">
                Celkem možných kombinací: <strong>92,016</strong> různých hůlek!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
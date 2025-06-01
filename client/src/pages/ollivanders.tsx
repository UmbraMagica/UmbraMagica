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
        return query.queryKey[0]?.toString().includes('/api/characters/') && 
               query.queryKey[0]?.toString().includes('/wand');
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
  const { data: wandComponents } = useQuery({
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
                  <p>• <strong>Štítek "Ruční pouze":</strong> Tyto komponenty nejsou dostupné v náhodném výběru</p>
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
                            {wandComponents.woods?.map((wood: any) => (
                              <SelectItem key={wood.name} value={wood.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{wood.name}</span>
                                    {wood.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Ruční pouze</span>
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
                            {wandComponents.cores?.map((core: any) => (
                              <SelectItem key={core.name} value={core.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{core.name}</span>
                                    {core.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Ruční pouze</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-normal break-words">
                                    <span className="font-medium">{core.category}</span>
                                    <br />
                                    {core.description}
                                  </div>
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
                            {wandComponents.lengths?.map((length: any) => (
                              <SelectItem key={typeof length === 'string' ? length : length.name} value={typeof length === 'string' ? length : length.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{typeof length === 'string' ? length : length.name}</span>
                                    {typeof length === 'object' && length.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Ruční pouze</span>
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
                            {wandComponents.flexibilities?.map((flexibility: any) => (
                              <SelectItem key={typeof flexibility === 'string' ? flexibility : flexibility.name} value={typeof flexibility === 'string' ? flexibility : flexibility.name}>
                                <div className="w-full max-w-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{typeof flexibility === 'string' ? flexibility : flexibility.name}</span>
                                    {typeof flexibility === 'object' && flexibility.availableForRandom === false && (
                                      <span className="text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">Ruční pouze</span>
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Woods */}
              <div>
                <h4 className="font-medium mb-2 text-amber-600 dark:text-amber-400">🌳 Hůlková dřeva (38 druhů)</h4>
                <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                  <p><strong>Akácie:</strong> Velmi neobvyklé, lstivé a škodolibé</p>
                  <p><strong>Anglický dub:</strong> Síla a vytrvalost, oblíbené u aurorů</p>
                  <p><strong>Borovice:</strong> Nezávislost a originalita</p>
                  <p><strong>Bříza:</strong> Poslušnost vůči moudrému majiteli</p>
                  <p><strong>Buk:</strong> Moudrost a porozumění pro učence</p>
                  <p><strong>Cedr:</strong> Věrnost a ochrana, stabilní</p>
                  <p><strong>Cesmína:</strong> Ochrana proti temné magii</p>
                  <p><strong>Cypřiš:</strong> Spojení s nebezpečím a smrtí</p>
                  <p><strong>Černý bez:</strong> Nejšťastnější s necromancií</p>
                  <p><strong>Ebenovník:</strong> Černá magie a síla temnoty</p>
                  <p><strong>Fíkovník:</strong> Úrodnost a pohostinnost</p>
                  <p><strong>Habr:</strong> Tvrdé jako kámen, nepoddajné</p>
                  <p><strong>Hloh:</strong> Komplexní a protichůdná povaha</p>
                  <p><strong>Hruška:</strong> Láska a něžnost</p>
                  <p><strong>Jasan:</strong> Tvrdohlavé a přilnavé ke svému majiteli</p>
                  <p><strong>Javor:</strong> Ambiciózní a dobrodružné</p>
                  <p><strong>Jedlovec:</strong> Průvodce duchovní cesty</p>
                  <p><strong>Jilm:</strong> Důstojnost a magická elegance</p>
                  <p><strong>Jírovec:</strong> Léčivé vlastnosti a ochrana</p>
                  <p><strong>Kaštanovník:</strong> Spravedlnost a čestnost</p>
                  <p><strong>Lípa:</strong> Hledané divákožrouty a léčiteli</p>
                  <p><strong>Mahagon:</strong> Transfigurace a transformace</p>
                  <p><strong>Modřín:</strong> Odvaha a sebedůvěra</p>
                  <p><strong>Ořech:</strong> Skvělé pro transfiguraci</p>
                  <p><strong>Ořešák:</strong> Intelekt a rozum</p>
                  <p><strong>Osika:</strong> Překonávání strachu</p>
                  <p><strong>Palma:</strong> Vítězství a triumf</p>
                  <p><strong>Platan:</strong> Moudrost a vytrvalost</p>
                  <p><strong>Rohožník:</strong> Spojení s magickou přírodou</p>
                  <p><strong>Růže:</strong> Velmi vzácné kouzelnické dřevo</p>
                  <p><strong>Smrk:</strong> Věčnost a stálost</p>
                  <p><strong>Švestka:</strong> Zdraví a obnova</p>
                  <p><strong>Tis:</strong> Síla nad životem a smrtí</p>
                  <p><strong>Topol:</strong> Překonávání překážek</p>
                  <p><strong>Třešeň:</strong> Vzácné dřevo s výjimečnou silou</p>
                  <p><strong>Vrba:</strong> Intuice a emoce</p>
                  <p><strong>Wiggentree:</strong> Ochrana a léčení</p>
                  <p><strong>Zimostráz:</strong> Výdrž a neústupnost</p>
                </div>
              </div>

              {/* Cores */}
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">🔥 Jádra hůlek (23 druhů)</h4>
                <div className="text-xs space-y-1">
                  <div className="font-medium text-green-600 dark:text-green-400">Nejvznešenější:</div>
                  {wandComponents?.cores?.filter((core: any) => ['🐉 Blána z dračího srdce', '🦄 Vlas z hřívy jednorožce', '🔥 Pero fénixe'].includes(core.name)).map((core: any) => (
                    <p key={core.name}>
                      <strong>{core.name}:</strong> {core.description}
                      {core.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                  
                  <div className="font-medium text-blue-600 dark:text-blue-400 mt-2">Rostlinná jádra:</div>
                  {wandComponents?.cores?.filter((core: any) => core.category === 'Rostlinné').map((core: any) => (
                    <p key={core.name}>
                      <strong>{core.name}:</strong> {core.description}
                      {core.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                  
                  <div className="font-medium text-purple-600 dark:text-purple-400 mt-2">Tvorové:</div>
                  {wandComponents?.cores?.filter((core: any) => core.category === 'Tvorové').map((core: any) => (
                    <p key={core.name}>
                      <strong>{core.name}:</strong> {core.description}
                      {core.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                  
                  <div className="font-medium text-indigo-600 dark:text-indigo-400 mt-2">Elementární:</div>
                  {wandComponents?.cores?.filter((core: any) => core.category === 'Elementární').map((core: any) => (
                    <p key={core.name}>
                      <strong>{core.name}:</strong> {core.description}
                      {core.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                  
                  <div className="font-medium text-gray-600 dark:text-gray-400 mt-2">Méně ušlechtilé:</div>
                  {wandComponents?.cores?.filter((core: any) => core.category === 'Méně ušlechtilé').map((core: any) => (
                    <p key={core.name}>
                      <strong>{core.name}:</strong> {core.description}
                      {core.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
              {/* Lengths */}
              <div>
                <h4 className="font-medium mb-2 text-purple-600 dark:text-purple-400">📏 Délky hůlek (10 velikostí)</h4>
                <div className="text-xs grid grid-cols-2 gap-1">
                  {wandComponents?.lengths?.map((length: any) => (
                    <p key={length.name}>
                      <strong>{length.name}:</strong> {length.description.split('.')[0]}
                      {length.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>

              {/* Flexibilities */}
              <div>
                <h4 className="font-medium mb-2 text-indigo-600 dark:text-indigo-400">🌊 Ohebnost (11 stupňů)</h4>
                <div className="text-xs space-y-1">
                  {wandComponents?.flexibilities?.map((flexibility: any) => (
                    <p key={flexibility.name}>
                      <strong>{flexibility.name}:</strong> {flexibility.description.split('.')[0]}
                      {flexibility.availableForRandom === false && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium"> [Ruční pouze]</span>
                      )}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>💡 Tip:</strong> Pan Ollivander má v zásobě celkem <strong>38 druhů dřeva</strong>, <strong>16 typů jader</strong>, 
                <strong>9 délek</strong> a <strong>10 stupňů ohebnosti</strong> - to je přes <strong>54 000 možných kombinací</strong> hůlek! 
                Komponenty označené <span className="text-orange-600 dark:text-orange-400 font-medium">[Ruční pouze]</span> nejsou dostupné v náhodném výběru.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
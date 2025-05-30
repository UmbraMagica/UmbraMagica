import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, Sparkles, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Wand } from "@shared/schema";

export default function Ollivanders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showWandDetails, setShowWandDetails] = useState(false);

  // Get current user and main character
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user']
  });

  const { data: mainCharacter } = useQuery({
    queryKey: ['/api/characters/main']
  });

  // Get character's current wand
  const { data: characterWand, isLoading: wandLoading } = useQuery({
    queryKey: [`/api/characters/${mainCharacter?.id}/wand`],
    enabled: !!mainCharacter?.id
  });

  // Visit Ollivanders mutation
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

  const hasWand = characterWand && !wandLoading;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
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
                Zkuste několik hůlek a on vám vybere tu, která si vás zvolí.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Bez hůlky nemůžete sesílat kouzla v chatech!
                </p>
              </div>

              <Button
                onClick={() => visitOllivandersMutation.mutate()}
                disabled={visitOllivandersMutation.isPending}
                size="lg"
                className="w-full"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                {visitOllivandersMutation.isPending ? "Vybírám hůlku..." : "Navštívit pana Ollivandera"}
              </Button>
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
            <div>
              <h4 className="font-medium mb-2">Jádra hůlek:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>🐉 Blána z dračího srdce:</strong> Nejsilnější jádro, ideální pro bojová kouzla</p>
                <p><strong>🦄 Vlas z hřívy jednorožce:</strong> Nejvěrnější jádro, vhodné pro léčivá kouzla</p>
                <p><strong>🔥 Pero fénixe:</strong> Nejrřídší jádro, schopné největších kouzel</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Délky hůlek:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><strong>7"-9":</strong> Krátké, precizní hůlky</p>
                <p><strong>10"-12":</strong> Běžné, vyvážené hůlky</p>
                <p><strong>13"-15":</strong> Dlouhé, mocné hůlky</p>
                <p><strong>16"+:</strong> Výjimečně dlouhé hůlky</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Ohebnost:</h4>
              <p className="text-sm text-muted-foreground">
                Od nezlomných až po vrbovité - každá ohebnost odpovídá charakteru čaroděje.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
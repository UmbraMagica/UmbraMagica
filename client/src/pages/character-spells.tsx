import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Book, Plus, Trash2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function CharacterSpells() {
  const [, params] = useRoute("/characters/:id/spells");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSpellId, setSelectedSpellId] = useState<string>("");

  const characterId = params?.id ? parseInt(params.id) : null;

  // Get character info
  const { data: character } = useQuery({
    queryKey: [`/api/characters/${characterId}`],
    enabled: !!characterId
  });

  // Get character's spells
  const { data: characterSpells = [], isLoading: spellsLoading } = useQuery({
    queryKey: [`/api/characters/${characterId}/spells`],
    enabled: !!characterId
  });

  // Get all available spells
  const { data: allSpells = [] } = useQuery({
    queryKey: ["/api/spells"]
  });

  // Add spell to character
  const addSpellMutation = useMutation({
    mutationFn: async (spellId: number) => {
      const response = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/characters/${characterId}/spells`, { spellId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Kouzlo bylo přidáno postavě"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/spells`] });
      setSelectedSpellId("");
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat kouzlo",
        variant: "destructive"
      });
    }
  });

  // Remove spell from character
  const removeSpellMutation = useMutation({
    mutationFn: async (spellId: number) => {
      const response = await apiRequest("DELETE", `${import.meta.env.VITE_API_URL}/api/characters/${characterId}/spells/${spellId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Kouzlo bylo odebráno postavě"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/spells`] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odebrat kouzlo",
        variant: "destructive"
      });
    }
  });

  const getSpellCategoryColor = (category: string) => {
    switch (category) {
      case 'Charms': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Transfiguration': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Curses': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Defensive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Healing': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'Offensive': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSpellTypeColor = (type: string) => {
    switch (type) {
      case 'Basic': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'Advanced': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Master': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get spells that character doesn't have yet
  const availableSpells = allSpells.filter((spell: any) => 
    !characterSpells.some((charSpell: any) => charSpell.spell.id === spell.id)
  );

  if (!characterId) {
    return <div>Neplatné ID postavy</div>;
  }

  if (spellsLoading) {
    return <div>Načítání kouzel...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět do administrace
        </Button>
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5" />
          <h1 className="text-2xl font-bold">
            Kouzla postavy {character?.firstName} {character?.lastName}
          </h1>
        </div>
      </div>

      {/* Add new spell */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Přidat kouzlo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={selectedSpellId} onValueChange={setSelectedSpellId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Vyberte kouzlo k přidání..." />
              </SelectTrigger>
              <SelectContent>
                {availableSpells.map((spell: any) => (
                  <SelectItem key={spell.id} value={spell.id.toString()}>
                    <div className="flex flex-col">
                      <span>{spell.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {spell.category} - {spell.type} - {spell.target}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedSpellId && addSpellMutation.mutate(parseInt(selectedSpellId))}
              disabled={!selectedSpellId || addSpellMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Přidat
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Character's spells */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Kouzla postavy ({characterSpells.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {characterSpells.length > 0 ? (
            <div className="grid gap-4">
              {characterSpells.map((charSpell: any) => (
                <div key={charSpell.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{charSpell.spell.name}</h3>
                      <Badge className={getSpellCategoryColor(charSpell.spell.category)}>
                        {charSpell.spell.category}
                      </Badge>
                      <Badge className={getSpellTypeColor(charSpell.spell.type)}>
                        {charSpell.spell.type}
                      </Badge>
                      <Badge variant="outline">
                        {charSpell.spell.target}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      {charSpell.spell.effect}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Přidáno: {new Date(charSpell.addedAt).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSpellMutation.mutate(charSpell.spell.id)}
                    disabled={removeSpellMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Postava nemá přiřazena žádná kouzla</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
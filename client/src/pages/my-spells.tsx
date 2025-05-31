import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Book, Wand2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function MySpells() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Get user's characters
  const { data: userCharacters = [] } = useQuery({
    queryKey: ["/api/characters"]
  });

  // Use first alive character
  const firstAliveCharacter = userCharacters.find((char: any) => !char.deathDate);

  // Get character's spells
  const { data: characterSpells = [], isLoading } = useQuery({
    queryKey: [`/api/characters/${firstAliveCharacter?.id}/spells`],
    enabled: !!firstAliveCharacter?.id
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

  // Group spells by category
  const spellsByCategory = characterSpells.reduce((acc: any, charSpell: any) => {
    const category = charSpell.spell.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(charSpell.spell);
    return acc;
  }, {});

  const categories = Object.keys(spellsByCategory).sort();

  if (!user) {
    return <div>Přihlaste se prosím</div>;
  }

  if (!firstAliveCharacter) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nemáte vytvořenou žádnou postavu</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání kouzel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/characters/${firstAliveCharacter.id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na profil
        </Button>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          <h1 className="text-2xl font-bold">
            Moje kouzla - {firstAliveCharacter.firstName} {firstAliveCharacter.lastName}
          </h1>
        </div>
      </div>

      {characterSpells.length > 0 ? (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Badge className={getSpellCategoryColor(category)}>
                    {category}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    ({spellsByCategory[category].length} {spellsByCategory[category].length === 1 ? 'kouzlo' : spellsByCategory[category].length < 5 ? 'kouzla' : 'kouzel'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {spellsByCategory[category].map((spell: any) => (
                    <div key={spell.id} className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2 text-foreground">{spell.name}</h3>
                      <p className="text-sm text-muted-foreground italic">
                        {spell.effect}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {firstAliveCharacter.firstName} zatím nemá přiřazena žádná kouzla
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Kontaktujte administrátora pro přidání kouzel
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
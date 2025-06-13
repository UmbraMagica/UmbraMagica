import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, User, Calendar } from "lucide-react";
import { useLocation, useParams } from "wouter";

interface CharacterSpell {
  id: number;
  characterId: number;
  spellName: string;
  learnedAt: string;
  proficiencyLevel: string;
  notes?: string;
}

interface Character {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  school?: string;
  avatar?: string;
}

export default function AdminCharacterSpells() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  
  // Get character ID from URL params
  const characterId = parseInt(params.characterId || '0');
  
  const { data: character } = useQuery<Character>({
    queryKey: ['/api/characters', characterId],
    enabled: !!characterId,
  });

  const { data: spells = [] } = useQuery<CharacterSpell[]>({
    queryKey: ['/api/characters', characterId, 'spells'],
    enabled: !!characterId,
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Přístup odepřen</h1>
          <p className="text-muted-foreground">Nemáte oprávnění k přístupu na tuto stránku.</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Postava nenalezena</h1>
          <p className="text-muted-foreground">Požadovaná postava neexistuje.</p>
        </div>
      </div>
    );
  }

  const getFullName = () => {
    return `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`;
  };

  const getProficiencyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'začátečník': return 'bg-gray-500/20 text-gray-400';
      case 'pokročilý': return 'bg-blue-500/20 text-blue-400';
      case 'expert': return 'bg-green-500/20 text-green-400';
      case 'mistr': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation */}
      <nav className="bg-card border-b border-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/admin')}
                className="text-muted-foreground hover:text-accent mr-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět do administrace
              </Button>
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-accent mr-3" />
                <span className="text-xl font-bold text-accent">Kouzel postavy</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Character Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <User className="mr-3 h-6 w-6 text-accent" />
              {getFullName()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              {character.avatar ? (
                <img 
                  src={character.avatar} 
                  alt={`Avatar ${character.firstName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {character.firstName.charAt(0)}{character.lastName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-lg font-medium text-foreground mb-1">{getFullName()}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {new Date(character.birthDate).toLocaleDateString('cs-CZ')}
                  </span>
                  {character.school && (
                    <span>{character.school}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spells List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-3 h-5 w-5 text-accent" />
              Naučená kouzel ({spells.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {spells.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Tato postava zatím neovládá žádná kouzel.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {spells.map((spell) => (
                  <div key={spell.id} className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-foreground">{spell.spellName}</h3>
                      <Badge className={getProficiencyColor(spell.proficiencyLevel)}>
                        {spell.proficiencyLevel}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Naučeno: {new Date(spell.learnedAt).toLocaleDateString('cs-CZ')}
                    </div>
                    {spell.notes && (
                      <div className="text-sm text-muted-foreground italic">
                        Poznámky: {spell.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
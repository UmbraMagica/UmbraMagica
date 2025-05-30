import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Crown } from "lucide-react";

interface DeadCharacter {
  id: number;
  userId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  school?: string;
  description?: string;
  deathDate: string;
  deathReason: string;
  isMainCharacter: boolean;
  createdAt: string;
}

export default function Cemetery() {
  const { user } = useAuth();

  const { data: deadCharacters = [], isLoading } = useQuery<DeadCharacter[]>({
    queryKey: ["/api/cemetery"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const calculateAge = (birthDate: string, deathDate: string) => {
    const birth = new Date(birthDate);
    const death = new Date(deathDate);
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getFullName = (character: DeadCharacter) => {
    const parts = [character.firstName];
    if (character.middleName) {
      parts.push(character.middleName);
    }
    parts.push(character.lastName);
    return parts.join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/home" className="text-purple-300 hover:text-white transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🪦 Hřbitov
            </h1>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-xl text-purple-300">Načítání hřbitova...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/home" className="text-purple-300 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🪦 Hřbitov
          </h1>
        </div>

        {deadCharacters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-purple-300 mb-4">Zatím zde nikdo nespoč��vá.</div>
            <div className="text-purple-400">Všechny postavy jsou stále naživu.</div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deadCharacters.map((character) => (
              <Card key={character.id} className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-white">{getFullName(character)}</span>
                    {character.isMainCharacter && (
                      <Crown className="h-4 w-4 text-yellow-400" title="Primární postava" />
                    )}
                  </CardTitle>
                  <div className="text-sm text-purple-300">
                    {formatDate(character.birthDate)} - {formatDate(character.deathDate)}
                  </div>
                  <div className="text-xs text-purple-400">
                    Věk při smrti: {calculateAge(character.birthDate, character.deathDate)} let
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {character.school && (
                    <Badge variant="outline" className="text-purple-300 border-purple-500">
                      {character.school}
                    </Badge>
                  )}
                  
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-red-500/20">
                    <div className="text-xs text-red-300 font-medium mb-1">Příčina smrti:</div>
                    <div className="text-sm text-red-200">{character.deathReason}</div>
                  </div>

                  {character.description && (
                    <div className="text-sm text-purple-200 bg-slate-900/30 p-3 rounded-lg">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: character.description.replace(/\n/g, '<br>') 
                        }} 
                      />
                    </div>
                  )}
                  
                  <div className="text-xs text-purple-400">
                    Postava vytvořena: {formatDate(character.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
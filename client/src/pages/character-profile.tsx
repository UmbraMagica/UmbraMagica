import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Mail, Clock, Edit3, GraduationCap, FileText, Package, BookOpen, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { calculateGameAge } from "@/lib/gameDate";
import { CharacterAvatar } from "@/components/CharacterAvatar";

interface Character {
  id: number;
  userId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  birthDate: string;
  isActive: boolean;
  school?: string;
  description?: string;
  avatar?: string | null;
  user: {
    username: string;
    email: string;
  };
}

export default function CharacterProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: character, isLoading, error } = useQuery<Character>({
    queryKey: [`/api/characters/${id}`],
    enabled: !!id,
  });



  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na hlavní stránku
          </Button>
        </div>
        <div className="text-center">Načítání profilu postavy...</div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na hlavní stránku
          </Button>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Postava nenalezena</h3>
          <p className="text-muted-foreground">
            Požadovaná postava neexistuje nebo není dostupná.
          </p>
        </div>
      </div>
    );
  }

  const getCharacterInitials = (character: Character) => {
    if (!character.firstName || !character.lastName) return "??";
    return `${character.firstName.charAt(0)}${character.lastName.charAt(0)}`;
  };

  const getFullName = (character: Character) => {
    if (!character?.firstName || !character?.lastName) return "Neznámá postava";
    return `${character.firstName}${character.middleName ? ` ${character.middleName}` : ''} ${character.lastName}`;
  };

  // Only character owner can edit through profile page, admins use admin interface
  const canEdit = user && user.id === character.userId;

  const characterAge = calculateGameAge(character.birthDate);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na hlavní stránku
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <CharacterAvatar character={character} size="lg" className="h-20 w-20" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {getFullName(character)}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={character.isActive ? "default" : "secondary"}>
                          {character.isActive ? "Aktivní postava" : "Neaktivní postava"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Hraje: @{character.user?.username || 'Neznámý uživatel'}
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/character/edit?characterId=${character.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Upravit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Základní informace</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Celé jméno</div>
                        <div className="text-sm text-muted-foreground">
                          {getFullName(character)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Datum narození a věk</div>
                        <div className="text-sm text-muted-foreground">
                          {character.birthDate ? 
                            (() => {
                              try {
                                const date = new Date(character.birthDate);
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear();
                                return `${day}.${month}.${year} (${calculateGameAge(character.birthDate)} let)`;
                              } catch {
                                return `${character.birthDate} (${calculateGameAge(character.birthDate)} let)`;
                              }
                            })()
                            : 'Nezadáno'
                          }
                        </div>
                      </div>
                    </div>
                    {(character.height || character.weight) && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Fyzické vlastnosti</div>
                          <div className="text-sm text-muted-foreground">
                            {character.height && character.weight 
                              ? `${character.height} cm, ${character.weight} kg`
                              : character.height 
                                ? `${character.height} cm`
                                : `${character.weight} kg`
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>



                {character.school && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-3">Škola</h3>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          {character.school}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {character.description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-3">Popis postavy</h3>
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div 
                          className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: character.description }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Osobní archiv</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setLocation(`/characters/${character.id}/inventory`)}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Inventář postavy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setLocation(`/characters/${character.id}/journal`)}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Deník postavy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setLocation('/my-spells')}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Moje kouzla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
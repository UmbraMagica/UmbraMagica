import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Mail, Clock, Edit3, GraduationCap, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { calculateGameAge } from "@/lib/gameDate";

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
    queryKey: ["/api/characters", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/characters')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na seznam postav
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
            onClick={() => setLocation('/characters')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na seznam postav
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
    if (!character.firstName || !character.lastName) return "Neznámá postava";
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
          onClick={() => setLocation('/characters')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na seznam postav
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-medium">
                    {getCharacterInitials(character)}
                  </AvatarFallback>
                </Avatar>
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
                        onClick={() => setLocation('/character/edit')}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Jméno</div>
                        <div className="text-sm text-muted-foreground">
                          {character.firstName}
                        </div>
                      </div>
                    </div>
                    {character.middleName && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Prostřední jméno</div>
                          <div className="text-sm text-muted-foreground">
                            {character.middleName}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Příjmení</div>
                        <div className="text-sm text-muted-foreground">
                          {character.lastName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Věk</div>
                        <div className="text-sm text-muted-foreground">
                          {calculateGameAge(character.birthDate)} let
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3">Datum narození</h3>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      {character.birthDate ? 
                        (() => {
                          try {
                            return format(new Date(character.birthDate), 'd. MMMM yyyy', { locale: cs });
                          } catch {
                            return character.birthDate;
                          }
                        })()
                        : 'Nezadáno'
                      }
                    </div>
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
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {character.description}
                        </div>
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
              <CardTitle className="text-lg">Kontakt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Hráč</div>
                    <div className="text-sm text-muted-foreground">
                      {character.user?.username || 'Neznámý uživatel'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">
                      {character.user?.email || 'Nezadán email'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rychlé akce</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setLocation('/chat')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Přejít do chatu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setLocation('/characters')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Seznam všech postav
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
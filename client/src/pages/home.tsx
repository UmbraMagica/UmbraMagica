import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Crown, 
  Home as HomeIcon, 
  MessageCircle, 
  User, 
  LogOut, 
  Zap, 
  History, 
  Users, 
  Circle,
  Settings,
  Wand2
} from "lucide-react";
import { GameDate } from "@/components/GameDate";
import { calculateGameAge } from "@/lib/gameDate";
import { CharacterAvatar } from "@/components/CharacterAvatar";

interface OnlineCharacter {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  location: string;
  avatar?: string | null;
}

export default function Home() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [displayedCharacter, setDisplayedCharacter] = useState<any>(null);

  const { data: onlineCharacters = [] } = useQuery<OnlineCharacter[]>({
    queryKey: ["/api/characters/online"],
    staleTime: 30000,
  });

  const { data: userCharacters = [] } = useQuery({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  const { data: mainCharacter } = useQuery({
    queryKey: ["/api/characters/main"],
    enabled: !!user,
  });

  const currentDisplayedCharacter = displayedCharacter || mainCharacter;
  const characterAge = currentDisplayedCharacter ? calculateGameAge(currentDisplayedCharacter.birthDate) : 0;

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odhlásit",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold text-accent">RPG Realm</div>
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => setLocation('/')}>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Domov
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">{user?.username}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl fantasy-font font-bold text-accent mb-4">
            Vítejte zpět, {user?.username}!
          </h1>
          <p className="text-lg text-muted-foreground">Připravte se na další dobrodružství ve světě RPG Realm</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <GameDate />
            
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Zap className="text-accent mr-3 h-5 w-5" />
                  Rychlé akce
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    variant="default"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-primary-foreground p-4 h-auto rounded-lg transition-all duration-200 transform hover:scale-105 text-left justify-start"
                    onClick={() => setLocation('/chat')}
                  >
                    <div>
                      <MessageCircle className="h-6 w-6 mb-2" />
                      <div className="font-medium">Vstoupit do chatu</div>
                      <div className="text-sm opacity-80">Pokračujte v příběhu</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 p-4 h-auto rounded-lg transition-all duration-200 transform hover:scale-105 text-left justify-start"
                    onClick={() => setLocation('/ollivanders')}
                  >
                    <div>
                      <Wand2 className="h-6 w-6 mb-2" />
                      <div className="font-medium">U Ollivandera</div>
                      <div className="text-sm opacity-80">Získejte hůlku</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {currentDisplayedCharacter && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <User className="text-accent mr-3 h-5 w-5" />
                    Moje postava
                  </h3>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex justify-center">
                      <CharacterAvatar character={currentDisplayedCharacter} size="lg" />
                    </div>
                    <h4 className="font-medium text-foreground">
                      {currentDisplayedCharacter.firstName}
                      {currentDisplayedCharacter.middleName && ` ${currentDisplayedCharacter.middleName}`}
                      {` ${currentDisplayedCharacter.lastName}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">{characterAge} let</p>
                    <div className="mt-3 space-y-2">
                      <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                        <Circle className="h-3 w-3 mr-1 fill-current" />
                        Online
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {userCharacters.length > 1 && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <Users className="text-accent mr-3 h-5 w-5" />
                    Moje postavy
                  </h3>
                  <div className="space-y-2">
                    {userCharacters
                      .sort((a: any, b: any) => {
                        if (mainCharacter?.id === a.id) return -1;
                        if (mainCharacter?.id === b.id) return 1;
                        return a.firstName.localeCompare(b.firstName, 'cs');
                      })
                      .map((character: any) => (
                      <div 
                        key={character.id} 
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          (displayedCharacter?.id === character.id || (!displayedCharacter && mainCharacter?.id === character.id))
                            ? 'bg-accent/20 border border-accent/30' 
                            : 'bg-muted/30'
                        }`}
                        onClick={() => {
                          setDisplayedCharacter(character);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <CharacterAvatar character={character} size="sm" />
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {character.firstName} {character.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {calculateGameAge(character.birthDate)} let
                            </p>
                          </div>
                        </div>
                        {mainCharacter?.id === character.id && (
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">👑</span>
                            <Badge className="bg-accent/20 text-accent text-xs">
                              Primární
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setLocation('/settings')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Spravovat postavy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Users className="text-accent mr-3 h-5 w-5" />
                  Postavy online
                  <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary">
                    {onlineCharacters.length}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {onlineCharacters.map((character) => (
                    <div key={character.id} className="flex items-center space-x-3">
                      <CharacterAvatar character={character} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{character.fullName}</p>
                        <p className="text-xs text-muted-foreground">v {character.location}</p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))}
                  {onlineCharacters.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Žádné postavy nejsou online
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Cemetery access at the bottom */}
        <div className="mt-8 pt-4 border-t border-border text-center">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setLocation('/cemetery')}>
            <div className="text-lg mr-2">🪦</div>
            <span className="text-sm">Hřbitov</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
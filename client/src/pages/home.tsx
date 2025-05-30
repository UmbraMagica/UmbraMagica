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
  Wand2,
  Sword,
  BookOpen,
  ScrollText,
  Globe,
  MessageSquare,
  BarChart3,
  Newspaper,
  Sparkles
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
    staleTime: 30000, // 30 seconds
  });

  // Fetch user's characters for switching
  const { data: userCharacters = [] } = useQuery<any[]>({
    queryKey: ["/api/characters"],
    enabled: !!user,
  });

  // Fetch main character
  const { data: mainCharacter } = useQuery<any>({
    queryKey: ["/api/characters/main"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
      toast({
        title: "Odhlášení",
        description: "Byli jste úspěšně odhlášeni",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odhlásit",
        variant: "destructive",
      });
    }
  };

  // Set main character mutation
  const setMainCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/set-main`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Aktivní postava změněna",
        description: "Vaše aktivní postava byla úspěšně změněna.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters/main"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit aktivní postavu",
        variant: "destructive",
      });
    },
  });

  // Use displayed character for UI, fallback to main character, then first available
  const currentDisplayedCharacter = displayedCharacter || mainCharacter || userCharacters[0];
  const characterAge = currentDisplayedCharacter ? 
    calculateGameAge(currentDisplayedCharacter.birthDate) : 0;





  // Game date calculation - year 1926, current day/month
  const currentDate = new Date();
  const gameDateString = `${currentDate.getDate()}. ${currentDate.toLocaleDateString('cs-CZ', { month: 'long' })} 1926`;

  const recentActivity = [
    { text: `Aktualizována postava`, time: "včera", type: "info" },
    { text: "Přihlášení do systému", time: "před 2 hodinami", type: "success" },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                  <Crown className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl fantasy-font font-bold text-accent">RPG Realm</span>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Button variant="ghost" className="text-accent hover:text-secondary">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => setLocation('/chat')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Herní chaty
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => window.location.href = '/characters'}>
                  <Users className="mr-2 h-4 w-4" />
                  Seznam postav
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => {
                  if (currentDisplayedCharacter) {
                    window.location.href = `/characters/${currentDisplayedCharacter.id}`;
                  } else {
                    window.location.href = '/character/edit';
                  }
                }}>
                  <User className="mr-2 h-4 w-4" />
                  Moje postava
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => window.location.href = '/settings'}>
                  <Settings className="mr-2 h-4 w-4" />
                  Nastavení
                </Button>

                {user?.role === 'admin' && (
                  <Button variant="ghost" className="text-amber-400 hover:text-amber-300" onClick={() => window.location.href = '/admin'}>
                    <Crown className="mr-2 h-4 w-4" />
                    Administrace
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">{user?.username}</div>
              {user?.role === 'admin' && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </div>
              )}
              <Button variant="ghost" size="sm" className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground">
                <User className="h-4 w-4" />
              </Button>
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
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl fantasy-font font-bold text-accent mb-4">
            Vítejte zpět, {user?.username}!
          </h1>
          <p className="text-lg text-muted-foreground">Připravte se na další dobrodružství ve světě RPG Realm</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - RPG Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-300/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
                  <Sword className="mr-3 h-6 w-6" />
                  RPG Sekce
                </h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-purple-500/20"
                    onClick={() => setLocation('/chat')}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-purple-400" />
                      <div>
                        <div className="font-medium">Chat</div>
                        <div className="text-xs text-muted-foreground">Vstoupit do hry</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-purple-500/20"
                    onClick={() => setLocation('/ollivanders')}
                  >
                    <div className="flex items-center space-x-3">
                      <Wand2 className="h-5 w-5 text-amber-400" />
                      <div>
                        <div className="font-medium">U Ollivandera</div>
                        <div className="text-xs text-muted-foreground">Získat hůlku</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-purple-500/20"
                    onClick={() => setLocation('/characters')}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="font-medium">Postavy</div>
                        <div className="text-xs text-muted-foreground">Seznam všech postav</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-purple-500/20"
                    onClick={() => setLocation('/my-spells')}
                  >
                    <div className="flex items-center space-x-3">
                      <Sparkles className="h-5 w-5 text-pink-400" />
                      <div>
                        <div className="font-medium">Moje kouzla</div>
                        <div className="text-xs text-muted-foreground">Správa kouzel</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Characters in RPG Section */}
            {userCharacters.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <User className="text-accent mr-3 h-5 w-5" />
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
          </div>

          {/* Center Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Date */}
            <GameDate />

            {/* Current Character Profile */}
            {currentDisplayedCharacter && (
              <Card className="bg-gradient-to-r from-accent/10 to-secondary/10 border-accent/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                    <User className="text-accent mr-3 h-6 w-6" />
                    Aktivní postava
                  </h3>
                  <div className="flex items-center space-x-4">
                    <CharacterAvatar character={currentDisplayedCharacter} size="lg" />
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-foreground">
                        {currentDisplayedCharacter.firstName}
                        {currentDisplayedCharacter.middleName && ` ${currentDisplayedCharacter.middleName}`}
                        {` ${currentDisplayedCharacter.lastName}`}
                      </h4>
                      <p className="text-muted-foreground">{characterAge} let</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className="bg-green-500/20 text-green-400">
                          <Circle className="h-3 w-3 mr-1 fill-current" />
                          Online
                        </Badge>
                        {mainCharacter?.id === currentDisplayedCharacter.id && (
                          <Badge className="bg-accent/20 text-accent">
                            👑 Primární
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/characters/${currentDisplayedCharacter.id}`)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profil
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/character/edit?characterId=${currentDisplayedCharacter.id}`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Upravit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* News & Updates */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Newspaper className="text-accent mr-3 h-6 w-6" />
                  Novinky a aktualizace
                </h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-accent pl-4">
                    <h4 className="font-medium text-foreground">Nový kouzlo systém</h4>
                    <p className="text-sm text-muted-foreground">Byl přidán pokročilý systém sesílání kouzel s efekty úspěchu a neúspěchu.</p>
                    <p className="text-xs text-muted-foreground mt-1">Před 2 dny</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-foreground">Vylepšení Ollivandera</h4>
                    <p className="text-sm text-muted-foreground">Obchod s hůlkami nyní obsahuje detailní popisy všech komponent.</p>
                    <p className="text-xs text-muted-foreground mt-1">Před týdnem</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-foreground">Nové chatovací místnosti</h4>
                    <p className="text-sm text-muted-foreground">Přidány nové lokace pro hraní rolí ve světě čarodějů.</p>
                    <p className="text-xs text-muted-foreground mt-1">Před 2 týdny</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Zap className="text-accent mr-3 h-6 w-6" />
                  Rychlé akce
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="default"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-primary-foreground p-4 h-auto rounded-lg transition-all duration-200 transform hover:scale-105"
                    onClick={() => setLocation('/chat')}
                  >
                    <div className="text-center">
                      <MessageCircle className="h-8 w-8 mb-2 mx-auto" />
                      <div className="font-medium">Vstoupit do chatu</div>
                      <div className="text-sm opacity-80">Pokračovat v příběhu</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-300 p-4 h-auto rounded-lg transition-all duration-200 transform hover:scale-105"
                    onClick={() => setLocation('/ollivanders')}
                  >
                    <div className="text-center">
                      <Wand2 className="h-8 w-8 mb-2 mx-auto" />
                      <div className="font-medium">U Ollivandera</div>
                      <div className="text-sm opacity-80">Získat hůlku</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity - Only for admins */}
            {user?.role === 'admin' && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                    <History className="text-accent mr-3 h-6 w-6" />
                    Nedávná aktivita
                  </h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === "success" ? "bg-green-500" : "bg-accent"
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="link" className="text-accent hover:text-secondary text-sm">
                        Zobrazit vše
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Non-RPG Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-300/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
                  <BookOpen className="mr-3 h-6 w-6" />
                  Odkazy a zdroje
                </h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-green-500/20"
                    onClick={() => window.open('/pravidla', '_blank')}
                  >
                    <div className="flex items-center space-x-3">
                      <ScrollText className="h-5 w-5 text-green-400" />
                      <div>
                        <div className="font-medium">Pravidla</div>
                        <div className="text-xs text-muted-foreground">Herní pravidla</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-green-500/20"
                    onClick={() => window.open('/wiki', '_blank')}
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="font-medium">Wikipedie</div>
                        <div className="text-xs text-muted-foreground">Encyklopedie světa</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-green-500/20"
                    onClick={() => window.open('/forum', '_blank')}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                      <div>
                        <div className="font-medium">Fórum</div>
                        <div className="text-xs text-muted-foreground">Diskuze hráčů</div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-green-500/20"
                    onClick={() => setLocation('/settings')}
                  >
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Nastavení</div>
                        <div className="text-xs text-muted-foreground">Správa účtu</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Online Characters */}
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
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setLocation('/characters')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Všechny postavy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Server Statistics */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <BarChart3 className="text-accent mr-3 h-5 w-5" />
                  Statistiky serveru
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktivní postavy</span>
                    <span className="font-medium text-foreground">{userCharacters.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Online nyní</span>
                    <span className="font-medium text-green-400">{onlineCharacters.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Herní datum</span>
                    <span className="font-medium text-foreground text-xs">1926</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
            {/* Quick Actions */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <Zap className="text-accent mr-3 h-5 w-5" />
                  Rychlé akce
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="secondary" 
                    className="bg-muted hover:bg-primary text-foreground hover:text-primary-foreground p-4 h-auto rounded-lg transition-all duration-200 transform hover:scale-105 text-left justify-start"
                    onClick={() => currentDisplayedCharacter && (window.location.href = `/characters/${currentDisplayedCharacter.id}`)}
                  >
                    <div className="flex items-center">
                      <div className="mr-4">
                        {currentDisplayedCharacter ? (
                          <CharacterAvatar character={currentDisplayedCharacter} size="md" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            FB
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {currentDisplayedCharacter ? 
                            `${currentDisplayedCharacter.firstName} ${currentDisplayedCharacter.lastName}` : 
                            'Upravit postavu'
                          }
                        </div>
                        <div className="text-sm opacity-80">Aktualizujte profil</div>
                      </div>
                    </div>
                  </Button>
                  <Button 
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

            {/* Recent Activity - Only for admins */}
            {user?.role === 'admin' && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                    <History className="text-accent mr-3 h-5 w-5" />
                    Nedávná aktivita
                  </h2>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === "success" ? "bg-green-500" : "bg-accent"
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-2">
                      <Button variant="link" className="text-accent hover:text-secondary text-sm">
                        Zobrazit vše
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Game Date */}
            <GameDate />

            {/* My Character */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <User className="text-accent mr-3 h-5 w-5" />
                  Moje postava
                </h3>
                {currentDisplayedCharacter && (
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
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/characters/${currentDisplayedCharacter.id}`)}
                          className="text-xs"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Zobrazit profil
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/character/edit?characterId=${currentDisplayedCharacter.id}`)}
                          className="text-xs"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Upravit profil
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Character Overview */}
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
                        // Primary character first
                        if (mainCharacter?.id === a.id) return -1;
                        if (mainCharacter?.id === b.id) return 1;
                        
                        // Then sort alphabetically by first name
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

            {/* Online Characters */}
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
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setLocation('/characters')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Všechny postavy
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Server Statistics */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <BarChart3 className="text-accent mr-3 h-5 w-5" />
                  Statistiky serveru
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Aktivní postavy</span>
                    <span className="font-medium text-foreground">{userCharacters.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Online nyní</span>
                    <span className="font-medium text-green-400">{onlineCharacters.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Herní datum</span>
                    <span className="font-medium text-foreground text-xs">1926</span>
                  </div>
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

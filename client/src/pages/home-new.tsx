import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  DoorOpen,
  Settings,
  RectangleEllipsis,
  Wand2,
  Sword,
  BookOpen,
  ScrollText,
  Globe,
  MessageSquare,
  BarChart3,
  Newspaper,
  Sparkles,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


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

  const currentDisplayedCharacter = mainCharacter;
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

  const recentActivity = [
    { text: "Nový uživatel se zaregistroval", time: "Před 5 minutami", type: "success" },
    { text: "Přidána nová chatovací místnost", time: "Před hodinou", type: "info" },
    { text: "Aktualizovány herní mechaniky", time: "Před 3 hodinami", type: "info" },
  ];

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
              <div className="hidden lg:flex items-center space-x-2">
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => setLocation('/')}>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Domov
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => {
                  if (currentDisplayedCharacter) {
                    setLocation(`/characters/${currentDisplayedCharacter.id}`);
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
              <div className="hidden lg:flex items-center space-x-4">
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
              
              {/* Mobile menu button */}
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-foreground hover:text-accent"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card">
            <div className="px-4 py-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-foreground hover:text-accent" onClick={() => {setLocation('/'); setMobileMenuOpen(false);}}>
                <HomeIcon className="mr-2 h-4 w-4" />
                Domov
              </Button>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:text-accent" onClick={() => {
                if (currentDisplayedCharacter) {
                  setLocation(`/characters/${currentDisplayedCharacter.id}`);
                } else {
                  window.location.href = '/character/edit';
                }
                setMobileMenuOpen(false);
              }}>
                <User className="mr-2 h-4 w-4" />
                Moje postava
              </Button>
              <Button variant="ghost" className="w-full justify-start text-foreground hover:text-accent" onClick={() => {window.location.href = '/settings'; setMobileMenuOpen(false);}}>
                <Settings className="mr-2 h-4 w-4" />
                Nastavení
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" className="w-full justify-start text-amber-400 hover:text-amber-300" onClick={() => {window.location.href = '/admin'; setMobileMenuOpen(false);}}>
                  <Crown className="mr-2 h-4 w-4" />
                  Administrace
                </Button>
              )}
              <div className="border-t border-border pt-2">
                <div className="px-3 py-2 text-sm text-muted-foreground">{user?.username}</div>
                {user?.role === 'admin' && (
                  <div className="px-3 py-1">
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-400">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </div>
                  </div>
                )}
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={() => {handleLogout(); setMobileMenuOpen(false);}}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Odhlásit se
                </Button>
              </div>
            </div>
          </div>
        )}
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
            {userCharacters.filter((char: any) => !char.isSystem).length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                    <User className="text-accent mr-3 h-5 w-5" />
                    Moje postavy
                  </h3>
                  <div className="space-y-2">
                    {userCharacters
                      .filter((char: any) => !char.isSystem)
                      .sort((a: any, b: any) => {
                        if (mainCharacter?.id === a.id) return -1;
                        if (mainCharacter?.id === b.id) return 1;
                        return a.firstName.localeCompare(b.firstName, 'cs');
                      })
                      .map((character: any) => (
                      <div 
                        key={character.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
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
                    <span className="font-medium text-foreground">{userCharacters.filter((char: any) => !char.isSystem).length}</span>
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
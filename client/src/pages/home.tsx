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
  BookOpen,
  ScrollText,
  Globe,
  Newspaper
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
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Nastavení
                </Button>
                {user?.role === 'admin' && (
                  <Button variant="ghost" className="text-amber-400 hover:text-amber-300" onClick={() => setLocation('/admin')}>
                    <Crown className="mr-2 h-4 w-4" />
                    Administrace
                  </Button>
                )}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Navigation & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-300/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center">
                  <Zap className="mr-3 h-6 w-6" />
                  Rychlé akce
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
                        <div className="text-xs text-muted-foreground">Seznam postav</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pravidla a Wiki */}
            <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-300/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-green-300 mb-4 flex items-center">
                  <BookOpen className="mr-3 h-6 w-6" />
                  Pravidla a průvodci
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
                        <div className="font-medium">Herní pravidla</div>
                        <div className="text-xs text-muted-foreground">Základní pravidla hry</div>
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
                    onClick={() => window.open('/priprava', '_blank')}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-orange-400" />
                      <div>
                        <div className="font-medium">Příprava postavy</div>
                        <div className="text-xs text-muted-foreground">Návod pro nové hráče</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Date */}
            <GameDate />

            {/* Magická věštba */}
            <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-300/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <div className="text-2xl mr-3">🔮</div>
                  Magická věštba dne
                </h3>
                <div className="bg-amber-50/50 dark:bg-amber-950/30 p-4 rounded-lg border-l-4 border-amber-400">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                    Věštba na dnešní den
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300 italic">
                    {(() => {
                      const prophecies = [
                        "Nastává týden bobrů: tento týden budou bobří hráze obzvlášť pevné. Pozor na záplavy.",
                        "Hvězdy praví o týdnu jednorožců: magická energie bude silnější, ale pozor na falešné přátele.",
                        "Nadchází období draků: vaše kouzla budou mocnější, ale kontrola obtížnější.",
                        "Týden fénixů přináší znovuzrození: staré problémy se vyřeší, nové začátky se blíží.",
                        "Období gryfů slibuje odvahu: nebojte se čelit výzvám, které vás čekají.",
                        "Nastává čas bazilišků: opatrnost je na místě, ne vše je takové, jak se zdá.",
                        "Týden hipogrifů přináší svobodu: cesty se otevírají, ale vyžadují respekt.",
                        "Období centaurů věští moudrost: poslouchejte starší a zkušenější než vy.",
                        "Nastává čas akromaněul: teamwork bude klíčový, ale pozor na pavučiny intrik.",
                        "Týden thestrálů odhaluje skryté: uvidíte to, co jiní nevidí.",
                        "Období domácích skřítků slibuje službu: pomoc přijde z nečekaných míst.",
                        "Nastává čas kelpií: pozor na klamné vidiny a falešné sliby.",
                        "Týden mandrágory přináší uzdravení: staré rány se začnou hojit.",
                        "Období banší věští změny: konec jedné fáze, začátek nové.",
                        "Nastává čas bowtrucklů: malé detaily budou důležitější než velké gesta.",
                        "Týden nifflerů slibuje poklady: hledejte hodnotu v neočekávaných místech.",
                        "Období pixies přináší zmatek: buďte připraveni na nečekané obraty.",
                        "Nastává čas cornishských skřítků: chaos může přinést příležitosti.",
                        "Týden veelů věští kouzla: krása může být zároveň nebezpečná.",
                        "Období trollů varuje před unáhleností: pomalu a jistě vede k cíli.",
                        "Nastává čas houseelů: věrnost bude odměněna nečekanými způsoby.",
                        "Týden dementorů přináší stíny: hledejte světlo ve tmě, najdete ho.",
                        "Období sfinx slibuje hádanky: odpovědi jsou blíže, než si myslíte.",
                        "Nastává čas werewolfů: vaše druhá povaha se může projevit.",
                        "Týden vampýrů věští nesmrtelnost: něco, co považujete za mrtvé, ožije.",
                        "Období olbřímů varuje před silou: síla bez moudrosti je nebezpečná.",
                        "Nastává čas koček: vaše intuice bude obzvlášť ostrá dnes.",
                        "Týden sov přináší zprávy: důležitá komunikace je na cestě k vám.",
                        "Období hadů slibuje transformaci: svlékněte starou kůži a obnovte se.",
                        "Nastává čas krys: malé problémy mohou vyrůst, řešte je včas."
                      ];
                      const dayOfMonth = new Date().getDate();
                      return `"${prophecies[(dayOfMonth - 1) % prophecies.length]}"`;
                    })()}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    - Profesorka Trelawneyová
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Novinky */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground flex items-center">
                    <Newspaper className="text-accent mr-3 h-6 w-6" />
                    Novinky a oznámení
                  </h3>
                  {user?.role === 'admin' && (
                    <Button variant="outline" size="sm">
                      <div className="text-xs">+ Přidat novinku</div>
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="border-l-4 border-accent pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Nový systém sesílání kouzel</h4>
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="sm" className="text-xs opacity-60 hover:opacity-100">
                          Upravit
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Byl přidán pokročilý systém sesílání kouzel s realistickými efekty úspěchu a neúspěchu. 
                      Každé kouzlo má nyní svou vlastní obtížnost a požadavky na magickou energii.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">31. prosince 1926 • Admin</p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Vánoční události</h4>
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="sm" className="text-xs opacity-60 hover:opacity-100">
                          Upravit
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Během vánočních svátků budou po celém Kouzelnickém Londýně probíhat speciální události. 
                      Sledujte oznámení a připojte se k oslavám!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">20. prosince 1926 • Professor McGonagall</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Nové lokace k průzkumu</h4>
                      {user?.role === 'admin' && (
                        <Button variant="ghost" size="sm" className="text-xs opacity-60 hover:opacity-100">
                          Upravit
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Otevřely se nové chatovací místnosti včetně Ministerstva kouzel a Zásypu. 
                      Prozkoumejte tyto tajemné lokace a objevte jejich skrytá tajemství.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">15. prosince 1926 • Admin</p>
                  </div>
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
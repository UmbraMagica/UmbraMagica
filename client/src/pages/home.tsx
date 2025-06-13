import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  Bird,
  Newspaper,
  ChevronDown,
  Menu,
  X
} from "lucide-react";
import { GameDate, getCurrentGameDate } from "@/components/GameDate";
import { calculateGameAge } from "@/lib/gameDate";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { MoonPhase } from "@/components/MoonPhase";

interface OnlineCharacter {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  location: string;
  roomId?: number;
  avatar?: string | null;
}

export default function Home() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [displayedCharacter, setDisplayedCharacter] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleHomeClick = () => {
    if (location === '/') {
      // Refresh data instead of reloading the page
      queryClient.invalidateQueries();
    } else {
      setLocation('/');
    }
  };

  const { data: onlineCharacters = [] } = useQuery<OnlineCharacter[]>({
    queryKey: ["/api/characters/online"],
    staleTime: 30000,
  });

  // Get user's characters from the auth user object
  const userCharacters = user?.characters || [];

  // Get all characters for birthday display
  const { data: allCharacters = [] } = useQuery({
    queryKey: ["/api/characters/all"],
    enabled: !!user,
  });

  // Find the active character from database (isActive: true)
  const activeCharacter = Array.isArray(userCharacters) ? userCharacters.find((char: any) => char.isActive && !char.deathDate) : null;
  // Fallback to first alive character if no active character is set
  const firstAliveCharacter = Array.isArray(userCharacters) ? userCharacters.find((char: any) => !char.deathDate) : null;
  const currentDisplayedCharacter = displayedCharacter || activeCharacter || firstAliveCharacter;

  // Load character from localStorage on component mount
  useEffect(() => {
    if (userCharacters && Array.isArray(userCharacters) && userCharacters.length > 0) {
      const savedCharacterId = localStorage.getItem('selectedCharacterId');
      if (savedCharacterId) {
        const savedCharacter = userCharacters.find((char: any) => char.id === parseInt(savedCharacterId));
        if (savedCharacter && !savedCharacter.deathDate) {
          setDisplayedCharacter(savedCharacter);
          return;
        }
      }
      
      // If no saved character or character is dead, use first alive character
      if (firstAliveCharacter && !displayedCharacter) {
        setDisplayedCharacter(firstAliveCharacter);
        localStorage.setItem('selectedCharacterId', firstAliveCharacter.id.toString());
      }
    }
  }, [userCharacters, firstAliveCharacter]);

  // Function to change the displayed character
  const setCurrentDisplayedCharacter = (character: any) => {
    setDisplayedCharacter(character);
    localStorage.setItem('selectedCharacterId', character.id.toString());
  };

  // Get displayed character's wand (for the character currently being viewed)
  const { data: characterWand } = useQuery({
    queryKey: [`/api/characters/${currentDisplayedCharacter?.id}/wand`],
    enabled: !!currentDisplayedCharacter?.id,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0     // Don't cache
  });

  // Get unread owl post count for current character
  const { data: unreadOwlPostData } = useQuery({
    queryKey: ["/api/owl-post/unread-count", currentDisplayedCharacter?.id],
    enabled: !!currentDisplayedCharacter?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
    queryFn: async () => {
      if (!currentDisplayedCharacter?.id) return { count: 0 };
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/owl-post/unread-count/${currentDisplayedCharacter.id}`);
      if (!response.ok) return { count: 0 };
      return response.json();
    }
  });

  // Get character's last used chat room
  const { data: lastChatRoom } = useQuery({
    queryKey: [`/api/characters/${currentDisplayedCharacter?.id}/last-chat`],
    enabled: !!currentDisplayedCharacter?.id,
  });

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
              <div className="text-xl font-bold text-accent">Umbra Magica</div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={handleHomeClick}>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Domov
                </Button>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Nastavení
                </Button>
                {user?.role === 'admin' && (
                  <div 
                    className="flex items-center px-3 py-2 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 cursor-pointer rounded-md transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Admin button clicked');
                      setLocation('/admin');
                    }}
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Administrace
                  </div>
                )}
              </div>

              {/* Mobile Home Icon and Hamburger Menu */}
              <div className="md:hidden flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleHomeClick}
                  aria-label="Domov"
                  title="Domov"
                >
                  <HomeIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Character Selector */}
              {userCharacters && Array.isArray(userCharacters) && userCharacters.length > 0 && (
                <Select
                  value={currentDisplayedCharacter?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedChar = userCharacters.find((char: any) => char.id === parseInt(value));
                    if (selectedChar) {
                      setDisplayedCharacter(selectedChar);
                      localStorage.setItem('selectedCharacterId', selectedChar.id.toString());
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Vyberte postavu">
                      {currentDisplayedCharacter ? (
                        <div className="flex items-center gap-2">
                          <CharacterAvatar character={currentDisplayedCharacter} size="sm" />
                          <span className="truncate">
                            {currentDisplayedCharacter.firstName} {currentDisplayedCharacter.lastName}
                          </span>
                        </div>
                      ) : (
                        "Vyberte postavu"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {userCharacters.filter((char: any) => !char.deathDate).map((character: any) => (
                      <SelectItem key={character.id} value={character.id.toString()}>
                        <div className="flex items-center gap-2">
                          <CharacterAvatar character={character} size="sm" />
                          <span>
                            {character.firstName} {character.lastName}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-foreground hover:text-accent" 
                onClick={() => {
                  setLocation('/settings');
                  setIsMenuOpen(false);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Nastavení
              </Button>
              {user?.role === 'admin' && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-amber-400 hover:text-amber-300 hover:bg-amber-400/10" 
                  onClick={() => {
                    setLocation('/admin');
                    setIsMenuOpen(false);
                  }}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Administrace
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Urgent Wand Warning for characters without wands */}
        {currentDisplayedCharacter && (characterWand === null || characterWand === undefined) && (
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/50 border-2 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-amber-500/20 p-3 rounded-full">
                      <Wand2 className="h-8 w-8 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-300 mb-1">
                        {currentDisplayedCharacter?.firstName} potřebuje hůlku!
                      </h3>
                      <p className="text-amber-200/80">
                        Bez hůlky nemůžete sesílat kouzla. Navštivte Ollivandera a získejte svou první hůlku.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setLocation('/ollivanders')}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 text-lg shadow-lg"
                  >
                    Navštívit Ollivandera
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-4xl fantasy-font font-bold text-accent mb-4">
            Vítejte zpět, {user?.username}!
          </h1>
          <p className="text-lg text-muted-foreground">Připravte se na další dobrodružství ve světě Umbra Magica</p>
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
                    variant={currentDisplayedCharacter && (characterWand === null || characterWand === undefined) ? "default" : "ghost"}
                    className={`w-full justify-start text-left h-auto p-3 ${
                      currentDisplayedCharacter && (characterWand === null || characterWand === undefined)
                        ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 animate-pulse" 
                        : "hover:bg-purple-500/20"
                    }`}
                    onClick={() => setLocation('/ollivanders')}
                  >
                    <div className="flex items-center space-x-3">
                      <Wand2 className={`h-5 w-5 ${
                        currentDisplayedCharacter && (characterWand === null || characterWand === undefined) ? "text-amber-300" : "text-amber-400"
                      }`} />
                      <div>
                        <div className={`font-medium ${
                          currentDisplayedCharacter && (characterWand === null || characterWand === undefined) ? "text-amber-200" : ""
                        }`}>
                          U Ollivandera
                          {currentDisplayedCharacter && (characterWand === null || characterWand === undefined) && " ⚠️"}
                        </div>
                        <div className={`text-xs ${
                          currentDisplayedCharacter && (characterWand === null || characterWand === undefined) ? "text-amber-300/80" : "text-muted-foreground"
                        }`}>
                          {currentDisplayedCharacter && (characterWand === null || characterWand === undefined) ? "POTŘEBUJETE HŮLKU!" : "Získat hůlku"}
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 hover:bg-purple-500/20 relative"
                    onClick={() => setLocation(`/owl-post?character=${currentDisplayedCharacter?.id || ''}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Bird className="h-5 w-5 text-amber-400" />
                        {unreadOwlPostData?.count > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-3 h-4 w-4 p-0 text-xs flex items-center justify-center rounded-full"
                          >
                            {unreadOwlPostData.count > 99 ? '99+' : unreadOwlPostData.count}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">Soví pošta</div>
                        <div className="text-xs text-muted-foreground">Kouzelnická pošta</div>
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
            {/* Game Date and Moon Phase */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GameDate />
              <MoonPhase gameDate={getCurrentGameDate()} />
            </div>


            {/* Influence Bar */}
            <Card className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                  <div className="text-2xl mr-3">⚔️</div>
                  Magický vliv v roce 1926
                </h3>
                {(() => {
                  const { data: influenceData } = useQuery({
                    queryKey: ['/api/influence-bar'],
                    staleTime: 30000, // Refresh every 30 seconds
                  });
                  
                  const { data: influenceHistory } = useQuery({
                    queryKey: ['/api/influence-history'],
                    staleTime: 30000,
                  });

                  if (!influenceData) {
                    return (
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                        <div className="text-center text-muted-foreground">Načítání...</div>
                      </div>
                    );
                  }

                  const grindelwaldPoints = influenceData?.grindelwaldPoints || 0;
                  const dumbledorePoints = influenceData?.dumbledorePoints || 0;
                  const totalPoints = grindelwaldPoints + dumbledorePoints;
                  const grindelwaldPercentage = totalPoints > 0 ? (grindelwaldPoints / totalPoints) * 100 : 50;
                  const dumbledorePercentage = totalPoints > 0 ? (dumbledorePoints / totalPoints) * 100 : 50;

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                          <span className="font-medium text-red-700 dark:text-red-400">Grindelwald</span>
                          <span className="ml-2 text-muted-foreground">({grindelwaldPoints})</span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2 text-muted-foreground">({dumbledorePoints})</span>
                          <span className="font-medium text-blue-700 dark:text-blue-400">Brumbál</span>
                          <div className="w-3 h-3 bg-blue-600 rounded-full ml-2"></div>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-slate-400 transition-all">
                            <div 
                              className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 ease-in-out"
                              style={{ width: `${grindelwaldPercentage}%` }}
                            ></div>
                            <div 
                              className="absolute right-0 top-0 h-full bg-gradient-to-l from-blue-600 to-blue-500 transition-all duration-1000 ease-in-out"
                              style={{ width: `${dumbledorePercentage}%` }}
                            ></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white text-xs font-semibold drop-shadow-lg">
                                {Math.round(grindelwaldPercentage)}% : {Math.round(dumbledorePercentage)}%
                              </span>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-96">
                          <DialogHeader>
                            <DialogTitle>Historie změn magického vlivu</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-80 overflow-y-auto">
                            {!influenceHistory ? (
                              <div className="text-center text-muted-foreground py-8">Načítání historie...</div>
                            ) : !Array.isArray(influenceHistory) || influenceHistory.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8">Zatím žádné změny</div>
                            ) : (
                              <div className="space-y-3">
                                {influenceHistory.map((entry: any) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-card/30"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        entry.changeType === 'grindelwald' ? 'bg-red-600' : 'bg-blue-600'
                                      }`}></div>
                                      <div>
                                        <div className="font-medium text-sm">
                                          {entry.changeType === 'grindelwald' ? 'Grindelwald' : 'Brumbál'}: 
                                          <span className={`ml-1 ${entry.pointsChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {entry.pointsChanged > 0 ? '+' : ''}{entry.pointsChanged}
                                          </span>
                                          <span className="text-muted-foreground ml-1">
                                            ({entry.previousTotal} → {entry.newTotal})
                                          </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{entry.reason}</div>
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <div>Admin ID: {entry.adminId}</div>
                                      <div>{entry.createdAt ? new Date(entry.createdAt).toLocaleString('cs-CZ') : 'Neznámé datum'}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <div className="text-xs text-center text-muted-foreground">
                        Klikněte na lištu pro zobrazení historie změn
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>



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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                      <User className="text-accent mr-3 h-5 w-5" />
                      Moje postava
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation("/character/edit")}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={!currentDisplayedCharacter?.id}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex justify-center">
                      <CharacterAvatar character={currentDisplayedCharacter} size="lg" />
                    </div>
                    <h4 
                      className="font-bold text-xl text-foreground cursor-pointer hover:text-accent transition-colors font-serif"
                      onClick={() => setLocation(`/characters/${currentDisplayedCharacter.id}`)}
                    >
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
                      {lastChatRoom?.room && (
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/chat/room/${lastChatRoom.room.id}`, '_blank')}
                            className="w-full text-xs"
                          >
                            <MessageCircle className="h-3 w-3 mr-2" />
                            Poslední chat: {lastChatRoom.room.name}
                          </Button>
                        </div>
                      )}
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
                        return a.firstName.localeCompare(b.firstName, 'cs');
                      })
                      .map((character: any) => (
                      <div 
                        key={character.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center space-x-3 flex-1">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // First set the character as selected in localStorage
                            localStorage.setItem('selectedCharacterId', character.id.toString());
                            setLocation("/character/edit");
                          }}
                          className="text-muted-foreground hover:text-foreground ml-2"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
                        <div className="space-y-1">
                          <button
                            onClick={() => setLocation(`/characters/${character.id}`)}
                            className="text-left hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground hover:text-primary">{character.fullName}</p>
                          </button>
                          <button
                            onClick={() => setLocation(`/chat/room/${character.roomId}`)}
                            className="text-left hover:bg-muted/30 rounded p-1 -m-1 transition-colors"
                          >
                            <p className="text-xs text-muted-foreground hover:text-primary">v {character.location}</p>
                          </button>
                        </div>
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

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <div className="text-accent mr-3">🎂</div>
                  Narozeniny dnes
                </h3>
                <div className="space-y-3">
                  {allCharacters
                    ?.filter((character: any) => {
                      if (!character.birthDate) return false;
                      const today = new Date();
                      const birthDate = new Date(character.birthDate);
                      return birthDate.getDate() === today.getDate() && 
                             birthDate.getMonth() === today.getMonth();
                    })
                    .map((character: any) => (
                      <div key={character.id} className="flex items-center space-x-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <CharacterAvatar character={character} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {character.firstName} {character.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {calculateGameAge(character.birthDate)} let
                          </p>
                        </div>
                        <div className="text-yellow-500">🎉</div>
                      </div>
                    )) || []}
                  {(!allCharacters || allCharacters.filter((character: any) => {
                    if (!character.birthDate) return false;
                    const today = new Date();
                    const birthDate = new Date(character.birthDate);
                    return birthDate.getDate() === today.getDate() && 
                           birthDate.getMonth() === today.getMonth();
                  }).length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Dnes nikdo neslaví narozeniny
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
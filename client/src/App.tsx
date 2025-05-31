import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import AdminArchive from "@/pages/admin-archive";
import AdminSpells from "@/pages/admin-spells";
import AdminWandComponents from "@/pages/admin-wand-components";
import AdminCharacterSpells from "@/pages/admin-character-spells";
import Registration from "@/pages/registration";
import ChatList from "@/pages/chat-list";
import ChatCategories from "@/pages/chat-categories";
import ChatRoom from "@/pages/chat-room-simple-new";
import CharacterEdit from "@/pages/character-edit-fixed-nav";
import CharactersList from "@/pages/characters-list";
import CharacterProfile from "@/pages/character-profile";
import CharacterInventory from "@/pages/character-inventory";
import CharacterJournal from "@/pages/character-journal";
import CharacterSpells from "@/pages/character-spells";
import MySpells from "@/pages/my-spells";
import UserSettings from "@/pages/user-settings";
import Cemetery from "@/pages/cemetery";
import Ollivanders from "@/pages/ollivanders";
import OwlPost from "@/pages/owl-post";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";

function Router() {
  const { user, isLoading } = useAuth();

  // Initialize test data on app start
  useEffect(() => {
    const initTestData = async () => {
      try {
        await apiRequest("POST", "/api/admin/init-test-data");
      } catch (error) {
        // Silently fail - test data might already exist
      }
    };
    initTestData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Landing} />
          <Route path="/registration" component={Registration} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/admin" component={Admin} />
          <Route path="/admin/archive" component={AdminArchive} />
          <Route path="/admin/spells" component={AdminSpells} />
          <Route path="/admin/spells/character/:characterId" component={AdminCharacterSpells} />
          <Route path="/admin/wand-components" component={AdminWandComponents} />
          <Route path="/home" component={Home} />
          <Route path="/character/edit" component={CharacterEdit} />
          <Route path="/character-edit/:characterId" component={CharacterEdit} />
          <Route path="/settings" component={UserSettings} />
          <Route path="/user-settings" component={UserSettings} />
          <Route path="/chat" component={ChatCategories} />
          <Route path="/chat-categories" component={ChatCategories} />
          <Route path="/chat/list" component={ChatList} />
          <Route path="/chat/room/:roomId" component={ChatRoom} />
          <Route path="/characters" component={CharactersList} />
          <Route path="/characters/:id" component={CharacterProfile} />
          <Route path="/characters/:id/edit" component={CharacterEdit} />
          <Route path="/character/:id" component={CharacterProfile} />
          <Route path="/characters/:characterId/inventory" component={CharacterInventory} />
          <Route path="/characters/:characterId/journal" component={CharacterJournal} />
          <Route path="/characters/:id/spells" component={CharacterSpells} />
          <Route path="/my-spells" component={MySpells} />
          <Route path="/cemetery" component={Cemetery} />
          <Route path="/ollivanders" component={Ollivanders} />
          <Route path="/owl-post" component={OwlPost} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

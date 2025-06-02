import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, FileText, Save, X, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

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
  residence?: string;
  characterHistory?: string;
  showHistoryToOthers?: boolean;
  height?: number;
  weight?: number;
  user: {
    username: string;
    email: string;
  };
}

export default function CharacterHistory() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for history editing
  const [isEditing, setIsEditing] = useState(false);
  const [historyText, setHistoryText] = useState("");
  const [showHistoryToOthers, setShowHistoryToOthers] = useState(true);

  const { data: character, isLoading, error } = useQuery<Character>({
    queryKey: [`/api/characters/${id}`],
    enabled: !!id,
  });

  // Initialize history state when character data loads
  useEffect(() => {
    if (character) {
      setHistoryText(character.characterHistory || "");
      setShowHistoryToOthers(character.showHistoryToOthers !== false);
    }
  }, [character]);

  // Check if user can edit this character
  const canEdit = user && character && (
    user.role === 'admin' || 
    user.id === character.userId
  );

  // History update mutation
  const updateHistoryMutation = useMutation({
    mutationFn: async (data: { history: string; showHistoryToOthers: boolean }) => {
      return await apiRequest(`/api/characters/${id}/history`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Historie postavy byla úspěšně uložena.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${id}`] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit historii postavy.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateHistoryMutation.mutate({
      history: historyText,
      showHistoryToOthers: showHistoryToOthers,
    });
  };

  const handleCancel = () => {
    setHistoryText(character?.characterHistory || "");
    setShowHistoryToOthers(character?.showHistoryToOthers !== false);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Načítání...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Postava nebyla nalezena.</p>
              <Button
                variant="outline"
                onClick={() => setLocation('/characters')}
                className="mt-4"
              >
                Zpět na seznam postav
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nemáte oprávnění upravovat historii této postavy.</p>
              <Button
                variant="outline"
                onClick={() => setLocation(`/characters/${id}`)}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zpět na profil postavy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/characters/${id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět na profil postavy
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Historie postavy: {character.firstName} {character.middleName && `${character.middleName} `}{character.lastName}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historie postavy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Současná historie</h3>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Upravit historii
                  </Button>
                </div>
                
                {character.characterHistory ? (
                  <div className="p-4 border rounded-md bg-muted/20">
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {character.characterHistory}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-md bg-muted/20 text-center">
                    <p className="text-muted-foreground italic">
                      Žádná historie zatím nebyla napsána.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  {character.showHistoryToOthers ? (
                    <div className="text-green-600 dark:text-green-400">
                      ✓ Historie je viditelná ostatním hráčům
                    </div>
                  ) : (
                    <div className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Historie je skrytá před ostatními hráči
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Historie postavy
                  </label>
                  <Textarea
                    value={historyText}
                    onChange={(e) => setHistoryText(e.target.value)}
                    placeholder="Napište historii své postavy..."
                    className="min-h-[200px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-history"
                    checked={showHistoryToOthers}
                    onCheckedChange={(checked) => setShowHistoryToOthers(!!checked)}
                  />
                  <label
                    htmlFor="show-history"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Zobrazit historii ostatním hráčům
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateHistoryMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateHistoryMutation.isPending ? "Ukládám..." : "Uložit"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Zrušit
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
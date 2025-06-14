import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Calendar, MapPin, Tag } from "lucide-react";
import { Link } from "wouter";

const journalEntrySchema = z.object({
  title: z.string().min(1, "Název záznamu je povinný").max(200),
  content: z.string().min(1, "Obsah záznamu je povinný"),
  entryDate: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Neplatný formát data"
  }),
  isPrivate: z.boolean().default(true),
  mood: z.enum(["Happy", "Sad", "Excited", "Worried", "Angry", "Peaceful", "Confused", "Determined"]).optional(),
  location: z.string().max(100).optional(),
  tags: z.array(z.string()).default([]),
});

type JournalEntryForm = z.infer<typeof journalEntrySchema>;

interface JournalEntry {
  id: number;
  characterId: number;
  title: string;
  content: string;
  entryDate: string;
  isPrivate: boolean;
  mood?: string;
  location?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const moodEmojis = {
  Happy: "😊",
  Sad: "😢",
  Excited: "🤩",
  Worried: "😰",
  Angry: "😠",
  Peaceful: "😌",
  Confused: "😕",
  Determined: "😤",
};

const moodColors = {
  Happy: "bg-yellow-100 text-yellow-800",
  Sad: "bg-blue-100 text-blue-800",
  Excited: "bg-orange-100 text-orange-800",
  Worried: "bg-gray-100 text-gray-800",
  Angry: "bg-red-100 text-red-800",
  Peaceful: "bg-green-100 text-green-800",
  Confused: "bg-purple-100 text-purple-800",
  Determined: "bg-indigo-100 text-indigo-800",
};

export default function CharacterJournal() {
  const { characterId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Fetch character data
  const { data: character } = useQuery<any>({
    queryKey: [`/api/characters/${characterId}`],
    enabled: !!characterId,
  });

  // Fetch character journal
  const { data: journal = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: [`/api/characters/${characterId}/journal`],
    enabled: !!characterId,
  });

  const form = useForm<JournalEntryForm>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      title: "",
      content: "",
      entryDate: new Date().toISOString().split('T')[0], // Today's date in 1926
      isPrivate: true,
      mood: undefined,
      location: "",
      tags: [],
    },
  });

  // Add journal entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async (data: JournalEntryForm) => {
      const response = await apiRequest("POST", `${import.meta.env.VITE_API_URL}/api/characters/${characterId}/journal`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/journal`] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Záznam přidán",
        description: "Záznam byl úspěšně přidán do deníku.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat záznam",
        variant: "destructive",
      });
    },
  });

  // Update journal entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, data }: { entryId: number; data: Partial<JournalEntryForm> }) => {
      const response = await apiRequest("PATCH", `${import.meta.env.VITE_API_URL}/api/journal/${entryId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/journal`] });
      setEditingEntry(null);
      form.reset();
      toast({
        title: "Záznam upraven",
        description: "Záznam byl úspěšně upraven.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit záznam",
        variant: "destructive",
      });
    },
  });

  // Delete journal entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("DELETE", `${import.meta.env.VITE_API_URL}/api/journal/${entryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/journal`] });
      setSelectedEntry(null);
      toast({
        title: "Záznam smazán",
        description: "Záznam byl úspěšně odstraněn z deníku.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat záznam",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JournalEntryForm) => {
    if (editingEntry) {
      updateEntryMutation.mutate({ entryId: editingEntry.id, data });
    } else {
      addEntryMutation.mutate(data);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    form.reset({
      title: entry.title,
      content: entry.content,
      entryDate: entry.entryDate,
      isPrivate: entry.isPrivate,
      mood: entry.mood as any,
      location: entry.location || "",
      tags: entry.tags || [],
    });
    setIsAddDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setIsAddDialogOpen(false);
    form.reset();
  };

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}. ${date.toLocaleDateString('cs-CZ', { month: 'long' })} 1926`;
  };

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Postava nenalezena</h2>
          <p className="text-muted-foreground">Požadovaná postava neexistuje.</p>
        </div>
      </div>
    );
  }

  // Check if user can edit (character owner or admin)
  const canEdit = character.userId === user?.id || user?.role === "admin";

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href={`/characters/${characterId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět na profil
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <BookOpen className="h-8 w-8" />
              <span>Deník</span>
            </h1>
            <p className="text-muted-foreground">
              {character.firstName} {character.lastName}
            </p>
          </div>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEntry(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nový záznam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? "Upravit záznam" : "Nový záznam v deníku"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Název záznamu</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dnešní den v Bradavicích..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="entryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Datum záznamu</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nálada (volitelná)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Vyberte náladu..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Happy">😊 Šťastný</SelectItem>
                              <SelectItem value="Sad">😢 Smutný</SelectItem>
                              <SelectItem value="Excited">🤩 Nadšený</SelectItem>
                              <SelectItem value="Worried">😰 Ustaraný</SelectItem>
                              <SelectItem value="Angry">😠 Rozzlobený</SelectItem>
                              <SelectItem value="Peaceful">😌 Klidný</SelectItem>
                              <SelectItem value="Confused">😕 Zmatený</SelectItem>
                              <SelectItem value="Determined">😤 Odhodlaný</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Místo (volitelné)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Bradavice, Velká síň..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Obsah záznamu</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[200px]"
                            placeholder="Dnes se stalo něco zajímavého..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Zrušit
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addEntryMutation.isPending || updateEntryMutation.isPending}
                    >
                      {editingEntry ? "Uložit změny" : "Přidat záznam"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Journal Entries */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Načítání deníku...</p>
          </div>
        </div>
      ) : journal.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Prázdný deník</h3>
            <p className="text-muted-foreground mb-4">
              Tato postava zatím nemá žádné záznamy v deníku.
            </p>
            {canEdit && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Přidat první záznam
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal entries list */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">Záznamy deníku</h2>
            {journal.map((entry) => (
              <Card 
                key={entry.id} 
                className={`cursor-pointer transition-colors ${selectedEntry?.id === entry.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm truncate">{entry.title}</h4>
                    {entry.mood && (
                      <span className="text-lg">
                        {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatGameDate(entry.entryDate)}</span>
                  </div>
                  {entry.location && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{entry.location}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {entry.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected entry detail */}
          <div className="lg:col-span-2">
            {selectedEntry ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>{selectedEntry.title}</span>
                      {selectedEntry.mood && (
                        <Badge className={moodColors[selectedEntry.mood as keyof typeof moodColors]}>
                          {moodEmojis[selectedEntry.mood as keyof typeof moodEmojis]} {selectedEntry.mood}
                        </Badge>
                      )}
                    </CardTitle>
                    {canEdit && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(selectedEntry)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Upravit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEntryMutation.mutate(selectedEntry.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Smazat
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatGameDate(selectedEntry.entryDate)}</span>
                    </div>
                    {selectedEntry.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedEntry.location}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {selectedEntry.content}
                    </p>
                  </div>
                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-1">
                        {selectedEntry.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Vyberte záznam</h3>
                  <p className="text-muted-foreground">
                    Klikněte na záznam vlevo pro zobrazení jeho obsahu.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
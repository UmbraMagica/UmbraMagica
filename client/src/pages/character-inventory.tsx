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
import { ArrowLeft, Plus, Edit, Trash2, Package, Star, Coins } from "lucide-react";
import { Link } from "wouter";

const inventoryItemSchema = z.object({
  itemName: z.string().min(1, "Název předmětu je povinný").max(100),
  itemDescription: z.string().optional(),
  quantity: z.number().min(1, "Množství musí být alespoň 1").default(1),
  category: z.enum(["Wand", "Potion", "Book", "Clothes", "Jewelry", "Tool", "Other"]),
  rarity: z.enum(["Common", "Uncommon", "Rare", "Epic", "Legendary"]).default("Common"),
  value: z.number().min(0, "Hodnota nemůže být záporná").default(0),
  isEquipped: z.boolean().default(false),
  notes: z.string().optional(),
});

type InventoryItemForm = z.infer<typeof inventoryItemSchema>;

interface InventoryItem {
  id: number;
  characterId: number;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  category: string;
  rarity: string;
  value: number;
  isEquipped: boolean;
  notes?: string;
  acquiredAt: string;
  createdAt: string;
}

const rarityColors = {
  Common: "bg-gray-100 text-gray-800",
  Uncommon: "bg-green-100 text-green-800",
  Rare: "bg-blue-100 text-blue-800", 
  Epic: "bg-purple-100 text-purple-800",
  Legendary: "bg-orange-100 text-orange-800",
};

const categoryIcons = {
  Wand: "🪄",
  Potion: "🧪",
  Book: "📚",
  Clothes: "👕",
  Jewelry: "💍",
  Tool: "🔧",
  Other: "📦",
};

export default function CharacterInventory() {
  const { characterId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Fetch character data
  const { data: character } = useQuery<any>({
    queryKey: [`/api/characters/${characterId}`],
    enabled: !!characterId,
  });

  // Fetch character inventory
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: [`/api/characters/${characterId}/inventory`],
    enabled: !!characterId,
  });

  const form = useForm<InventoryItemForm>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      itemName: "",
      itemDescription: "",
      quantity: 1,
      category: "Other",
      rarity: "Common",
      value: 0,
      isEquipped: false,
      notes: "",
    },
  });

  // Add inventory item mutation
  const addItemMutation = useMutation({
    mutationFn: async (data: InventoryItemForm) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/inventory`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/inventory`] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Předmět přidán",
        description: "Předmět byl úspěšně přidán do inventáře.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat předmět",
        variant: "destructive",
      });
    },
  });

  // Update inventory item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, data }: { itemId: number; data: Partial<InventoryItemForm> }) => {
      const response = await apiRequest("PATCH", `/api/inventory/${itemId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/inventory`] });
      setEditingItem(null);
      form.reset();
      toast({
        title: "Předmět upraven",
        description: "Předmět byl úspěšně upraven.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit předmět",
        variant: "destructive",
      });
    },
  });

  // Delete inventory item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest("DELETE", `/api/inventory/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/inventory`] });
      toast({
        title: "Předmět smazán",
        description: "Předmět byl úspěšně odstraněn z inventáře.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat předmět",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InventoryItemForm) => {
    if (editingItem) {
      updateItemMutation.mutate({ itemId: editingItem.id, data });
    } else {
      addItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      itemName: item.itemName,
      itemDescription: item.itemDescription || "",
      quantity: item.quantity,
      category: item.category as any,
      rarity: item.rarity as any,
      value: item.value,
      isEquipped: item.isEquipped,
      notes: item.notes || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsAddDialogOpen(false);
    form.reset();
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

  // Group inventory by category
  const inventoryByCategory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const totalValue = inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0);
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);

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
            <h1 className="text-3xl font-bold text-foreground">Inventář</h1>
            <p className="text-muted-foreground">
              {character.firstName} {character.lastName}
            </p>
          </div>
        </div>
        {canEdit && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Přidat předmět
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Upravit předmět" : "Přidat nový předmět"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="itemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Název předmětu</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Wand">🪄 Hůlka</SelectItem>
                            <SelectItem value="Potion">🧪 Lektvar</SelectItem>
                            <SelectItem value="Book">📚 Kniha</SelectItem>
                            <SelectItem value="Clothes">👕 Oblečení</SelectItem>
                            <SelectItem value="Jewelry">💍 Šperky</SelectItem>
                            <SelectItem value="Tool">🔧 Nástroj</SelectItem>
                            <SelectItem value="Other">📦 Ostatní</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Množství</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hodnota (galleony)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="rarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vzácnost</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Common">Běžný</SelectItem>
                            <SelectItem value="Uncommon">Neobvyklý</SelectItem>
                            <SelectItem value="Rare">Vzácný</SelectItem>
                            <SelectItem value="Epic">Epický</SelectItem>
                            <SelectItem value="Legendary">Legendární</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="itemDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Popis (volitelný)</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poznámky (volitelné)</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
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
                      disabled={addItemMutation.isPending || updateItemMutation.isPending}
                    >
                      {editingItem ? "Uložit změny" : "Přidat předmět"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Celkový počet předmětů</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Celková hodnota</p>
                <p className="text-2xl font-bold">{totalValue} G</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Kategorií</p>
                <p className="text-2xl font-bold">{Object.keys(inventoryByCategory).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Načítání inventáře...</p>
          </div>
        </div>
      ) : inventory.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Prázdný inventář</h3>
            <p className="text-muted-foreground mb-4">
              Tato postava zatím nemá žádné předměty v inventáři.
            </p>
            {canEdit && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Přidat první předmět
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(inventoryByCategory).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  <span>{category}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <Card key={item.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{item.itemName}</h4>
                          {canEdit && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItemMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={rarityColors[item.rarity as keyof typeof rarityColors]}>
                            {item.rarity}
                          </Badge>
                          {item.quantity > 1 && (
                            <Badge variant="outline">x{item.quantity}</Badge>
                          )}
                          {item.isEquipped && (
                            <Badge variant="default">Vybaven</Badge>
                          )}
                        </div>
                        
                        {item.itemDescription && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.itemDescription}
                          </p>
                        )}
                        
                        {item.value > 0 && (
                          <p className="text-sm font-medium text-yellow-600">
                            {item.value * item.quantity} G
                          </p>
                        )}
                        
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            {item.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PlusCircle, Package, ArrowLeft, Coins, Star, Hash, FileText, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useParams } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

const ITEM_TYPE_OPTIONS = [
  { value: "book", label: "Kniha", icon: "📚" },
  { value: "potion", label: "Lektvar", icon: "🧪" },
  { value: "artifact", label: "Magický artefakt", icon: "✨" },
  { value: "plant", label: "Rostlina", icon: "🌿" },
  { value: "other", label: "Ostatní", icon: "📦" },
];

const RARITY_OPTIONS = [
  { value: "common", label: "Běžná", color: "bg-gray-100 text-gray-800 border-gray-200" },
  { value: "uncommon", label: "Neobvyklá", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "rare", label: "Vzácná", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "epic", label: "Epická", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "legendary", label: "Legendární", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
];

const inventoryItemSchema = z.object({
  item_type: z.string(),
  item_id: z.number(),
  price: z.number().min(0),
  item_name: z.string().optional(),
  description: z.string().optional(),
  rarity: z.string().optional(),
  quantity: z.number().min(1).default(1),
  notes: z.string().optional(),
});

type InventoryItemForm = z.infer<typeof inventoryItemSchema>;

export function AddInventoryItemDialog({ characterId }: { characterId: number }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InventoryItemForm>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      item_type: "",
      item_id: 1,
      price: 0,
      quantity: 1,
    },
  });

  const getCategoryLabel = (type) => {
    const found = ITEM_TYPE_OPTIONS.find(opt => opt.value === type);
    return found ? found.label : '';
  };

  const mutation = useMutation({
    mutationFn: (data: InventoryItemForm) => {
      const payload = {
        item_type: data.item_type,
        item_id: data.item_id,
        price: data.price,
        item_name: data.item_name || '',
        description: data.description || '',
        rarity: data.rarity || '',
        quantity: data.quantity || 1,
        notes: data.notes || '',
        category: getCategoryLabel(data.item_type),
      };
      return apiRequest("POST", `/api/characters/${characterId}/inventory`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characterInventory", characterId] });
      setOpen(false);
      form.reset();
    },
  });

  function onSubmit(data: InventoryItemForm) {
    mutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Přidat předmět
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Přidat nový předmět do inventáře
          </DialogTitle>
          <DialogDescription>
            Vyplň informace o předmětu, který chceš přidat do inventáře postavy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ předmětu</FormLabel>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        const found = ITEM_TYPE_OPTIONS.find(opt => opt.value === val);
                        if (found) form.setValue("category", found.label);
                        form.setValue("item_id", 1);
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyber typ předmětu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ITEM_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vzácnost</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyber vzácnost" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RARITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název předmětu</FormLabel>
                  <FormControl>
                    <Input placeholder="Např. Neviditelný plášť" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popis</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Popis předmětu, jeho vlastnosti a účinky..." 
                      rows={3}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Množství</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cena (v galeonech)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field} 
                        value={field.value || ""}
                        onChange={e => field.onChange(Number(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poznámky</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Dodatečné poznámky k předmětu..." 
                      rows={2}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)} 
            disabled={mutation.isPending}
            className="min-w-[120px]"
          >
            {mutation.isPending ? "Přidávám..." : "Přidat do inventáře"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InventoryItemCard({ item, onEdit, onDelete }: { 
  item: any; 
  onEdit?: (item: any) => void; 
  onDelete?: (item: any) => void; 
}) {
  const getItemTypeIcon = (type: string) => {
    const typeOption = ITEM_TYPE_OPTIONS.find(opt => opt.value === type);
    return typeOption?.icon || "📦";
  };

  const getRarityStyle = (rarity: string) => {
    const rarityOption = RARITY_OPTIONS.find(opt => opt.value === rarity);
    return rarityOption?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getItemTypeIcon(item.item_type)}</div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {item.item_name || `${ITEM_TYPE_OPTIONS.find(opt => opt.value === item.item_type)?.label || item.item_type}`}
              </CardTitle>
              {item.rarity && (
                <Badge variant="outline" className={`mt-1 ${getRarityStyle(item.rarity)}`}>
                  <Star className="h-3 w-3 mr-1" />
                  {RARITY_OPTIONS.find(opt => opt.value === item.rarity)?.label || item.rarity}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {item.description && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Množství:</span>
            <span>{item.quantity}</span>
          </div>
          
          {item.price !== undefined && item.price > 0 && (
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Cena:</span>
              <span>{item.price} galeonů</span>
            </div>
          )}
        </div>
        
        {item.notes && (
          <>
            <Separator className="my-3" />
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-medium text-muted-foreground">Poznámky:</span>
                <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CharacterInventory() {
  const { characterId } = useParams();
  const id = characterId ? Number(characterId) : undefined;
  
  const navigateToProfile = () => {
    window.location.href = `/characters/${characterId}`;
  };

  // Načtení inventáře postavy
  const { data: inventory = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["characterInventory", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await apiRequest("GET", `/api/characters/${id}/inventory`);
      return res.json();
    },
    enabled: !!id,
  });

  // Statistiky inventáře
  const inventoryStats = {
    totalItems: inventory.reduce((acc, item) => acc + item.quantity, 0),
    totalValue: inventory.reduce((acc, item) => acc + (item.price * item.quantity), 0),
    itemTypes: [...new Set(inventory.map(item => item.item_type))].length,
  };

  const handleEditItem = (item: any) => {
    // TODO: Implementovat editaci
    console.log("Edit item:", item);
  };

  const handleDeleteItem = (item: any) => {
    // TODO: Implementovat mazání
    console.log("Delete item:", item);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={navigateToProfile}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na profil
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              Inventář postavy
            </h1>
            <p className="text-muted-foreground mt-1">
              Správa předmětů a vybavení vaší postavy
            </p>
          </div>
        </div>
        
        {id && <AddInventoryItemDialog characterId={id} />}
      </div>

      {/* Statistiky */}
      {!isLoading && !error && inventory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Celkem předmětů</p>
                  <p className="text-2xl font-bold">{inventoryStats.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Celková hodnota</p>
                  <p className="text-2xl font-bold">{inventoryStats.totalValue} G</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Typů předmětů</p>
                  <p className="text-2xl font-bold">{inventoryStats.itemTypes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Obsah inventáře */}
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-2">
                <Package className="h-5 w-5 animate-pulse" />
                <span>Načítám inventář...</span>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-destructive">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p className="font-medium">Chyba při načítání inventáře</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Zkuste obnovit stránku nebo to zkusit později.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : inventory.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Inventář je prázdný</h3>
              <p className="text-muted-foreground mb-6">
                Zatím nemáte žádné předměty. Přidejte první předmět do inventáře.
              </p>
              {id && <AddInventoryItemDialog characterId={id} />}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterInventory;

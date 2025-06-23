
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PlusCircle, Package, ArrowLeft, Coins, Star, Hash, FileText, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

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
  item_id: z.number().optional(),
  price: z.number().min(0),
  item_name: z.string().optional(),
  description: z.string().optional(),
  rarity: z.string().optional(),
  quantity: z.number().min(1).default(1),
  notes: z.string().optional(),
});

type InventoryItemForm = z.infer<typeof inventoryItemSchema>;

interface InventoryItem {
  id: number;
  character_id: number;
  item_type: string;
  item_id: number;
  item_name?: string;
  description?: string;
  rarity?: string;
  quantity: number;
  price: number;
  notes?: string;
  category?: string;
  acquired_at: string;
  is_equipped?: boolean;
}

interface Character {
  id: number;
  firstName: string;
  lastName: string;
  userId: number;
}

export function AddInventoryItemDialog({ characterId }: { characterId: number }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InventoryItemForm>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      item_type: "",
      price: 0,
      quantity: 1,
    },
  });

  const getCategoryLabel = (type: string) => ITEM_TYPE_OPTIONS.find(opt => opt.value === type)?.label || "";

  const mutation = useMutation({
    mutationFn: (data: InventoryItemForm) => {
      const payload = {
        item_type: data.item_type,
        item_id: data.item_id || null,
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

function InventoryItemCard({ item, canEdit }: { item: InventoryItem; canEdit: boolean }) {
  const getRarityStyle = (rarity?: string) => {
    const rarityOption = RARITY_OPTIONS.find(opt => opt.value === rarity);
    return rarityOption?.color || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeIcon = (type: string) => {
    const typeOption = ITEM_TYPE_OPTIONS.find(opt => opt.value === type);
    return typeOption?.icon || "📦";
  };

  const getTypeLabel = (type: string) => {
    const typeOption = ITEM_TYPE_OPTIONS.find(opt => opt.value === type);
    return typeOption?.label || type;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(item.item_type)}</span>
            <div>
              <CardTitle className="text-lg">{item.item_name || "Nepojmenovaný předmět"}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <span>{getTypeLabel(item.item_type)}</span>
                {item.rarity && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className={getRarityStyle(item.rarity)}>
                      {RARITY_OPTIONS.find(opt => opt.value === item.rarity)?.label}
                    </Badge>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {item.description && (
          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span>{item.quantity}</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span>{item.price} G</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(item.acquired_at).toLocaleDateString('cs-CZ')}
          </div>
        </div>

        {item.notes && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hlavní stránka inventáře postavy
const CharacterInventoryPage = () => {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const characterId = params.characterId ? Number(params.characterId) : undefined;

  // Načtení informací o postavě
  const { data: character, isLoading: characterLoading } = useQuery<Character>({
    queryKey: [`/api/characters/${characterId}`],
    enabled: !!characterId,
  });

  // Načtení inventáře
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["characterInventory", characterId],
    queryFn: () => apiRequest("GET", `/api/characters/${characterId}/inventory`),
    enabled: !!characterId,
  });

  if (!characterId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Chybí ID postavy v URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (characterLoading || inventoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Kontrola oprávnění
  const canEdit = user && character && (
    user.role === 'admin' || 
    user.id === character.userId
  );

  // Seskupení podle typů
  const groupedInventory = inventory.reduce((acc, item) => {
    const type = item.item_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Statistiky
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/characters/${characterId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět na profil
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Inventář postavy
          </h1>
          {character && (
            <p className="text-muted-foreground mt-2">
              {character.firstName} {character.lastName}
            </p>
          )}
        </div>
        {canEdit && (
          <AddInventoryItemDialog characterId={characterId} />
        )}
      </div>

      {/* Statistiky */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Celkem předmětů</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{totalValue} G</p>
                <p className="text-sm text-muted-foreground">Celková hodnota</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(groupedInventory).length}</p>
                <p className="text-sm text-muted-foreground">Typů předmětů</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventář */}
      {inventory.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inventář je prázdný</h3>
              <p className="text-muted-foreground mb-4">
                {canEdit 
                  ? "Zatím nemáš žádné předměty. Přidej první předmět do inventáře!"
                  : "Tato postava zatím nemá žádné předměty v inventáři."
                }
              </p>
              {canEdit && (
                <AddInventoryItemDialog characterId={characterId} />
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedInventory).map(([type, items]) => (
            <div key={type}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{ITEM_TYPE_OPTIONS.find(opt => opt.value === type)?.icon || "📦"}</span>
                <h2 className="text-xl font-semibold">
                  {ITEM_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type}
                </h2>
                <Badge variant="secondary">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} ks
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <InventoryItemCard key={item.id} item={item} canEdit={canEdit || false} />
                ))}
              </div>
              {Object.keys(groupedInventory).indexOf(type) < Object.keys(groupedInventory).length - 1 && (
                <Separator className="mt-8" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterInventoryPage;

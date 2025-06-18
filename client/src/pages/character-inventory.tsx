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
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
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
  item_id: z.number().optional(),
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

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useParams } from "wouter";

import { Button } from "@/components/ui/button";
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
import { apiRequest } from "@/lib/queryClient";

const ITEM_TYPE_OPTIONS = [
  { value: "wand", label: "Hůlka" },
  { value: "book", label: "Knihy" },
  { value: "potion", label: "Lektvary" },
  { value: "artifact", label: "Magické artefakty" },
  { value: "plant", label: "Rostliny" },
  { value: "other", label: "Ostatní" }
];

const RARITY_OPTIONS = [
  { value: "common", label: "Běžná" },
  { value: "uncommon", label: "Neobvyklá" },
  { value: "rare", label: "Vzácná" },
  { value: "epic", label: "Epická" },
  { value: "legendary", label: "Legendární" },
  { value: "common_en", label: "Common" },
  { value: "uncommon_en", label: "Uncommon" },
  { value: "rare_en", label: "Rare" },
  { value: "epic_en", label: "Epic" },
  { value: "legendary_en", label: "Legendary" },
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

  const mutation = useMutation({
    mutationFn: (data: InventoryItemForm) => apiRequest("POST", `/api/characters/${characterId}/inventory`, data),
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
        <Button variant="outline" className="ml-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Přidat předmět
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Přidat nový předmět do inventáře</DialogTitle>
          <DialogDescription>
            Vyplň informace o předmětu, který chceš přidat do inventáře postavy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyber typ předmětu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ITEM_TYPE_OPTIONS.map((option) => (
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

            <FormField
              control={form.control}
              name="item_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název předmětu (volitelný)</FormLabel>
                  <FormControl>
                    <Input placeholder="Např. Neviditelný plášť" {...field} />
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
                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                    <Textarea {...field} />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Množství</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={mutation.isPending}>
            Přidat do inventáře
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CharacterInventory() {
  const { characterId } = useParams();
  const id = characterId ? Number(characterId) : undefined;

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

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inventář postavy</h1>
      {id && <AddInventoryItemDialog characterId={id} />}
      <div className="mt-8">
        {isLoading ? (
          <div>Načítám inventář...</div>
        ) : error ? (
          <div className="text-red-500">Chyba při načítání inventáře.</div>
        ) : inventory.length === 0 ? (
          <div className="text-muted-foreground">Inventář je prázdný.</div>
        ) : (
          <ul className="space-y-4">
            {inventory.map((item) => (
              <li key={item.id} className="border rounded p-4 bg-card">
                <div className="font-semibold">{item.item_name || item.item_type}</div>
                {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span>Množství: {item.quantity}</span>
                  {item.price !== undefined && <span>Cena: {item.price} galeonů</span>}
                  {item.rarity && <span>Vzácnost: {item.rarity}</span>}
                </div>
                {item.notes && <div className="mt-2 text-xs text-muted-foreground">Poznámka: {item.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CharacterInventory;

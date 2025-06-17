"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
                    <Input type="number" {...field} />
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
                  <FormControl>
                    <Input placeholder="Např. vzácný, běžný..." {...field} />
                  </FormControl>
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

export default AddInventoryItemDialog;

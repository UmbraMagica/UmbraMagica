import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Spell } from "@shared/schema";

export default function AdminSpells() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    effect: "",
    category: "",
    type: "",
    targetType: "self" as "self" | "other" | "object"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: spells = [], isLoading } = useQuery({
    queryKey: ['/api/admin/spells'],
  });

  const initializeSpellsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/spells/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to initialize spells');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Základní kouzla byla inicializována a přidána ke všem postavám" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/spells'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se inicializovat kouzla", variant: "destructive" });
    },
  });

  const createSpellMutation = useMutation({
    mutationFn: async (spellData: typeof formData) => {
      const response = await fetch('/api/admin/spells', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spellData),
      });
      if (!response.ok) throw new Error('Failed to create spell');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Kouzlo bylo vytvořeno" });
      setIsCreating(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/spells'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se vytvořit kouzlo", variant: "destructive" });
    },
  });

  const updateSpellMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await fetch(`/api/admin/spells/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update spell');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Kouzlo bylo aktualizováno" });
      setEditingSpell(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/spells'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se aktualizovat kouzlo", variant: "destructive" });
    },
  });

  const deleteSpellMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/spells/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete spell');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Kouzlo bylo smazáno" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/spells'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se smazat kouzlo", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      effect: "",
      category: "",
      type: "",
      targetType: "self"
    });
  };

  const handleEdit = (spell: Spell) => {
    setEditingSpell(spell);
    setFormData({
      name: spell.name,
      description: spell.description,
      effect: spell.effect,
      category: spell.category,
      type: spell.type,
      targetType: spell.targetType as "self" | "other" | "object"
    });
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.effect || !formData.category || !formData.type) {
      toast({ title: "Chyba", description: "Vyplňte všechna povinná pole", variant: "destructive" });
      return;
    }

    if (editingSpell) {
      updateSpellMutation.mutate({ id: editingSpell.id, data: formData });
    } else {
      createSpellMutation.mutate(formData);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingSpell(null);
    resetForm();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Načítání kouzel...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wand2 className="h-8 w-8" />
          Správa kouzel
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => initializeSpellsMutation.mutate()}
            disabled={initializeSpellsMutation.isPending}
            variant="outline"
          >
            {initializeSpellsMutation.isPending ? "Inicializuji..." : "Inicializovat základní kouzla"}
          </Button>
          <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Přidat kouzlo
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingSpell ? "Upravit kouzlo" : "Nové kouzlo"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Název kouzla *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Lumos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategorie *</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Kouzelné formule"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Typ *</label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Základní"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cíl kouzla</label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value: "self" | "other" | "object") => 
                    setFormData({ ...formData, targetType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Sebe</SelectItem>
                    <SelectItem value="other">Jinou postavu</SelectItem>
                    <SelectItem value="object">Předmět</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Popis kouzla *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Krátký popis kouzla..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Efekt kouzla *</label>
              <Textarea
                value={formData.effect}
                onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                placeholder="Detailní popis efektu kouzla..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={createSpellMutation.isPending || updateSpellMutation.isPending}
              >
                {editingSpell ? "Aktualizovat" : "Vytvořit"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Zrušit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {spells.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Žádná kouzla nebyla nalezena.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klikněte na "Inicializovat základní kouzla" pro přidání tří základních kouzel.
              </p>
            </CardContent>
          </Card>
        ) : (
          spells.map((spell: Spell) => (
            <Card key={spell.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{spell.name}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {spell.category}
                      </span>
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {spell.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{spell.description}</p>
                    <p className="text-sm">{spell.effect}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cíl: {spell.targetType === "self" ? "Sebe" : spell.targetType === "other" ? "Jinou postavu" : "Předmět"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(spell)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm(`Opravdu chcete smazat kouzlo "${spell.name}"?`)) {
                          deleteSpellMutation.mutate(spell.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
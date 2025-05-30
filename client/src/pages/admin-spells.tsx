import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Wand2, ArrowLeft, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Spell } from "@shared/schema";
import { useLocation } from "wouter";

export default function AdminSpells() {
  const [isCreating, setIsCreating] = useState(false);
  const [isQuickAdd, setIsQuickAdd] = useState(false);
  const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    effect: "",
    category: "",
    type: "",
    targetType: "self" as "self" | "other" | "object"
  });

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Predefined categories and types
  const categories = [
    "Kouzelné formule",
    "Přeměňování", 
    "Kletby",
    "Obranná kouzla",
    "Léčitelská kouzla",
    "Útočná kouzla"
  ];

  const types = [
    "Základní",
    "Pokročilé", 
    "Mistrovské"
  ];

  const { data: spells = [], isLoading } = useQuery<Spell[]>({
    queryKey: ['/api/admin/spells'],
  });

  // Filtered spells based on search and filters
  const filteredSpells = useMemo(() => {
    return spells.filter(spell => {
      const matchesSearch = searchTerm === "" || 
        spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        spell.effect.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || spell.category === categoryFilter;
      const matchesType = typeFilter === "all" || spell.type === typeFilter;
      const matchesTarget = targetFilter === "all" || spell.targetType === targetFilter;

      return matchesSearch && matchesCategory && matchesType && matchesTarget;
    });
  }, [spells, searchTerm, categoryFilter, typeFilter, targetFilter]);

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
    setIsQuickAdd(false); // Při editaci vždy používáme podrobnou formu
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
    setIsQuickAdd(false);
    resetForm();
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Načítání kouzel...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setLocation('/admin')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět do administrace
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="h-8 w-8" />
            Správa kouzel
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => initializeSpellsMutation.mutate()}
            disabled={initializeSpellsMutation.isPending}
            variant="outline"
            size="sm"
          >
            {initializeSpellsMutation.isPending ? "Inicializuji..." : "Inicializovat základní kouzla"}
          </Button>
          <Button 
            onClick={() => {
              setIsQuickAdd(true);
              setIsCreating(true);
              setFormData({
                name: "",
                description: "",
                effect: "",
                category: "Kouzelné formule",
                type: "Základní",
                targetType: "self"
              });
            }} 
            disabled={isCreating}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Rychlé přidání
          </Button>
          <Button 
            onClick={() => {
              setIsQuickAdd(false);
              setIsCreating(true);
            }} 
            disabled={isCreating}
            variant="outline"
            size="sm"
          >
            Podrobné přidání
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrování a vyhledávání
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Vyhledat kouzla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Všechny kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny kategorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Všechny typy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny typy</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Všechny cíle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny cíle</SelectItem>
                <SelectItem value="self">Sebe</SelectItem>
                <SelectItem value="other">Jinou postavu</SelectItem>
                <SelectItem value="object">Předmět</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Zobrazeno {filteredSpells.length} z {spells.length} kouzel
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("all");
                setTypeFilter("all");
                setTargetFilter("all");
              }}
            >
              Vymazat filtry
            </Button>
          </div>
        </CardContent>
      </Card>

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingSpell ? "Upravit kouzlo" : isQuickAdd ? "Rychlé přidání kouzla" : "Nové kouzlo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isQuickAdd ? (
              // Rychlá forma - pouze základní pole
              <>
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
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Typ *</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <label className="block text-sm font-medium mb-1">Popis a efekt kouzla *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      description: e.target.value,
                      effect: e.target.value // Pro rychlé přidání použijeme stejný text
                    })}
                    placeholder="Popis kouzla a jeho efektu..."
                    rows={3}
                  />
                </div>
              </>
            ) : (
              // Podrobná forma - všechna pole
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Název kouzla *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Lumos"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Kategorie *</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte kategorii" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Typ *</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte typ" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
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
              </>
            )}
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

      {/* Spells Table */}
      <Card>
        <CardHeader>
          <CardTitle>Seznam kouzel</CardTitle>
        </CardHeader>
        <CardContent>
          {spells.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Žádná kouzla nebyla nalezena.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klikněte na "Inicializovat základní kouzla" pro přidání tří základních kouzel.
              </p>
            </div>
          ) : filteredSpells.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Žádná kouzla nevyhovují zadaným filtrům.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Zkuste upravit vyhledávací kritéria nebo vymazat filtry.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Název</TableHead>
                    <TableHead className="w-[150px]">Kategorie</TableHead>
                    <TableHead className="w-[120px]">Typ</TableHead>
                    <TableHead className="w-[100px]">Cíl</TableHead>
                    <TableHead>Popis</TableHead>
                    <TableHead>Efekt</TableHead>
                    <TableHead className="w-[120px]">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpells.map((spell) => (
                    <TableRow key={spell.id}>
                      <TableCell className="font-medium">{spell.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {spell.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {spell.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {spell.targetType === "self" ? "Sebe" : 
                         spell.targetType === "other" ? "Jinou postavu" : "Předmět"}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate text-sm text-muted-foreground" title={spell.description}>
                          {spell.description}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate text-sm" title={spell.effect}>
                          {spell.effect}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(spell)}
                            className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Wand2, ArrowLeft, Search, Filter, Upload, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Spell } from "@shared/types";
import { useLocation } from "wouter";

export default function AdminSpells() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    effect: "",
    category: "",
    type: "",
    targetType: "self" as "self" | "other" | "object" | "both",
    isDefault: false
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
        spell.effect.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || spell.category === categoryFilter;
      const matchesType = typeFilter === "all" || spell.type === typeFilter;
      const matchesTarget = targetFilter === "all" || spell.targetType === targetFilter;

      return matchesSearch && matchesCategory && matchesType && matchesTarget;
    });
  }, [spells, searchTerm, categoryFilter, typeFilter, targetFilter]);

  const initializeSpellsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/spells/initialize`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/spells`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/spells/${id}`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/spells/${id}`, {
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

  const bulkImportMutation = useMutation({
    mutationFn: async (spellsData: Array<{name: string, effect: string, category: string, type: string, targetType: string}>) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/spells/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spells: spellsData }),
      });
      if (!response.ok) throw new Error('Failed to import spells');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Import dokončen", 
        description: `Úspěšně importováno ${data.imported} kouzel, ${data.skipped} přeskočeno`
      });
      setShowImport(false);
      setImportData("");
      queryClient.invalidateQueries({ queryKey: ['/api/admin/spells'] });
    },
    onError: () => {
      toast({ title: "Chyba", description: "Nepodařilo se importovat kouzla", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      effect: "",
      category: "",
      type: "",
      targetType: "self",
      isDefault: false
    });
  };

  const handleEdit = (spell: Spell) => {
    setEditingSpell(spell);
    setFormData({
      name: spell.name,
      effect: spell.effect,
      category: spell.category,
      type: spell.type,
      targetType: spell.targetType as "self" | "other" | "object" | "both",
      isDefault: spell.isDefault || false
    });
    setIsCreating(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.effect || !formData.category || !formData.type) {
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

  const handleBulkImport = () => {
    if (!importData.trim()) {
      toast({ title: "Chyba", description: "Zadejte data pro import", variant: "destructive" });
      return;
    }

    try {
      // Parse CSV/TSV data
      const lines = importData.trim().split('\n');
      const spellsData = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Support both comma and tab separation
        const parts = line.includes('\t') ? line.split('\t') : line.split(',');
        
        if (parts.length < 4) {
          toast({ 
            title: "Chyba formátu", 
            description: `Řádek ${i + 1}: Očekávány 4 sloupce (název, kategorie, typ, efekt)`, 
            variant: "destructive" 
          });
          return;
        }

        const [name, category, type, effect, targetType = "self"] = parts.map(p => p.trim().replace(/^["']|["']$/g, ''));

        // Validate category and type
        if (!categories.includes(category)) {
          toast({ 
            title: "Neplatná kategorie", 
            description: `Řádek ${i + 1}: "${category}" není platná kategorie`, 
            variant: "destructive" 
          });
          return;
        }

        if (!types.includes(type)) {
          toast({ 
            title: "Neplatný typ", 
            description: `Řádek ${i + 1}: "${type}" není platný typ`, 
            variant: "destructive" 
          });
          return;
        }

        spellsData.push({
          name,
          effect,
          category,
          type,
          targetType: targetType as "self" | "other" | "object" | "both"
        });
      }

      if (spellsData.length === 0) {
        toast({ title: "Chyba", description: "Žádná data k importu", variant: "destructive" });
        return;
      }

      bulkImportMutation.mutate(spellsData);
    } catch (error) {
      toast({ title: "Chyba zpracování", description: "Nepodařilo se zpracovat data", variant: "destructive" });
    }
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
            onClick={() => setShowImport(true)}
            disabled={showImport}
            variant="outline"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Hromadný import
          </Button>
          <Button 
            onClick={() => {
              setIsCreating(true);
              setFormData({
                name: "",
                effect: "",
                category: "Kouzelné formule",
                type: "Základní",
                targetType: "self",
                isDefault: false
              });
            }} 
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Přidat kouzlo
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
                <SelectItem value="both">Sebe i jinou postavu</SelectItem>
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

      {/* Bulk Import */}
      {showImport && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hromadný import kouzel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Formát dat:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Zadejte data oddelená čárkami nebo tabulátory. Každý řádek představuje jedno kouzlo.
              </p>
              <p className="text-xs font-mono bg-background p-2 rounded border">
                Název,Kategorie,Typ,Efekt[,Cíl]
              </p>
              <div className="text-xs text-muted-foreground mt-2">
                <p><strong>Kategorie:</strong> {categories.join(", ")}</p>
                <p><strong>Typ:</strong> {types.join(", ")}</p>
                <p><strong>Cíl (volitelný):</strong> self, other, object, both (výchozí: self)</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data kouzel</label>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Lumos,Kouzelné formule,Základní,Rozsvítí konec hůlky jako svítilnu,self
Nox,Kouzelné formule,Základní,Zhasne světlo vyvolané kouzlem Lumos,self"
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleBulkImport}
                disabled={bulkImportMutation.isPending}
              >
                {bulkImportMutation.isPending ? "Importuji..." : "Importovat kouzla"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImport(false);
                  setImportData("");
                }}
              >
                Zrušit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isCreating && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingSpell ? "Upravit kouzlo" : "Nové kouzlo"}
            </CardTitle>
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
                <label className="block text-sm font-medium mb-1">Cíl kouzla</label>
                <Select
                  value={formData.targetType}
                  onValueChange={(value: "self" | "other" | "object" | "both") => 
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
                    <SelectItem value="both">Sebe i jinou postavu</SelectItem>
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
              <label className="block text-sm font-medium mb-1">Efekt kouzla *</label>
              <Textarea
                value={formData.effect}
                onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                placeholder="Popis efektu kouzla..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="default"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: !!checked })}
              />
              <label htmlFor="default" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Výchozí kouzlo (automaticky přiděleno novým postavám)
              </label>
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
                    <TableHead className="w-[140px]">Cíl</TableHead>
                    <TableHead className="w-[100px]">Default</TableHead>
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
                         spell.targetType === "other" ? "Jinou postavu" : 
                         spell.targetType === "both" ? "Sebe i jinou postavu" : "Předmět"}
                      </TableCell>
                      <TableCell>
                        {spell.isDefault ? (
                          <Badge variant="default" className="text-xs bg-green-500 text-white">
                            Ano
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Ne
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
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
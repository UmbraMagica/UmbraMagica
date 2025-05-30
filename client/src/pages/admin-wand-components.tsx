import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Plus, Save, Trash2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminWandComponents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingWood, setEditingWood] = useState<any | null>(null);
  const [editingCore, setEditingCore] = useState<any | null>(null);
  const [editingLength, setEditingLength] = useState<string | null>(null);
  const [editingFlex, setEditingFlex] = useState<string | null>(null);
  
  const [newWood, setNewWood] = useState({ name: "", description: "" });
  const [newCore, setNewCore] = useState({ name: "", category: "", description: "" });
  const [newLength, setNewLength] = useState("");
  const [newFlex, setNewFlex] = useState("");

  // Get wand components
  const { data: wandComponents, isLoading } = useQuery({
    queryKey: ['/api/wand-components']
  });

  // Save components mutation
  const saveComponentsMutation = useMutation({
    mutationFn: async (components: any) => {
      const response = await apiRequest("PUT", "/api/admin/wand-components", components);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Úspěch",
        description: "Komponenty hůlek byly aktualizovány"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wand-components'] });
      // Reset editing states
      setEditingWood(null);
      setEditingCore(null);
      setEditingLength(null);
      setEditingFlex(null);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat komponenty",
        variant: "destructive"
      });
    }
  });

  const handleSaveWoods = () => {
    if (!wandComponents) return;
    const updatedComponents = { ...wandComponents };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const handleSaveCores = () => {
    if (!wandComponents) return;
    const updatedComponents = { ...wandComponents };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const handleSaveLengths = () => {
    if (!wandComponents) return;
    const updatedComponents = { ...wandComponents };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const handleSaveFlexibilities = () => {
    if (!wandComponents) return;
    const updatedComponents = { ...wandComponents };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const addWood = () => {
    if (!newWood.name.trim() || !newWood.description.trim() || !wandComponents) return;
    const updatedWoods = [...wandComponents.woods, { name: newWood.name.trim(), description: newWood.description.trim() }];
    const updatedComponents = { ...wandComponents, woods: updatedWoods };
    saveComponentsMutation.mutate(updatedComponents);
    setNewWood({ name: "", description: "" });
  };

  const removeWood = (woodToRemove: any) => {
    if (!wandComponents) return;
    const updatedWoods = wandComponents.woods.filter((wood: any) => wood.name !== woodToRemove.name);
    const updatedComponents = { ...wandComponents, woods: updatedWoods };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const addCore = () => {
    if (!newCore.name.trim() || !newCore.category.trim() || !newCore.description.trim() || !wandComponents) return;
    const updatedCores = [...wandComponents.cores, { ...newCore }];
    const updatedComponents = { ...wandComponents, cores: updatedCores };
    saveComponentsMutation.mutate(updatedComponents);
    setNewCore({ name: "", category: "", description: "" });
  };

  const removeCore = (coreToRemove: any) => {
    if (!wandComponents) return;
    const updatedCores = wandComponents.cores.filter((core: any) => core.name !== coreToRemove.name);
    const updatedComponents = { ...wandComponents, cores: updatedCores };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const updateCore = (index: number, updatedCore: any) => {
    if (!wandComponents) return;
    const updatedCores = [...wandComponents.cores];
    updatedCores[index] = updatedCore;
    const updatedComponents = { ...wandComponents, cores: updatedCores };
    saveComponentsMutation.mutate(updatedComponents);
    setEditingCore(null);
  };

  const updateWood = (index: number, updatedWood: any) => {
    if (!wandComponents) return;
    const updatedWoods = [...wandComponents.woods];
    updatedWoods[index] = updatedWood;
    const updatedComponents = { ...wandComponents, woods: updatedWoods };
    saveComponentsMutation.mutate(updatedComponents);
    setEditingWood(null);
  };

  const updateLength = (index: number, newLength: string) => {
    if (!wandComponents || !newLength.trim()) return;
    const updatedLengths = [...wandComponents.lengths];
    updatedLengths[index] = newLength.trim();
    const updatedComponents = { ...wandComponents, lengths: updatedLengths };
    saveComponentsMutation.mutate(updatedComponents);
    setEditingLength(null);
  };

  const updateFlex = (index: number, newFlex: string) => {
    if (!wandComponents || !newFlex.trim()) return;
    const updatedFlexes = [...wandComponents.flexibilities];
    updatedFlexes[index] = newFlex.trim();
    const updatedComponents = { ...wandComponents, flexibilities: updatedFlexes };
    saveComponentsMutation.mutate(updatedComponents);
    setEditingFlex(null);
  };

  const addLength = () => {
    if (!newLength.trim() || !wandComponents) return;
    const updatedLengths = [...wandComponents.lengths, newLength.trim()];
    const updatedComponents = { ...wandComponents, lengths: updatedLengths };
    saveComponentsMutation.mutate(updatedComponents);
    setNewLength("");
  };

  const removeLength = (lengthToRemove: string) => {
    if (!wandComponents) return;
    const updatedLengths = wandComponents.lengths.filter((length: string) => length !== lengthToRemove);
    const updatedComponents = { ...wandComponents, lengths: updatedLengths };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const addFlex = () => {
    if (!newFlex.trim() || !wandComponents) return;
    const updatedFlexes = [...wandComponents.flexibilities, newFlex.trim()];
    const updatedComponents = { ...wandComponents, flexibilities: updatedFlexes };
    saveComponentsMutation.mutate(updatedComponents);
    setNewFlex("");
  };

  const removeFlex = (flexToRemove: string) => {
    if (!wandComponents) return;
    const updatedFlexes = wandComponents.flexibilities.filter((flex: string) => flex !== flexToRemove);
    const updatedComponents = { ...wandComponents, flexibilities: updatedFlexes };
    saveComponentsMutation.mutate(updatedComponents);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Načítání komponent hůlek...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/admin')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zpět do administrace
        </Button>
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Správa komponent hůlek</h1>
        </div>
      </div>

      <Tabs defaultValue="woods" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="woods">Dřevo</TabsTrigger>
          <TabsTrigger value="cores">Jádra</TabsTrigger>
          <TabsTrigger value="lengths">Délky</TabsTrigger>
          <TabsTrigger value="flexibilities">Ohebnost</TabsTrigger>
        </TabsList>

        <TabsContent value="woods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typy dřeva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new wood */}
              <div className="grid gap-3">
                <Input
                  placeholder="Název dřeva..."
                  value={newWood.name}
                  onChange={(e) => setNewWood(prev => ({ ...prev, name: e.target.value }))}
                />
                <Textarea
                  placeholder="Popis vlastností a účinků dřeva..."
                  value={newWood.description}
                  onChange={(e) => setNewWood(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
                <Button 
                  onClick={addWood} 
                  disabled={!newWood.name.trim() || !newWood.description.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat dřevo
                </Button>
              </div>

              {/* Woods list */}
              <div className="grid gap-4">
                {wandComponents?.woods?.map((wood: any, index: number) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{wood.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{wood.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upravit dřevo</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                              <div>
                                <Label>Název</Label>
                                <Input
                                  defaultValue={wood.name}
                                  onChange={(e) => setEditingWood(prev => ({ ...(prev || wood), name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Popis</Label>
                                <Textarea
                                  defaultValue={wood.description}
                                  onChange={(e) => setEditingWood(prev => ({ ...(prev || wood), description: e.target.value }))}
                                  rows={4}
                                />
                              </div>
                              <Button 
                                onClick={() => updateWood(index, editingWood || wood)}
                                disabled={saveComponentsMutation.isPending}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Uložit změny
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeWood(wood)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jádra hůlek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new core */}
              <div className="grid gap-3">
                <Input
                  placeholder="Název jádra..."
                  value={newCore.name}
                  onChange={(e) => setNewCore(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Kategorie (např. Základní, Rostlinné...)..."
                  value={newCore.category}
                  onChange={(e) => setNewCore(prev => ({ ...prev, category: e.target.value }))}
                />
                <Textarea
                  placeholder="Popis účinků a vlastností..."
                  value={newCore.description}
                  onChange={(e) => setNewCore(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
                <Button 
                  onClick={addCore} 
                  disabled={!newCore.name.trim() || !newCore.category.trim() || !newCore.description.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat jádro
                </Button>
              </div>

              {/* Cores list */}
              <div className="grid gap-4">
                {wandComponents?.cores?.map((core: any, index: number) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{core.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{core.category}</p>
                        <p className="text-sm">{core.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Upravit jádro</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-3">
                              <div>
                                <Label>Název</Label>
                                <Input
                                  defaultValue={core.name}
                                  onChange={(e) => setEditingCore({ ...core, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Kategorie</Label>
                                <Input
                                  defaultValue={core.category}
                                  onChange={(e) => setEditingCore({ ...core, category: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Popis</Label>
                                <Textarea
                                  defaultValue={core.description}
                                  onChange={(e) => setEditingCore({ ...core, description: e.target.value })}
                                  rows={4}
                                />
                              </div>
                              <Button 
                                onClick={() => updateCore(index, editingCore || core)}
                                disabled={saveComponentsMutation.isPending}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Uložit změny
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeCore(core)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lengths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Délky hůlek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new length */}
              <div className="flex gap-2">
                <Input
                  placeholder="Délka (např. 17&quot;)..."
                  value={newLength}
                  onChange={(e) => setNewLength(e.target.value)}
                />
                <Button onClick={addLength} disabled={!newLength.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat
                </Button>
              </div>

              {/* Lengths list */}
              <div className="grid gap-2">
                {wandComponents?.lengths?.map((length: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    {editingLength === length ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          defaultValue={length}
                          onBlur={(e) => updateLength(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateLength(index, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingLength(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLength(null)}
                        >
                          Zrušit
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{length}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLength(length)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLength(length)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flexibilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ohebnost hůlek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new flexibility */}
              <div className="flex gap-2">
                <Input
                  placeholder="Typ ohebnosti..."
                  value={newFlex}
                  onChange={(e) => setNewFlex(e.target.value)}
                />
                <Button onClick={addFlex} disabled={!newFlex.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat
                </Button>
              </div>

              {/* Flexibilities list */}
              <div className="grid gap-2">
                {wandComponents?.flexibilities?.map((flex: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    {editingFlex === flex ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          defaultValue={flex}
                          onBlur={(e) => updateFlex(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateFlex(index, e.currentTarget.value);
                            } else if (e.key === 'Escape') {
                              setEditingFlex(null);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFlex(null)}
                        >
                          Zrušit
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{flex}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFlex(flex)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeFlex(flex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
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
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AdminWandComponents() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load saved active tab from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('admin-wand-active-tab') || 'woods';
  });
  
  const [editingWood, setEditingWood] = useState<any | null>(null);
  const [editingCore, setEditingCore] = useState<any | null>(null);
  const [editingLength, setEditingLength] = useState<any | null>(null);
  const [editingFlex, setEditingFlex] = useState<any | null>(null);
  
  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin-wand-active-tab', activeTab);
  }, [activeTab]);
  
  const [editingLengthName, setEditingLengthName] = useState("");
  const [editingLengthDescription, setEditingLengthDescription] = useState("");
  const [editingFlexName, setEditingFlexName] = useState("");
  const [editingFlexDescription, setEditingFlexDescription] = useState("");
  
  const [newWood, setNewWood] = useState({ name: "", shortDescription: "", longDescription: "" });
  const [newCore, setNewCore] = useState({ name: "", category: "", description: "" });
  const [newLength, setNewLength] = useState({ name: "", description: "" });
  const [newFlex, setNewFlex] = useState({ name: "", description: "" });

  // Get wand components
  const { data: wandComponents, isLoading } = useQuery({
    queryKey: ['/api/wand-components']
  });

  // Save components mutation
  const saveComponentsMutation = useMutation({
    mutationFn: async (components: any) => {
      const response = await apiRequest("PUT", `${API_URL}/api/admin/wand-components`, components);
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
    if (!newWood.name.trim() || !newWood.shortDescription.trim() || !newWood.longDescription.trim() || !wandComponents) return;
    const updatedWoods = [...wandComponents.woods, { 
      name: newWood.name.trim(), 
      shortDescription: newWood.shortDescription.trim(),
      longDescription: newWood.longDescription.trim()
    }];
    const updatedComponents = { ...wandComponents, woods: updatedWoods };
    saveComponentsMutation.mutate(updatedComponents);
    setNewWood({ name: "", shortDescription: "", longDescription: "" });
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

  const updateLength = (index: number, updatedLength: any) => {
    if (!wandComponents) return;
    const updatedLengths = [...wandComponents.lengths];
    updatedLengths[index] = updatedLength;
    const updatedComponents = { ...wandComponents, lengths: updatedLengths };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const updateFlex = (index: number, updatedFlex: any) => {
    if (!wandComponents) return;
    const updatedFlexes = [...wandComponents.flexibilities];
    updatedFlexes[index] = updatedFlex;
    const updatedComponents = { ...wandComponents, flexibilities: updatedFlexes };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const addLength = () => {
    if (!newLength.name.trim() || !wandComponents) return;
    const updatedLengths = [...wandComponents.lengths, {
      name: newLength.name.trim(),
      description: newLength.description.trim()
    }];
    const updatedComponents = { ...wandComponents, lengths: updatedLengths };
    saveComponentsMutation.mutate(updatedComponents);
    setNewLength({ name: "", description: "" });
  };

  const removeLength = (lengthToRemove: any) => {
    if (!wandComponents) return;
    const updatedLengths = wandComponents.lengths.filter((length: any) => length !== lengthToRemove);
    const updatedComponents = { ...wandComponents, lengths: updatedLengths };
    saveComponentsMutation.mutate(updatedComponents);
  };

  const addFlex = () => {
    if (!newFlex.name.trim() || !wandComponents) return;
    const updatedFlexes = [...wandComponents.flexibilities, {
      name: newFlex.name.trim(),
      description: newFlex.description.trim()
    }];
    const updatedComponents = { ...wandComponents, flexibilities: updatedFlexes };
    saveComponentsMutation.mutate(updatedComponents);
    setNewFlex({ name: "", description: "" });
  };

  const removeFlex = (flexToRemove: any) => {
    if (!wandComponents) return;
    const updatedFlexes = wandComponents.flexibilities.filter((flex: any) => flex !== flexToRemove);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  placeholder="Krátký popis (zobrazuje se v selectu)..."
                  value={newWood.shortDescription}
                  onChange={(e) => setNewWood(prev => ({ ...prev, shortDescription: e.target.value }))}
                  rows={2}
                />
                <Textarea
                  placeholder="Dlouhý popis (podrobné informace o vlastnostech)..."
                  value={newWood.longDescription}
                  onChange={(e) => setNewWood(prev => ({ ...prev, longDescription: e.target.value }))}
                  rows={4}
                />
                <Button 
                  onClick={addWood} 
                  disabled={!newWood.name.trim() || !newWood.shortDescription.trim() || !newWood.longDescription.trim()}
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{wood.name}</h3>
                          {wood.availableForRandom !== false && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Náhodný výběr</span>
                          )}
                          {wood.availableForRandom === false && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Zakázáno</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{wood.shortDescription}</p>
                        <p className="text-xs text-muted-foreground mt-2">{wood.longDescription}</p>
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
                                <Label>Krátký popis</Label>
                                <Textarea
                                  defaultValue={wood.shortDescription}
                                  onChange={(e) => setEditingWood(prev => ({ ...(prev || wood), shortDescription: e.target.value }))}
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Label>Dlouhý popis</Label>
                                <Textarea
                                  defaultValue={wood.longDescription}
                                  onChange={(e) => setEditingWood(prev => ({ ...(prev || wood), longDescription: e.target.value }))}
                                  rows={4}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`wood-random-${index}`}
                                  defaultChecked={wood.availableForRandom !== false}
                                  onChange={(e) => setEditingWood(prev => ({ ...(prev || wood), availableForRandom: e.target.checked }))}
                                  className="rounded"
                                />
                                <Label htmlFor={`wood-random-${index}`}>Dostupné pro náhodný výběr</Label>
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{core.name}</h3>
                          {core.availableForRandom !== false && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Náhodný výběr</span>
                          )}
                          {core.availableForRandom === false && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Zakázáno</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{core.category}</p>
                        <p className="text-sm whitespace-pre-line">{core.description}</p>
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
                                  onChange={(e) => setEditingCore(prev => ({ ...(prev || core), name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Kategorie</Label>
                                <Input
                                  defaultValue={core.category}
                                  onChange={(e) => setEditingCore(prev => ({ ...(prev || core), category: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Popis</Label>
                                <Textarea
                                  defaultValue={core.description}
                                  onChange={(e) => setEditingCore(prev => ({ ...(prev || core), description: e.target.value }))}
                                  rows={4}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`core-random-${index}`}
                                  defaultChecked={core.availableForRandom !== false}
                                  onChange={(e) => setEditingCore(prev => ({ ...(prev || core), availableForRandom: e.target.checked }))}
                                  className="rounded"
                                />
                                <Label htmlFor={`core-random-${index}`}>Dostupné pro náhodný výběr</Label>
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
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium">Přidat novou délku</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Název délky (např. 17&quot;)..."
                    value={newLength.name}
                    onChange={(e) => setNewLength({...newLength, name: e.target.value})}
                  />
                  <Textarea
                    placeholder="Popis vlastností této délky..."
                    value={newLength.description}
                    onChange={(e) => setNewLength({...newLength, description: e.target.value})}
                    rows={2}
                  />
                  <Button onClick={addLength} disabled={!newLength.name.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat délku
                  </Button>
                </div>
              </div>

              {/* Lengths list */}
              <div className="grid gap-2">
                {wandComponents?.lengths?.map((length: any, index: number) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg">
                    {editingLength === length ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="length-name">Název délky</Label>
                          <Input
                            id="length-name"
                            defaultValue={typeof length === 'string' ? length : length.name}
                            onBlur={(e) => updateLength(index, { name: e.target.value, description: editingLengthDescription || (typeof length === 'object' ? length.description : '') })}
                            placeholder="Délka (např. 12&quot;)..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="length-description">Popis délky</Label>
                          <Textarea
                            id="length-description"
                            defaultValue={typeof length === 'object' ? length.description : ''}
                            onChange={(e) => setEditingLengthDescription(e.target.value)}
                            onBlur={(e) => updateLength(index, { name: editingLengthName || (typeof length === 'string' ? length : length.name), description: e.target.value })}
                            rows={3}
                            placeholder="Popis vlastností této délky..."
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`length-random-${index}`}
                            defaultChecked={typeof length === 'object' ? length.availableForRandom !== false : true}
                            onChange={(e) => updateLength(index, { 
                              name: editingLengthName || (typeof length === 'string' ? length : length.name), 
                              description: editingLengthDescription || (typeof length === 'object' ? length.description : ''),
                              availableForRandom: e.target.checked
                            })}
                            className="rounded"
                          />
                          <Label htmlFor={`length-random-${index}`}>Dostupné pro náhodný výběr</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingLength(null);
                              setEditingLengthName('');
                              setEditingLengthDescription('');
                            }}
                            size="sm"
                          >
                            Uložit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingLength(null);
                              setEditingLengthName('');
                              setEditingLengthDescription('');
                            }}
                            size="sm"
                          >
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{typeof length === 'string' ? length : length.name}</h3>
                            {(typeof length === 'string' || length.availableForRandom !== false) && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Náhodný výběr</span>
                            )}
                            {typeof length === 'object' && length.availableForRandom === false && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Zakázáno</span>
                            )}
                          </div>
                          {typeof length === 'object' && length.description && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{length.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingLength(length);
                              setEditingLengthName(typeof length === 'string' ? length : length.name);
                              setEditingLengthDescription(typeof length === 'object' ? length.description : '');
                            }}
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
                      </div>
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
              <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium">Přidat novou ohebnost</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Název ohebnosti (např. Středně ohebná)..."
                    value={newFlex.name}
                    onChange={(e) => setNewFlex({...newFlex, name: e.target.value})}
                  />
                  <Textarea
                    placeholder="Popis vlastností této ohebnosti..."
                    value={newFlex.description}
                    onChange={(e) => setNewFlex({...newFlex, description: e.target.value})}
                    rows={2}
                  />
                  <Button onClick={addFlex} disabled={!newFlex.name.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat ohebnost
                  </Button>
                </div>
              </div>

              {/* Flexibilities list */}
              <div className="grid gap-2">
                {wandComponents?.flexibilities?.map((flex: any, index: number) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg">
                    {editingFlex === flex ? (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="flex-name">Název ohebnosti</Label>
                          <Input
                            id="flex-name"
                            defaultValue={typeof flex === 'string' ? flex : flex.name}
                            onBlur={(e) => updateFlex(index, { name: e.target.value, description: editingFlexDescription || (typeof flex === 'object' ? flex.description : '') })}
                            placeholder="Ohebnost (např. Pevná)..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="flex-description">Popis ohebnosti</Label>
                          <Textarea
                            id="flex-description"
                            defaultValue={typeof flex === 'object' ? flex.description : ''}
                            onChange={(e) => setEditingFlexDescription(e.target.value)}
                            onBlur={(e) => updateFlex(index, { name: editingFlexName || (typeof flex === 'string' ? flex : flex.name), description: e.target.value })}
                            rows={3}
                            placeholder="Popis vlastností této ohebnosti..."
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`flex-random-${index}`}
                            defaultChecked={typeof flex === 'object' ? flex.availableForRandom !== false : true}
                            onChange={(e) => updateFlex(index, { 
                              name: editingFlexName || (typeof flex === 'string' ? flex : flex.name), 
                              description: editingFlexDescription || (typeof flex === 'object' ? flex.description : ''),
                              availableForRandom: e.target.checked
                            })}
                            className="rounded"
                          />
                          <Label htmlFor={`flex-random-${index}`}>Dostupné pro náhodný výběr</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setEditingFlex(null);
                              setEditingFlexName('');
                              setEditingFlexDescription('');
                            }}
                            size="sm"
                          >
                            Uložit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingFlex(null);
                              setEditingFlexName('');
                              setEditingFlexDescription('');
                            }}
                            size="sm"
                          >
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{typeof flex === 'string' ? flex : flex.name}</h3>
                            {(typeof flex === 'string' || flex.availableForRandom !== false) && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Náhodný výběr</span>
                            )}
                            {typeof flex === 'object' && flex.availableForRandom === false && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Zakázáno</span>
                            )}
                          </div>
                          {typeof flex === 'object' && flex.description && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{flex.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingFlex(flex);
                              setEditingFlexName(typeof flex === 'string' ? flex : flex.name);
                              setEditingFlexDescription(typeof flex === 'object' ? flex.description : '');
                            }}
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Copyright notice */}
      <div className="mt-8 p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <p className="mb-2">
          <strong>Originální text od J.K. Rowlingové.</strong>
        </p>
        <p className="mb-2">
          Zdroj textu v původním jazyce a náhledového obrázku:{" "}
          <a 
            href="https://www.pottermore.com/writing-by-jk-rowling/wand-woods" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            https://www.pottermore.com/writing-by-jk-rowling/wand-woods
          </a>
        </p>
        <p>
          Duševní vlastnictví překladů vlastních jmen, názvů a pojmů patří pánům Pavlu a Vladimíru Medkovým.
        </p>
      </div>
    </div>
  );
}
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Settings, Droplet, Wrench, X, Check } from 'lucide-react'
import {
  getAllCocktails,
  makeCocktail,
  deleteRecipe,
  getCocktailMachineConfig,
  saveCocktailMachineConfig,
} from "@/lib/cocktail-machine"
import type { Cocktail, CocktailMachineConfig } from "@/types/cocktail"
import { useToast } from "@/components/ui/use-toast"
import RecipeCreator from "@/components/recipe-creator"
import RecipeEditor from "@/components/recipe-editor"
import DeleteConfirmation from "@/components/delete-confirmation"
import PasswordModal from "@/components/password-modal"
import { ingredients } from "@/data/ingredients"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import PumpCleaning from "@/components/pump-cleaning"
import CocktailCard from "@/components/cocktail-card"

export default function Home() {
  const [cocktails, setCocktails] = useState<Cocktail[]>([])
  const [selectedCocktail, setSelectedCocktail] = useState<Cocktail | null>(null)
  const [isMakingCocktail, setIsMakingCocktail] = useState(false)
  const [makeProgress, setMakeProgress] = useState(0)
  const [makeStatus, setMakeStatus] = useState("")
  const [isRecipeCreatorOpen, setIsRecipeCreatorOpen] = useState(false)
  const [isRecipeEditorOpen, setIsRecipeEditorOpen] = useState(false)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [cocktailToDelete, setCocktailToDelete] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordModalPurpose, setPasswordModalPurpose] = useState<"settings" | "delete" | null>(null)
  const [config, setConfig] = useState<CocktailMachineConfig | null>(null)
  const [isPumpCleaningOpen, setIsPumpCleaningOpen] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadCocktails()
    loadConfig()
  }, [])

  const loadCocktails = async () => {
    try {
      const data = await getAllCocktails()
      setCocktails(data)
    } catch (error) {
      console.error("Fehler beim Laden der Cocktails:", error)
      toast({
        title: "Fehler",
        description: "Cocktails konnten nicht geladen werden.",
        variant: "destructive",
      })
    }
  }

  const loadConfig = async () => {
    try {
      const machineConfig = await getCocktailMachineConfig()
      setConfig(machineConfig)
    } catch (error) {
      console.error("Fehler beim Laden der Konfiguration:", error)
      toast({
        title: "Fehler",
        description: "Konfiguration konnte nicht geladen werden.",
        variant: "destructive",
      })
    }
  }

  const handleMakeCocktail = async (cocktail: Cocktail) => {
    if (isMakingCocktail) return

    // Check if there are any automatic ingredients
    const hasAutomaticIngredients = cocktail.recipe && cocktail.recipe.length > 0;

    if (!hasAutomaticIngredients) {
      toast({
        title: "Manuelles Rezept",
        description: "Dieses Rezept enthält nur manuelle Zutaten und muss von Hand zubereitet werden.",
        variant: "default",
      });
      return;
    }

    // Check ingredient availability for automatic ingredients
    const missingIngredients = checkIngredientsAvailable(cocktail);
    if (missingIngredients.length > 0) {
      toast({
        title: "Zutaten fehlen",
        description: `Es fehlen folgende Zutaten: ${missingIngredients.map(ing => ing.name).join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedCocktail(cocktail)
    setIsMakingCocktail(true)
    setMakeProgress(0)
    setMakeStatus("Startet...")

    try {
      const result = await makeCocktail(cocktail, (progress, status) => {
        setMakeProgress(progress)
        setMakeStatus(status)
      })

      if (result.success) {
        toast({
          title: "Erfolg!",
          description: `${cocktail.name} wurde zubereitet!`,
        })
      } else {
        toast({
          title: "Fehler",
          description: `Fehler bei der Zubereitung von ${cocktail.name}: ${result.message}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fehler beim Zubereiten des Cocktails:", error)
      toast({
        title: "Fehler",
        description: `Ein unerwarteter Fehler ist aufgetreten.`,
        variant: "destructive",
      })
    } finally {
      setIsMakingCocktail(false)
      setSelectedCocktail(null)
      setMakeProgress(0)
      setMakeStatus("")
    }
  }

  const handleSaveNewRecipe = (newCocktail: Cocktail) => {
    setCocktails((prev) => [...prev, newCocktail])
    setIsRecipeCreatorOpen(false)
    toast({
      title: "Erfolg!",
      description: `${newCocktail.name} wurde erstellt.`,
    })
  }

  const handleUpdateRecipe = (updatedCocktail: Cocktail) => {
    setCocktails((prev) =>
      prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)),
    )
    setIsRecipeEditorOpen(false)
    toast({
      title: "Erfolg!",
      description: `${updatedCocktail.name} wurde aktualisiert.`,
    })
  }

  const handleDeleteRequest = (cocktailId: string) => {
    setCocktailToDelete(cocktailId)
    setPasswordModalPurpose("delete")
    setIsPasswordModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!cocktailToDelete) return

    try {
      await deleteRecipe(cocktailToDelete)
      setCocktails((prev) => prev.filter((c) => c.id !== cocktailToDelete))
      toast({
        title: "Erfolg!",
        description: "Rezept wurde gelöscht.",
      })
    } catch (error) {
      console.error("Fehler beim Löschen des Rezepts:", error)
      toast({
        title: "Fehler",
        description: "Rezept konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    } finally {
      setCocktailToDelete(null)
      setIsDeleteConfirmationOpen(false)
      setIsPasswordModalOpen(false)
    }
  }

  const handlePasswordConfirm = (purpose: "settings" | "delete") => {
    setIsPasswordModalOpen(false)
    if (purpose === "settings") {
      setIsSettingsOpen(true)
    } else if (purpose === "delete") {
      setIsDeleteConfirmationOpen(true)
    }
  }

  const handleOpenSettings = () => {
    setPasswordModalPurpose("settings")
    setIsPasswordModalOpen(true)
  }

  const handleSaveConfig = async () => {
    if (!config) return
    try {
      await saveCocktailMachineConfig(config)
      toast({
        title: "Erfolg!",
        description: "Konfiguration gespeichert.",
      })
      setIsSettingsOpen(false)
    } catch (error) {
      console.error("Fehler beim Speichern der Konfiguration:", error)
      toast({
        title: "Fehler",
        description: "Konfiguration konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  const getCurrentVolume = (cocktail: Cocktail) => {
    let totalVolume = 0
    if (cocktail.recipe) {
      totalVolume += cocktail.recipe.reduce((sum, item) => sum + item.amount, 0)
    }
    if (cocktail.manualIngredients) {
      totalVolume += cocktail.manualIngredients.reduce((sum, item) => sum + item.amount, 0)
    }
    return totalVolume
  }

  const checkIngredientsAvailable = (cocktail: Cocktail) => {
    const missing: { id: string; name: string }[] = []
    if (cocktail.recipe) { // Only check automatic ingredients for availability
      cocktail.recipe.forEach((item) => {
        const ingredientConfig = config?.ingredients.find((i) => i.id === item.ingredientId)
        if (!ingredientConfig || ingredientConfig.currentLevel < item.amount) {
          missing.push({ id: item.ingredientId, name: getIngredientName(item.ingredientId) })
        }
      })
    }
    return missing
  }

  const getPumpName = (pumpId: string) => {
    return config?.pumps.find(p => p.id === pumpId)?.name || pumpId;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="flex items-center justify-between p-4 border-b border-[hsl(var(--cocktail-card-border))]">
        <h1 className="text-3xl font-bold text-[hsl(var(--cocktail-primary))]">CocktailBot</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsRecipeCreatorOpen(true)}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Neues Rezept
          </Button>
          <Button
            onClick={handleOpenSettings}
            variant="outline"
            className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto">
        {cocktails.map((cocktail) => (
          <CocktailCard
            key={cocktail.id}
            cocktail={cocktail}
            onMakeCocktail={handleMakeCocktail}
            onEditCocktail={() => {
              setSelectedCocktail(cocktail)
              setIsRecipeEditorOpen(true)
            }}
            onDeleteCocktail={handleDeleteRequest}
            isMakingCocktail={isMakingCocktail && selectedCocktail?.id === cocktail.id}
            makeProgress={selectedCocktail?.id === cocktail.id ? makeProgress : 0}
            makeStatus={selectedCocktail?.id === cocktail.id ? makeStatus : ""}
            currentVolume={getCurrentVolume(cocktail)}
            missingIngredients={checkIngredientsAvailable(cocktail)}
          />
        ))}
      </main>

      {/* Recipe Creator Dialog */}
      <RecipeCreator
        isOpen={isRecipeCreatorOpen}
        onClose={() => setIsRecipeCreatorOpen(false)}
        onSave={handleSaveNewRecipe}
      />

      {/* Recipe Editor Dialog */}
      <RecipeEditor
        isOpen={isRecipeEditorOpen}
        onClose={() => setIsRecipeEditorOpen(false)}
        cocktail={selectedCocktail}
        onSave={handleUpdateRecipe}
        onRequestDelete={handleDeleteRequest}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordConfirm}
        purpose={passwordModalPurpose}
      />

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Einstellungen</DialogTitle>
            <DialogDescription>Konfiguriere deine Cocktailmaschine.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 -mx-4">
            <div className="space-y-6 pr-4">
              {/* General Settings */}
              <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                <CardHeader>
                  <CardTitle className="text-white">Allgemein</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="machineName" className="text-white">Maschinenname</Label>
                    <Input
                      id="machineName"
                      value={config?.machineName || ""}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, machineName: e.target.value } : null)}
                      className="bg-white border-[hsl(var(--cocktail-card-border))] text-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flowRate" className="text-white">Durchflussrate (ml/s)</Label>
                    <Input
                      id="flowRate"
                      type="number"
                      value={config?.flowRate || 0}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, flowRate: parseFloat(e.target.value) } : null)}
                      className="bg-white border-[hsl(var(--cocktail-card-border))] text-black"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="kioskMode"
                      checked={config?.kioskMode || false}
                      onCheckedChange={(checked) => setConfig(prev => prev ? { ...prev, kioskMode: checked } : null)}
                      className="data-[state=checked]:bg-[hsl(var(--cocktail-primary))]"
                    />
                    <Label htmlFor="kioskMode" className="text-white">Kiosk-Modus aktivieren</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Pump Configuration */}
              <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                <CardHeader>
                  <CardTitle className="text-white">Pumpenkonfiguration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config?.pumps.map((pump, index) => (
                    <div key={pump.id} className="grid grid-cols-4 gap-4 items-center">
                      <Label htmlFor={`pumpName-${index}`} className="text-white">Pumpe {index + 1}</Label>
                      <Input
                        id={`pumpName-${index}`}
                        value={pump.name}
                        onChange={(e) => setConfig(prev => prev ? {
                          ...prev,
                          pumps: prev.pumps.map(p => p.id === pump.id ? { ...p, name: e.target.value } : p)
                        } : null)}
                        className="col-span-2 bg-white border-[hsl(var(--cocktail-card-border))] text-black"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setIsPumpCleaningOpen(true)}
                              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
                            >
                              <Droplet className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Pumpe reinigen</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ingredient Mapping */}
              <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                <CardHeader>
                  <CardTitle className="text-white">Zutatenzuweisung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config?.ingredients.map((ingredient, index) => (
                    <div key={ingredient.id} className="grid grid-cols-3 gap-4 items-center">
                      <Label htmlFor={`ingredient-${index}`} className="text-white">{ingredient.name}</Label>
                      <Select
                        value={ingredient.pumpId || ""}
                        onValueChange={(value) => setConfig(prev => prev ? {
                          ...prev,
                          ingredients: prev.ingredients.map(ing => ing.id === ingredient.id ? { ...ing, pumpId: value } : ing)
                        } : null)}
                      >
                        <SelectTrigger className="col-span-2 bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                          <SelectValue placeholder="Pumpe auswählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
                          {config?.pumps.map(pump => (
                            <SelectItem key={pump.id} value={pump.id} className="text-black hover:bg-gray-100 cursor-pointer">
                              {pump.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="" className="text-black hover:bg-gray-100 cursor-pointer">
                            (Keine Pumpe zugewiesen)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ingredient Levels */}
              <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                <CardHeader>
                  <CardTitle className="text-white">Zutatenfüllstände</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {config?.ingredients.map((ingredient, index) => (
                    <div key={ingredient.id} className="space-y-2">
                      <Label htmlFor={`level-${index}`} className="text-white flex justify-between">
                        <span>{ingredient.name}</span>
                        <span>{ingredient.currentLevel} ml / {ingredient.maxLevel} ml</span>
                      </Label>
                      <Slider
                        id={`level-${index}`}
                        min={0}
                        max={ingredient.maxLevel}
                        step={10}
                        value={[ingredient.currentLevel]}
                        onValueChange={(value) => setConfig(prev => prev ? {
                          ...prev,
                          ingredients: prev.ingredients.map(ing => ing.id === ingredient.id ? { ...ing, currentLevel: value[0] } : ing)
                        } : null)}
                        className="[&>span:first-child]:h-2 [&>span:first-child]:bg-[hsl(var(--cocktail-card-border))] [&>span:first-child>span]:bg-[hsl(var(--cocktail-primary))] [&>span:first-child>span]:text-black"
                        thumbClassName="[&>span]:bg-[hsl(var(--cocktail-primary))] [&>span]:text-black"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveConfig}
              className="bg-[#00ff00] text-black hover:bg-[#00cc00]"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pump Cleaning Dialog */}
      <PumpCleaning
        isOpen={isPumpCleaningOpen}
        onClose={() => setIsPumpCleaningOpen(false)}
        pumps={config?.pumps || []}
      />

      {/* Making Cocktail Progress Dialog */}
      <Dialog open={isMakingCocktail}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cocktail wird zubereitet...</DialogTitle>
            <DialogDescription>
              {selectedCocktail?.name} wird gemixt. Bitte warten.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <div className="relative w-24 h-24">
              <Loader2 className="absolute inset-0 h-full w-full animate-spin text-[hsl(var(--cocktail-primary))]" />
              <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {Math.round(makeProgress)}%
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-300">{makeStatus}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

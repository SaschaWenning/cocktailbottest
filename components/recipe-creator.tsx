"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea" // Import Textarea
import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients"
import { generateId } from "@/lib/utils"
import { Loader2, ImageIcon, Plus, Minus, FolderOpen, ArrowLeft, GripVertical } from 'lucide-react'
import VirtualKeyboard from "./virtual-keyboard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCocktail: Cocktail) => void
}

// Verfügbare Bilder im Projekt
const AVAILABLE_IMAGES = [
  { path: "/images/cocktails/bahama_mama.jpg", name: "Bahama Mama" },
  { path: "/images/cocktails/big_john.jpg", name: "Big John" },
  { path: "/images/cocktails/long_island_iced_tea.jpg", name: "Long Island Iced Tea" },
  { path: "/images/cocktails/mai_tai.jpg", name: "Mai Tai" },
  { path: "/images/cocktails/malibu_ananas.jpg", name: "Malibu Ananas" },
  { path: "/images/cocktails/malibu_colada.jpg", name: "Malibu Colada" },
  { path: "/images/cocktails/malibu_sunrise.jpg", name: "Malibu Sunrise" },
  { path: "/images/cocktails/malibu_sunset.jpg", name: "Malibu Sunset" },
  { path: "/images/cocktails/mojito.jpg", name: "Mojito" },
  { path: "/images/cocktails/passion_colada.jpg", name: "Passion Colada" },
  { path: "/images/cocktails/peaches_cream.jpg", name: "Peaches & Cream" },
  { path: "/images/cocktails/planters_punch.jpg", name: "Planters Punch" },
  { path: "/images/cocktails/sex_on_the_beach.jpg", name: "Sex on the Beach" },
  { path: "/images/cocktails/solero.jpg", name: "Solero" },
  { path: "/images/cocktails/swimming_pool.jpg", name: "Swimming Pool" },
  { path: "/images/cocktails/tequila_sunrise.jpg", name: "Tequila Sunrise" },
  { path: "/images/cocktails/touch_down.jpg", name: "Touch Down" },
  { path: "/images/cocktails/zombie.jpg", name: "Zombie" },
]

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([])
  const [manualIngredients, setManualIngredients] = useState<{ name: string; amount: number; instruction: string }[]>([])
  const [saving, setSaving] = useState(false)

  // View states for keyboard/image browser
  const [currentView, setCurrentView] = useState<"form" | "keyboard" | "imageBrowser">("form")
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened
      setName("")
      setDescription("")
      setImageUrl("")
      setAlcoholic(true)
      setRecipe([])
      setManualIngredients([])
      setSaving(false)
      setCurrentView("form")
      setActiveInput(null)
      setInputValue("")
    }
  }, [isOpen])

  // Keyboard handlers
  const handleInputFocus = (inputType: string, currentValue = "") => {
    setActiveInput(inputType)
    setInputValue(currentValue)
    setCurrentView("keyboard")
  }

  const handleKeyboardInput = (value: string) => {
    setInputValue(value)
  }

  const handleKeyboardConfirm = () => {
    if (!activeInput) return

    if (activeInput === "name") {
      setName(inputValue)
    } else if (activeInput === "description") {
      setDescription(inputValue)
    } else if (activeInput === "imageUrl") {
      setImageUrl(inputValue)
    } else if (activeInput.startsWith("amount-auto-")) {
      const index = Number.parseInt(activeInput.replace("amount-auto-", ""))
      const amount = Number.parseFloat(inputValue)
      if (!isNaN(amount) && amount >= 0) {
        handleAutomaticAmountChange(index, amount)
      }
    } else if (activeInput.startsWith("manual-name-")) {
      const index = Number.parseInt(activeInput.replace("manual-name-", ""))
      const updatedManual = [...manualIngredients]
      updatedManual[index] = { ...updatedManual[index], name: inputValue }
      setManualIngredients(updatedManual)
    } else if (activeInput.startsWith("manual-amount-")) {
      const index = Number.parseInt(activeInput.replace("manual-amount-", ""))
      const amount = Number.parseFloat(inputValue)
      if (!isNaN(amount) && amount >= 0) {
        const updatedManual = [...manualIngredients]
        updatedManual[index] = { ...updatedManual[index], amount }
        setManualIngredients(updatedManual)
      }
    } else if (activeInput.startsWith("manual-instruction-")) {
      const index = Number.parseInt(activeInput.replace("manual-instruction-", ""))
      const updatedManual = [...manualIngredients]
      updatedManual[index] = { ...updatedManual[index], instruction: inputValue }
      setManualIngredients(updatedManual)
    }

    setCurrentView("form")
    setActiveInput(null)
    setInputValue("")
  }

  const handleKeyboardCancel = () => {
    setCurrentView("form")
    setActiveInput(null)
    setInputValue("")
  }

  // Automatic recipe handlers
  const handleAutomaticAmountChange = (index: number, amount: number) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], amount }
    setRecipe(updatedRecipe)
  }

  const handleAutomaticIngredientChange = (index: number, ingredientId: string) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], ingredientId }
    setRecipe(updatedRecipe)
  }

  const addAutomaticIngredient = () => {
    const availableIngredients = ingredients.filter(
      (ingredient) => !recipe.some((item) => item.ingredientId === ingredient.id),
    )

    if (availableIngredients.length > 0) {
      setRecipe([...recipe, { ingredientId: availableIngredients[0].id, amount: 30 }])
    }
  }

  const removeAutomaticIngredient = (index: number) => {
    if (recipe.length > 0) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
  }

  // Manual recipe handlers
  const addManualIngredient = () => {
    setManualIngredients([...manualIngredients, { name: "", amount: 30, instruction: "" }])
  }

  const removeManualIngredient = (index: number) => {
    if (manualIngredients.length > 0) {
      const updatedManual = manualIngredients.filter((_, i) => i !== index)
      setManualIngredients(updatedManual)
    }
  }

  // Image browser handlers
  const handleSelectImage = (path: string) => {
    setImageUrl(path)
    setCurrentView("form")
  }

  // Save handler
  const handleSave = async () => {
    if (!name.trim() || (recipe.length === 0 && manualIngredients.length === 0)) {
      // Ensure at least one ingredient type is present
      return
    }

    setSaving(true)
    try {
      const newCocktail: Cocktail = {
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        image: imageUrl || "/placeholder.svg?height=200&width=400",
        alcoholic,
        recipe: recipe,
        manualIngredients: manualIngredients,
        ingredients: [
          ...recipe.map((item) => {
            const ingredient = ingredients.find((i) => i.id === item.ingredientId)
            return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
          }),
          ...manualIngredients.map((item) => `${item.amount}ml ${item.name} (manuell)`),
        ],
      }

      await onSave(newCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern des Rezepts:", error)
    } finally {
      setSaving(false)
    }
  }

  // Form View
  const renderFormView = () => (
    <div className="space-y-6 my-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Name des Cocktails
        </Label>
        <Input
          id="name"
          value={name}
          onClick={() => handleInputFocus("name", name)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="z.B. Mein Cocktail"
        />
      </div>

      {/* Beschreibung */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Beschreibung
        </Label>
        <Input
          id="description"
          value={description}
          onClick={() => handleInputFocus("description", description)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="Beschreibe deinen Cocktail..."
        />
      </div>

      {/* Alkoholisch */}
      <div className="space-y-2">
        <Label className="text-white">Typ</Label>
        <Select
          value={alcoholic ? "alcoholic" : "virgin"}
          onValueChange={(value) => setAlcoholic(value === "alcoholic")}
        >
          <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
            <SelectItem value="alcoholic" className="text-black hover:bg-gray-100 cursor-pointer">
              Mit Alkohol
            </SelectItem>
            <SelectItem value="virgin" className="text-black hover:bg-gray-100 cursor-pointer">
              Alkoholfrei
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bild */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-white">
          <ImageIcon className="h-4 w-4" />
          Bild (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onClick={() => handleInputFocus("imageUrl", imageUrl)}
            readOnly
            className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1"
            placeholder="Bild-URL oder aus Galerie wählen"
          />
          <Button
            type="button"
            onClick={() => setCurrentView("imageBrowser")}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zutaten Tabs */}
      <Tabs defaultValue="automatic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
          <TabsTrigger
            value="automatic"
            className="data-[state=active]:bg-[hsl(var(--cocktail-primary))] data-[state=active]:text-black text-white"
          >
            Automatische Zutaten
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="data-[state=active]:bg-[hsl(var(--cocktail-primary))] data-[state=active]:text-black text-white"
          >
            Manuelle Zutaten
          </TabsTrigger>
        </TabsList>
        <TabsContent value="automatic" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label className="text-white">Automatische Zutaten</Label>
            <Button
              type="button"
              size="sm"
              onClick={addAutomaticIngredient}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
              disabled={recipe.length >= ingredients.length}
            >
              <Plus className="h-4 w-4 mr-1" />
              Zutat hinzufügen
            </Button>
          </div>

          {recipe.length === 0 && (
            <p className="text-center text-gray-400">Füge automatische Zutaten hinzu, die von der Maschine gemischt werden.</p>
          )}

          {recipe.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center p-3 bg-[hsl(var(--cocktail-card-bg))] rounded-lg border border-[hsl(var(--cocktail-card-border))]"
            >
              <div className="col-span-6">
                <Select value={item.ingredientId} onValueChange={(value) => handleAutomaticIngredientChange(index, value)}>
                  <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))] max-h-48 overflow-y-auto">
                    {ingredients.map((ingredient) => (
                      <SelectItem
                        key={ingredient.id}
                        value={ingredient.id}
                        className="text-black hover:bg-gray-100 cursor-pointer"
                      >
                        {ingredient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Input
                  type="text"
                  value={item.amount}
                  onClick={() => handleInputFocus(`amount-auto-${index}`, item.amount.toString())}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer text-center"
                />
              </div>
              <div className="col-span-2 text-sm text-white">ml</div>
              <div className="col-span-1">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeAutomaticIngredient(index)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="manual" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <Label className="text-white">Manuelle Zutaten</Label>
            <Button
              type="button"
              size="sm"
              onClick={addManualIngredient}
              className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Zutat hinzufügen
            </Button>
          </div>

          {manualIngredients.length === 0 && (
            <p className="text-center text-gray-400">Füge manuelle Zutaten hinzu, die nach der Zubereitung hinzugefügt werden.</p>
          )}

          {manualIngredients.map((item, index) => (
            <div
              key={index}
              className="p-3 bg-[hsl(var(--cocktail-card-bg))] rounded-lg border border-[hsl(var(--cocktail-card-border))] space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label className="text-white">Zutat {index + 1}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeManualIngredient(index)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`manual-name-${index}`} className="text-white text-sm">Name</Label>
                <Input
                  id={`manual-name-${index}`}
                  value={item.name}
                  onClick={() => handleInputFocus(`manual-name-${index}`, item.name)}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                  placeholder="z.B. Eiswürfel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`manual-amount-${index}`} className="text-white text-sm">Menge (ml)</Label>
                <Input
                  id={`manual-amount-${index}`}
                  type="text"
                  value={item.amount}
                  onClick={() => handleInputFocus(`manual-amount-${index}`, item.amount.toString())}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
                  placeholder="z.B. 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`manual-instruction-${index}`} className="text-white text-sm">Anleitung</Label>
                <Textarea
                  id={`manual-instruction-${index}`}
                  value={item.instruction}
                  onClick={() => handleInputFocus(`manual-instruction-${index}`, item.instruction)}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer min-h-[60px]"
                  placeholder="z.B. Im Glas mit Eiswürfeln servieren"
                />
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )

  // Keyboard View
  const renderKeyboardView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleKeyboardCancel}
          className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">
          {activeInput === "name" && "Name eingeben"}
          {activeInput === "description" && "Beschreibung eingeben"}
          {activeInput === "imageUrl" && "Bild-URL eingeben"}
          {activeInput?.startsWith("amount-auto-") && "Menge eingeben (ml)"}
          {activeInput?.startsWith("manual-name-") && "Name der manuellen Zutat eingeben"}
          {activeInput?.startsWith("manual-amount-") && "Menge der manuellen Zutat eingeben (ml)"}
          {activeInput?.startsWith("manual-instruction-") && "Anleitung eingeben"}
        </h3>
      </div>

      <div className="bg-[hsl(var(--cocktail-card-bg))] border border-[hsl(var(--cocktail-card-border))] rounded-lg p-4">
        <Input
          value={inputValue}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black text-center text-lg"
          placeholder={
            activeInput === "name"
              ? "Cocktail-Name..."
              : activeInput === "description"
                ? "Beschreibung..."
                : activeInput === "imageUrl"
                  ? "https://..."
                  : activeInput?.startsWith("amount-") || activeInput?.startsWith("manual-amount-")
                    ? "Menge in ml"
                    : "Text eingeben..."
          }
        />
      </div>

      <VirtualKeyboard
        onKeyPress={handleKeyboardInput}
        onBackspace={() => setInputValue((prev) => prev.slice(0, -1))}
        onClear={() => setInputValue("")}
        onConfirm={handleKeyboardConfirm}
        onCancel={handleKeyboardCancel}
        layout={
          activeInput?.startsWith("amount-") || activeInput?.startsWith("manual-amount-") ? "numeric" : "alphanumeric"
        }
      />
    </div>
  )

  // Image Browser View
  const renderImageBrowserView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentView("form")}
          className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">Bild auswählen</h3>
      </div>

      <ScrollArea className="h-[60vh] pr-4">
        <div className="grid grid-cols-2 gap-4">
          {AVAILABLE_IMAGES.map((image) => (
            <div
              key={image.path}
              className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                imageUrl === image.path
                  ? "border-[hsl(var(--cocktail-primary))] ring-2 ring-[hsl(var(--cocktail-primary))]/50"
                  : "border-transparent hover:border-[hsl(var(--cocktail-card-border))]"
              }`}
              onClick={() => handleSelectImage(image.path)}
            >
              <img
                src={image.path || "/placeholder.svg"}
                alt={image.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=200&width=200"
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-center text-white">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Neues Rezept erstellen</DialogTitle>
        </DialogHeader>

        {currentView === "form" && renderFormView()}
        {currentView === "keyboard" && renderKeyboardView()}
        {currentView === "imageBrowser" && renderImageBrowserView()}

        {currentView === "form" && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim() || (recipe.length === 0 && manualIngredients.length === 0)}
              className="bg-[#00ff00] text-black hover:bg-[#00cc00]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

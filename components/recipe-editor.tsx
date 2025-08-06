"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, Edit } from 'lucide-react'
import { ingredients } from "@/data/ingredients"
import type { Cocktail, RecipeItem } from "@/types/cocktail"
import VirtualKeyboard from "./virtual-keyboard"

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (cocktail: Cocktail) => Promise<void>
  onRequestDelete: (cocktailId: string) => void
}

export default function RecipeEditor({ isOpen, onClose, cocktail, onSave, onRequestDelete }: RecipeEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<RecipeItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [activeField, setActiveField] = useState<string>("")

  useEffect(() => {
    if (cocktail) {
      setName(cocktail.name)
      setDescription(cocktail.description)
      setAlcoholic(cocktail.alcoholic)
      // Ensure recipe items have the correct structure
      setRecipe(cocktail.recipe.map(item => ({
        ...item,
        type: item.type || 'automatic',
        instruction: item.instruction || ''
      })))
    }
  }, [cocktail])

  const handleAddIngredient = () => {
    const newItem: RecipeItem = {
      ingredientId: "",
      amount: 0,
      type: "automatic",
      instruction: ""
    }
    setRecipe([...recipe, newItem])
  }

  const handleRemoveIngredient = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (index: number, field: keyof RecipeItem, value: string | number) => {
    const updatedRecipe = [...recipe]
    if (field === 'amount') {
      updatedRecipe[index][field] = Number(value)
    } else {
      updatedRecipe[index][field] = value as string
    }
    setRecipe(updatedRecipe)
  }

  const handleSave = async () => {
    if (!cocktail || !name.trim() || recipe.length === 0) {
      alert("Bitte fülle alle Pflichtfelder aus!")
      return
    }

    // Validiere, dass alle Zutaten ausgewählt und Mengen > 0 sind
    for (const item of recipe) {
      if (!item.ingredientId || item.amount <= 0) {
        alert("Bitte wähle für alle Zutaten eine gültige Zutat und Menge aus!")
        return
      }
    }

    setIsSaving(true)
    try {
      const updatedCocktail: Cocktail = {
        ...cocktail,
        name: name.trim(),
        description: description.trim(),
        alcoholic,
        recipe
      }

      await onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      alert("Fehler beim Speichern des Rezepts!")
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyboardInput = (value: string) => {
    switch (activeField) {
      case "name":
        setName(value)
        break
      case "description":
        setDescription(value)
        break
      default:
        if (activeField.startsWith("instruction-")) {
          const index = parseInt(activeField.split("-")[1])
          handleIngredientChange(index, "instruction", value)
        }
        break
    }
  }

  const openKeyboard = (field: string, currentValue: string) => {
    setActiveField(field)
    setShowKeyboard(true)
  }

  if (!cocktail) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Cocktail-Rezept bearbeiten</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Grundinformationen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => openKeyboard("name", name)}
                  placeholder="Cocktail-Name eingeben"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="alcoholic"
                  checked={alcoholic}
                  onCheckedChange={setAlcoholic}
                />
                <Label htmlFor="alcoholic">Alkoholisch</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => openKeyboard("description", description)}
                placeholder="Beschreibung des Cocktails"
                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              />
            </div>

            {/* Rezept */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Rezept</h3>
                <Button
                  onClick={handleAddIngredient}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Zutat hinzufügen
                </Button>
              </div>

              {recipe.length === 0 ? (
                <Card className="bg-gray-800 border-gray-600">
                  <CardContent className="p-6 text-center text-gray-400">
                    Noch keine Zutaten hinzugefügt. Klicke auf "Zutat hinzufügen" um zu beginnen.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {recipe.map((item, index) => (
                    <Card key={index} className="bg-gray-800 border-gray-600">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Zutat auswählen */}
                          <div className="md:col-span-4">
                            <Label className="text-sm">Zutat *</Label>
                            <Select
                              value={item.ingredientId}
                              onValueChange={(value) => handleIngredientChange(index, "ingredientId", value)}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder="Zutat wählen" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                {ingredients.map((ingredient) => (
                                  <SelectItem key={ingredient.id} value={ingredient.id} className="text-white">
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Menge */}
                          <div className="md:col-span-2">
                            <Label className="text-sm">Menge (ml) *</Label>
                            <Input
                              type="number"
                              value={item.amount}
                              onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                              min="1"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>

                          {/* Typ */}
                          <div className="md:col-span-2">
                            <Label className="text-sm">Typ</Label>
                            <Select
                              value={item.type}
                              onValueChange={(value) => handleIngredientChange(index, "type", value)}
                            >
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="automatic" className="text-white">Automatisch</SelectItem>
                                <SelectItem value="manual" className="text-white">Manuell</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Anleitung (nur bei manuellen Zutaten) */}
                          {item.type === "manual" && (
                            <div className="md:col-span-3">
                              <Label className="text-sm">Anleitung</Label>
                              <Input
                                value={item.instruction || ""}
                                onChange={(e) => handleIngredientChange(index, "instruction", e.target.value)}
                                onFocus={() => openKeyboard(`instruction-${index}`, item.instruction || "")}
                                placeholder="z.B. 'Vorsichtig einrühren'"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </div>
                          )}

                          {/* Löschen Button */}
                          <div className={item.type === "manual" ? "md:col-span-1" : "md:col-span-4"}>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveIngredient(index)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Typ Badge */}
                        <div className="mt-2">
                          <Badge variant={item.type === "automatic" ? "default" : "secondary"}>
                            {item.type === "automatic" ? "Automatisch" : "Manuell"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Aktionen */}
            <div className="flex justify-between pt-4 border-t border-gray-700">
              <Button
                variant="destructive"
                onClick={() => onRequestDelete(cocktail.id)}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !name.trim() || recipe.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Speichere..." : "Änderungen speichern"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VirtualKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onInput={handleKeyboardInput}
        initialValue={
          activeField === "name" ? name :
          activeField === "description" ? description :
          activeField.startsWith("instruction-") ? 
            recipe[parseInt(activeField.split("-")[1])]?.instruction || "" : ""
        }
      />
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, Check } from 'lucide-react'
import type { Cocktail } from '@/types/cocktail'
import { ingredients } from '@/data/ingredients'
import { v4 as uuidv4 } from 'uuid'
import VirtualKeyboard from '@/components/virtual-keyboard'

interface RecipeCreatorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cocktail: Cocktail) => void
}

export default function RecipeCreator({ isOpen, onClose, onSave }: RecipeCreatorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<Cocktail['recipe']>([])
  const [currentIngredientId, setCurrentIngredientId] = useState('')
  const [currentAmount, setCurrentAmount] = useState<number | ''>(0)
  const [currentType, setCurrentType] = useState<'automatic' | 'manual'>('automatic')
  const [currentInstruction, setCurrentInstruction] = useState('')
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [keyboardTarget, setKeyboardTarget] = useState<'name' | 'description' | 'instruction' | null>(null)
  const [keyboardValue, setKeyboardValue] = useState('')
  const [editIndex, setEditIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setName('')
    setDescription('')
    setAlcoholic(true)
    setRecipe([])
    setCurrentIngredientId('')
    setCurrentAmount(0)
    setCurrentType('automatic')
    setCurrentInstruction('')
    setEditIndex(null)
  }

  const handleAddIngredient = () => {
    if (currentIngredientId && currentAmount !== '' && currentAmount > 0) {
      const newIngredient = {
        ingredientId: currentIngredientId,
        amount: currentAmount,
        type: currentType,
        instruction: currentType === 'manual' ? currentInstruction : undefined,
      }
      if (editIndex !== null) {
        const updatedRecipe = [...recipe]
        updatedRecipe[editIndex] = newIngredient
        setRecipe(updatedRecipe)
        setEditIndex(null)
      } else {
        setRecipe([...recipe, newIngredient])
      }
      setCurrentIngredientId('')
      setCurrentAmount(0)
      setCurrentType('automatic')
      setCurrentInstruction('')
    }
  }

  const handleEditIngredient = (index: number) => {
    const item = recipe[index]
    setCurrentIngredientId(item.ingredientId)
    setCurrentAmount(item.amount)
    setCurrentType(item.type)
    setCurrentInstruction(item.instruction || '')
    setEditIndex(index)
  }

  const handleRemoveIngredient = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!name || recipe.length === 0) {
      alert('Name und mindestens eine Zutat sind erforderlich.')
      return
    }

    const newCocktail: Cocktail = {
      id: uuidv4(), // Generiere eine neue ID
      name,
      description,
      alcoholic,
      recipe,
      // Das 'ingredients'-Array wird aus dem 'recipe'-Array abgeleitet
      ingredients: recipe.map(item => {
        const ingredientName = ingredients.find(i => i.id === item.ingredientId)?.name || item.ingredientId;
        return `${item.amount}ml ${ingredientName}${item.type === 'manual' ? ' (manuell)' : ''}`;
      }),
      image: `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(name)}`, // Standardbild
    }
    onSave(newCocktail)
    onClose()
  }

  const openKeyboard = (target: 'name' | 'description' | 'instruction', initialValue: string) => {
    setKeyboardTarget(target)
    setKeyboardValue(initialValue)
    setShowKeyboard(true)
  }

  const handleKeyboardChange = (value: string) => {
    setKeyboardValue(value)
  }

  const handleKeyboardSubmit = (value: string) => {
    if (keyboardTarget === 'name') {
      setName(value)
    } else if (keyboardTarget === 'description') {
      setDescription(value)
    } else if (keyboardTarget === 'instruction') {
      setCurrentInstruction(value)
    }
    setShowKeyboard(false)
    setKeyboardTarget(null)
    setKeyboardValue('')
  }

  const handleKeyboardCancel = () => {
    setShowKeyboard(false)
    setKeyboardTarget(null)
    setKeyboardValue('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Rezept erstellen</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onClick={() => openKeyboard('name', name)}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Beschreibung
            </Label>
            <Textarea
              id="description"
              value={description}
              onClick={() => openKeyboard('description', description)}
              readOnly
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="alcoholic" className="text-right">
              Alkoholisch
            </Label>
            <Select onValueChange={(value) => setAlcoholic(value === 'true')} value={alcoholic.toString()}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Wähle..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ja</SelectItem>
                <SelectItem value="false">Nein</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <h4 className="text-lg font-semibold mt-4 col-span-4">Zutaten</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient">Zutat</Label>
              <Select onValueChange={setCurrentIngredientId} value={currentIngredientId}>
                <SelectTrigger id="ingredient">
                  <SelectValue placeholder="Zutat wählen" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Menge (ml)</Label>
              <Input
                id="amount"
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select onValueChange={(value: 'automatic' | 'manual') => setCurrentType(value)} value={currentType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatisch (Maschine)</SelectItem>
                  <SelectItem value="manual">Manuell (Benutzer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentType === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="instruction">Anleitung (optional)</Label>
                <Input
                  id="instruction"
                  value={currentInstruction}
                  onClick={() => openKeyboard('instruction', currentInstruction)}
                  readOnly
                />
              </div>
            )}
          </div>
          <Button onClick={handleAddIngredient} className="mt-2">
            {editIndex !== null ? 'Zutat aktualisieren' : 'Zutat hinzufügen'}
          </Button>

          <div className="mt-4">
            <h5 className="font-semibold mb-2">Aktuelle Zutaten:</h5>
            {recipe.length === 0 ? (
              <p className="text-sm text-gray-500">Noch keine Zutaten hinzugefügt.</p>
            ) : (
              <ul className="space-y-2">
                {recipe.map((item, index) => {
                  const ingredientName = ingredients.find((i) => i.id === item.ingredientId)?.name || item.ingredientId
                  return (
                    <li key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                      <span>
                        {item.amount}ml {ingredientName}
                        {item.type === 'manual' && <span className="text-sm text-gray-500 ml-2">(manuell)</span>}
                        {item.type === 'manual' && item.instruction && (
                          <span className="block text-xs text-gray-400 italic">Anleitung: {item.instruction}</span>
                        )}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditIngredient(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRemoveIngredient(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Rezept speichern</Button>
        </DialogFooter>

        {showKeyboard && (
          <VirtualKeyboard
            value={keyboardValue}
            onChange={handleKeyboardChange}
            onSave={handleKeyboardSubmit}
            onCancel={handleKeyboardCancel}
            className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg z-50"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

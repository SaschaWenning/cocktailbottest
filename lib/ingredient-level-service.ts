"use server"

import type { IngredientLevel } from "@/types/ingredient-level"
import type { Cocktail } from "@/types/cocktail"
import { initialIngredientLevels } from "@/data/ingredient-levels"

// In einer echten Anwendung würden wir diese Daten in einer Datenbank speichern
let ingredientLevels = [...initialIngredientLevels]

// Füllstände abrufen und automatisch neue Zutaten initialisieren
export async function getIngredientLevels(): Promise<IngredientLevel[]> {
  // Hole alle Cocktails und extrahiere verwendete Zutaten
  const { getAllCocktails } = await import("@/lib/cocktail-machine")
  const cocktails = await getAllCocktails()

  const usedIngredients = new Set<string>()
  cocktails.forEach((cocktail) => {
    cocktail.recipe.forEach((item) => {
      usedIngredients.add(item.ingredientId)
    })
  })

  // Initialisiere fehlende Zutaten
  for (const ingredientId of usedIngredients) {
    const existingIndex = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

    if (existingIndex === -1) {
      const newLevel: IngredientLevel = {
        ingredientId,
        currentAmount: 700, // Standard-Startmenge
        capacity: 1000, // Standard-Kapazität
        lastRefill: new Date(),
      }
      ingredientLevels.push(newLevel)
    }
  }

  return ingredientLevels
}

// Füllstand für eine bestimmte Zutat aktualisieren
export async function updateIngredientLevel(
  ingredientId: string,
  newAmount: number,
  newCapacity?: number,
): Promise<IngredientLevel> {
  const index = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  if (index === -1) {
    // Erstelle neue Zutat wenn sie nicht existiert
    const newLevel: IngredientLevel = {
      ingredientId,
      currentAmount: newAmount,
      capacity: newCapacity ?? Math.max(newAmount, 1000), // Entferne 500ml Mindestbegrenzung
      lastRefill: new Date(),
    }
    ingredientLevels.push(newLevel)
    return newLevel
  }

  if (newCapacity) {
    ingredientLevels[index].capacity = newCapacity
  }

  const cappedAmount = Math.min(newAmount, ingredientLevels[index].capacity)

  const updatedLevel = {
    ...ingredientLevels[index],
    currentAmount: cappedAmount,
    lastRefill: new Date(),
  }

  ingredientLevels[index] = updatedLevel
  return updatedLevel
}

// Füllstand nach Cocktailzubereitung aktualisieren
export async function updateLevelsAfterCocktail(
  cocktail: Cocktail,
  size: number,
): Promise<{
  success: boolean
  insufficientIngredients: string[]
}> {
  // Skaliere das Rezept auf die gewünschte Größe
  const currentTotal = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  const scaleFactor = size / currentTotal

  const scaledRecipe = cocktail.recipe.map((item) => ({
    ...item,
    amount: Math.round(item.amount * scaleFactor),
  }))

  // Prüfe, ob genügend von allen Zutaten vorhanden ist
  const insufficientIngredients: string[] = []

  for (const item of scaledRecipe) {
    const levelIndex = ingredientLevels.findIndex((level) => level.ingredientId === item.ingredientId)

    // Wenn kein Füllstand für diese Zutat existiert, initialisiere einen neuen
    if (levelIndex === -1) {
      await initializeNewIngredientLevel(item.ingredientId)
      continue
    }

    if (ingredientLevels[levelIndex].currentAmount < item.amount) {
      insufficientIngredients.push(item.ingredientId)
    }
  }

  // Wenn nicht genug von allen Zutaten vorhanden ist, breche ab
  if (insufficientIngredients.length > 0) {
    return {
      success: false,
      insufficientIngredients,
    }
  }

  // Aktualisiere die Füllstände
  for (const item of scaledRecipe) {
    const levelIndex = ingredientLevels.findIndex((level) => level.ingredientId === item.ingredientId)

    if (levelIndex === -1) continue

    ingredientLevels[levelIndex] = {
      ...ingredientLevels[levelIndex],
      currentAmount: Math.max(0, ingredientLevels[levelIndex].currentAmount - item.amount),
    }
  }

  return {
    success: true,
    insufficientIngredients: [],
  }
}

// Füllstand nach Shot-Zubereitung aktualisieren
export async function updateLevelAfterShot(
  ingredientId: string,
  amount: number,
): Promise<{
  success: boolean
}> {
  // Finde den Füllstand für diese Zutat
  const levelIndex = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  // Wenn kein Füllstand für diese Zutat existiert, initialisiere einen neuen
  if (levelIndex === -1) {
    await initializeNewIngredientLevel(ingredientId)
    return { success: true }
  }

  // Prüfe, ob genügend von der Zutat vorhanden ist
  if (ingredientLevels[levelIndex].currentAmount < amount) {
    return { success: false }
  }

  // Aktualisiere den Füllstand
  ingredientLevels[levelIndex] = {
    ...ingredientLevels[levelIndex],
    currentAmount: Math.max(0, ingredientLevels[levelIndex].currentAmount - amount),
  }

  return { success: true }
}

// Zutat nachfüllen
export async function refillIngredient(ingredientId: string, amount: number): Promise<IngredientLevel> {
  const index = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  if (index === -1) {
    throw new Error(`Zutat mit ID ${ingredientId} nicht gefunden`)
  }

  const level = ingredientLevels[index]
  const newAmount = Math.min(level.capacity, level.currentAmount + amount)

  const updatedLevel = {
    ...level,
    currentAmount: newAmount,
    lastRefill: new Date(),
  }

  ingredientLevels[index] = updatedLevel
  return updatedLevel
}

// Alle Zutaten auf maximale Kapazität auffüllen
export async function refillAllIngredients(): Promise<IngredientLevel[]> {
  ingredientLevels = ingredientLevels.map((level) => ({
    ...level,
    currentAmount: level.capacity,
    lastRefill: new Date(),
  }))

  return ingredientLevels
}

// Füllstandskapazität aktualisieren
export async function updateIngredientCapacity(ingredientId: string, capacity: number): Promise<IngredientLevel> {
  const index = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  if (index === -1) {
    const newLevel: IngredientLevel = {
      ingredientId,
      currentAmount: 0,
      capacity,
      lastRefill: new Date(),
    }
    ingredientLevels.push(newLevel)
    return newLevel
  }

  const updatedLevel = {
    ...ingredientLevels[index],
    capacity,
    currentAmount: Math.min(ingredientLevels[index].currentAmount, capacity),
  }

  ingredientLevels[index] = updatedLevel
  return updatedLevel
}

// Zurücksetzen auf Initialwerte (für Testzwecke)
export async function resetIngredientLevels(): Promise<IngredientLevel[]> {
  ingredientLevels = [...initialIngredientLevels]
  return ingredientLevels
}

// Füge eine Funktion hinzu, um Füllstände für neu angeschlossene Zutaten zu initialisieren
export async function initializeNewIngredientLevel(ingredientId: string, capacity = 1000): Promise<IngredientLevel> {
  // Prüfe, ob bereits ein Füllstand für diese Zutat existiert
  const existingIndex = ingredientLevels.findIndex((level) => level.ingredientId === ingredientId)

  if (existingIndex !== -1) {
    return ingredientLevels[existingIndex]
  }

  // Erstelle einen neuen Füllstand für diese Zutat
  const newLevel: IngredientLevel = {
    ingredientId,
    currentAmount: Math.min(700, capacity), // Startmenge nicht größer als Kapazität
    capacity, // Verwende übergebene Kapazität
    lastRefill: new Date(),
  }

  ingredientLevels.push(newLevel)
  return newLevel
}

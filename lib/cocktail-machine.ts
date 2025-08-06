import type { Ingredient } from "./ingredient"
import type { Cocktail } from "@/types/cocktail"
import type { CocktailMachineConfig, IngredientConfig } from "@/types/cocktail-machine-config"
import type { PumpConfig } from "@/types/pump" // Importiere PumpConfig

// Eine einfache In-Memory-Speicherung für die Konfiguration
// In einer echten Anwendung würde dies aus einer Datenbank oder Datei geladen/gespeichert
let _cocktailMachineConfig: CocktailMachineConfig = {
  machineName: "Mein CocktailBot",
  flowRate: 10, // Standard-Durchflussrate in ml/s
  kioskMode: false,
  pumps: [
    { id: "pump-1", name: "Pumpe 1", gpioPin: 17 },
    { id: "pump-2", name: "Pumpe 2", gpioPin: 18 },
    { id: "pump-3", name: "Pumpe 3", gpioPin: 27 },
    { id: "pump-4", name: "Pumpe 4", gpioPin: 22 },
    { id: "pump-5", name: "Pumpe 5", gpioPin: 23 },
    { id: "pump-6", name: "Pumpe 6", gpioPin: 24 },
    { id: "pump-7", name: "Pumpe 7", gpioPin: 25 },
    { id: "pump-8", name: "Pumpe 8", gpioPin: 4 },
  ],
  ingredients: [
    { id: "vodka", name: "Wodka", pumpId: "pump-1", currentLevel: 1000, maxLevel: 1000 },
    { id: "rum", name: "Rum", pumpId: "pump-2", currentLevel: 1000, maxLevel: 1000 },
    { id: "gin", name: "Gin", pumpId: "pump-3", currentLevel: 1000, maxLevel: 1000 },
    { id: "orange_juice", name: "Orangensaft", pumpId: "pump-4", currentLevel: 2000, maxLevel: 2000 },
    { id: "cranberry_juice", name: "Cranberrysaft", pumpId: "pump-5", currentLevel: 2000, maxLevel: 2000 },
    { id: "lime_juice", name: "Limettensaft", pumpId: "pump-6", currentLevel: 1000, maxLevel: 1000 },
    { id: "grenadine", name: "Grenadine", pumpId: "pump-7", currentLevel: 500, maxLevel: 500 },
    { id: "soda", name: "Soda", pumpId: "pump-8", currentLevel: 2000, maxLevel: 2000 },
  ],
}

// Exportiere die Konfigurationsfunktionen
export async function getCocktailMachineConfig(): Promise<CocktailMachineConfig> {
  // Simuliere eine asynchrone Operation
  return Promise.resolve(_cocktailMachineConfig)
}

export async function saveCocktailMachineConfig(config: CocktailMachineConfig): Promise<void> {
  // Simuliere eine asynchrone Operation und aktualisiere die In-Memory-Konfiguration
  _cocktailMachineConfig = { ...config }
  console.log("Cocktail Machine Konfiguration gespeichert:", _cocktailMachineConfig)
  return Promise.resolve()
}

// Bestehende Klassen und Funktionen
export class CocktailMachine {
  private pumps: { [ingredientName: string]: Pump } = {}
  private ingredients: { [ingredientName: string]: Ingredient } = {}

  constructor() {
    // Initialize pumps and ingredients here, or load from a configuration.
  }

  addPump(ingredientName: string, pump: Pump) {
    this.pumps[ingredientName] = pump
  }

  addIngredient(ingredient: Ingredient) {
    this.ingredients[ingredient.name] = ingredient
  }

  async dispense(ingredientName: string, amount: number): Promise<void> {
    const pump = this.pumps[ingredientName]
    const ingredient = this.ingredients[ingredientName]

    if (!pump) {
      throw new Error(`No pump configured for ingredient: ${ingredientName}`)
    }

    if (!ingredient) {
      throw new Error(`No ingredient found: ${ingredientName}`)
    }

    const dispenseTimeMs = amount * ingredient.flowRate // Calculate dispense time based on flow rate

    console.log(`Dispensing ${amount}ml of ${ingredientName} for ${dispenseTimeMs}ms`)
    await pump.activatePump(dispenseTimeMs)
  }

  async createCocktail(
    cocktail: Cocktail,
    config: CocktailMachineConfig,
    selectedSize: number,
    onProgress: (progress: number, status: string) => void,
  ): Promise<{ success: boolean; message?: string }> {
    if (!cocktail.recipe || cocktail.recipe.length === 0) {
      return { success: false, message: "Keine automatischen Zutaten für dieses Rezept." }
    }

    const totalRecipeVolume =
      (cocktail.recipe?.reduce((sum, item) => sum + item.amount, 0) || 0) +
      (cocktail.manualIngredients?.reduce((sum, item) => sum + item.amount, 0) || 0)

    const scaleFactor = selectedSize / totalRecipeVolume

    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    let currentDispensedVolume = 0
    const totalAutomaticVolume = scaledRecipe.reduce((sum, item) => sum + item.amount, 0)

    for (let i = 0; i < scaledRecipe.length; i++) {
      const item = scaledRecipe[i]
      const ingredientConfig = config.ingredients.find((ing) => ing.id === item.ingredientId)
      const pumpConfig = config.pumps.find((p) => p.id === ingredientConfig?.pumpId)

      if (!ingredientConfig || !pumpConfig) {
        return { success: false, message: `Zutat oder Pumpe für ${item.ingredientId} nicht konfiguriert.` }
      }
      if (ingredientConfig.currentLevel < item.amount) {
        return { success: false, message: `Nicht genügend ${ingredientConfig.name} vorhanden.` }
      }

      const pump = new Pump(pumpConfig.gpioPin) // Erstelle eine neue Pumpeninstanz
      const dispenseTimeMs = item.amount * (1000 / config.flowRate) // Annahme: flowRate ist in ml/s

      onProgress(
        Math.round((currentDispensedVolume / totalAutomaticVolume) * 100),
        `Dispensing ${item.amount}ml ${ingredientConfig.name}...`,
      )

      await pump.activatePump(dispenseTimeMs)
      currentDispensedVolume += item.amount

      // Aktualisiere den Füllstand in der Konfiguration (In-Memory)
      _cocktailMachineConfig = {
        ..._cocktailMachineConfig,
        ingredients: _cocktailMachineConfig.ingredients.map((ing) =>
          ing.id === ingredientConfig.id ? { ...ing, currentLevel: ing.currentLevel - item.amount } : ing,
        ),
      }
    }

    onProgress(100, "Fertig!")
    return { success: true }
  }

  // You might want to add methods for cleaning, calibration, etc.
}

export class Pump {
  private gpioPin: number

  constructor(gpioPin: number) {
    this.gpioPin = gpioPin
    // Initialize GPIO pin here (e.g., using a library like rpio or pigpio)
    console.log(`Initializing pump on GPIO pin: ${gpioPin}`)
  }

  async activatePump(durationMs: number): Promise<void> {
    // Activate the pump for the specified duration
    console.log(`Activating pump on GPIO pin ${this.gpioPin} for ${durationMs}ms`)
    return new Promise((resolve) => setTimeout(resolve, durationMs))
  }
}

// Funktionen zum Speichern und Laden von Rezepten
const COCKTAILS_STORAGE_KEY = "cocktails"

export async function getAllCocktails(): Promise<Cocktail[]> {
  // Simuliere das Laden aus dem Local Storage oder einer API
  if (typeof window !== "undefined") {
    const storedCocktails = localStorage.getItem(COCKTAILS_STORAGE_KEY)
    if (storedCocktails) {
      return JSON.parse(storedCocktails)
    }
  }
  return [] // Leeres Array, wenn nichts gefunden wird
}

export async function saveRecipe(cocktail: Cocktail): Promise<void> {
  // Simuliere das Speichern im Local Storage oder einer API
  const cocktails = await getAllCocktails()
  const existingIndex = cocktails.findIndex((c) => c.id === cocktail.id)

  if (existingIndex > -1) {
    cocktails[existingIndex] = cocktail
  } else {
    cocktails.push(cocktail)
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(COCKTAILS_STORAGE_KEY, JSON.stringify(cocktails))
  }
  return Promise.resolve()
}

export async function deleteRecipe(cocktailId: string): Promise<void> {
  // Simuliere das Löschen aus dem Local Storage oder einer API
  const cocktails = await getAllCocktails()
  const updatedCocktails = cocktails.filter((c) => c.id !== cocktailId)

  if (typeof window !== "undefined") {
    localStorage.setItem(COCKTAILS_STORAGE_KEY, JSON.stringify(updatedCocktails))
  }
  return Promise.resolve()
}

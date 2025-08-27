import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"
import { ingredients } from "@/data/ingredients"
import { pumpConfig as defaultPumpConfig } from "@/data/pump-config"
import { cocktails as defaultCocktails } from "@/data/cocktails"

const COCKTAILS_STORAGE_KEY = "cocktailbot-cocktails"
const PUMP_CONFIG_STORAGE_KEY = "cocktailbot-pump-config"

// Lade Cocktails aus localStorage oder verwende Standard-Cocktails
const loadCocktailsFromStorage = (): Cocktail[] => {
  if (typeof window === "undefined") return defaultCocktails // Server-side rendering

  try {
    const stored = localStorage.getItem(COCKTAILS_STORAGE_KEY)
    if (stored) {
      const parsedCocktails = JSON.parse(stored)
      console.log("Cocktails aus localStorage geladen:", parsedCocktails.length)
      return parsedCocktails
    }
  } catch (error) {
    console.error("Fehler beim Laden der Cocktails aus localStorage:", error)
  }

  console.log("Standard-Cocktails werden verwendet")
  return defaultCocktails
}

// Speichere Cocktails in localStorage
const saveCocktailsToStorage = (cocktails: Cocktail[]) => {
  if (typeof window === "undefined") return // Server-side rendering

  try {
    localStorage.setItem(COCKTAILS_STORAGE_KEY, JSON.stringify(cocktails))
    console.log("Cocktails in localStorage gespeichert:", cocktails.length)
  } catch (error) {
    console.error("Fehler beim Speichern der Cocktails in localStorage:", error)
  }
}

// Lade Pumpenkonfiguration aus localStorage oder verwende Standard-Konfiguration
const loadPumpConfigFromStorage = (): PumpConfig[] => {
  if (typeof window === "undefined") return defaultPumpConfig // Server-side rendering

  try {
    const stored = localStorage.getItem(PUMP_CONFIG_STORAGE_KEY)
    if (stored) {
      const parsedConfig = JSON.parse(stored)
      console.log("Pumpenkonfiguration aus localStorage geladen")
      return parsedConfig
    }
  } catch (error) {
    console.error("Fehler beim Laden der Pumpenkonfiguration aus localStorage:", error)
  }

  return defaultPumpConfig
}

// Speichere Pumpenkonfiguration in localStorage
const savePumpConfigToStorage = (config: PumpConfig[]) => {
  if (typeof window === "undefined") return // Server-side rendering

  try {
    localStorage.setItem(PUMP_CONFIG_STORAGE_KEY, JSON.stringify(config))
    console.log("Pumpenkonfiguration in localStorage gespeichert")
  } catch (error) {
    console.error("Fehler beim Speichern der Pumpenkonfiguration in localStorage:", error)
  }
}

let currentCocktails: Cocktail[] = loadCocktailsFromStorage().map((cocktail) => ({
  ...cocktail,
  recipe: cocktail.recipe.map((item) => ({
    ...item,
    type: (item as any).type || "automatic",
    instruction: (item as any).instruction || "",
  })),
}))

let currentPumpConfig: PumpConfig[] = loadPumpConfigFromStorage()

// Simulate GPIO control
const simulateGpioControl = async (pin: number, duration: number) => {
  console.log(`Simulating GPIO pin ${pin} ON for ${duration}ms`)
  return new Promise((resolve) => setTimeout(resolve, duration))
}

// Simulate API calls
export const getAllCocktails = async (): Promise<Cocktail[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Fetching all cocktails (simulated)")
      resolve(currentCocktails)
    }, 500)
  })
}

export const getPumpConfig = async (): Promise<PumpConfig[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Fetching pump configuration (simulated)")
      resolve(currentPumpConfig)
    }, 300)
  })
}

export const saveRecipe = async (cocktail: Cocktail): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = currentCocktails.findIndex((c) => c.id === cocktail.id)
      if (index > -1) {
        currentCocktails[index] = cocktail
        console.log(`Cocktail "${cocktail.name}" updated (simulated)`)
      } else {
        currentCocktails.push(cocktail)
        console.log(`Cocktail "${cocktail.name}" added (simulated)`)
      }
      saveCocktailsToStorage(currentCocktails)
      resolve()
    }, 500)
  })
}

export const deleteRecipe = async (cocktailId: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentCocktails = currentCocktails.filter((c) => c.id !== cocktailId)
      console.log(`Cocktail with ID "${cocktailId}" deleted (simulated)`)
      saveCocktailsToStorage(currentCocktails)
      resolve()
    }, 300)
  })
}

export const updatePumpConfig = async (config: PumpConfig[]): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentPumpConfig = config
      console.log("Pump configuration updated (simulated)")
      savePumpConfigToStorage(currentPumpConfig)
      resolve()
    }, 300)
  })
}

export const makeCocktail = async (
  cocktail: Cocktail,
  pumpConfig: PumpConfig[],
  selectedSize: number,
): Promise<void> => {
  console.log(`Starting to make cocktail: ${cocktail.name} (${selectedSize}ml)`)

  const totalRecipeVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  if (totalRecipeVolume === 0) {
    throw new Error("Rezept hat keine Zutaten oder Gesamtvolumen ist Null.")
  }
  const scaleFactor = selectedSize / totalRecipeVolume

  for (const item of cocktail.recipe) {
    const ingredient = ingredients.find((i) => i.id === item.ingredientId)
    const scaledAmount = Math.round(item.amount * scaleFactor)

    if (item.type === "automatic") {
      const pump = pumpConfig.find((p) => p.ingredientId === item.ingredientId)

      if (!pump) {
        throw new Error(`Pumpe für Zutat "${ingredient?.name || item.ingredientId}" nicht konfiguriert.`)
      }

      const duration = (scaledAmount / pump.calibrationValue) * 1000 // ml / (ml/s) * 1000ms/s = ms
      console.log(
        `Dispensing ${scaledAmount}ml of ${ingredient?.name || item.ingredientId} using pump ${pump.pumpId} (GPIO ${pump.gpioPin}) for ${duration}ms`,
      )
      await simulateGpioControl(pump.gpioPin, duration)
    } else {
      console.log(
        `Manuelle Zutat: ${scaledAmount}ml ${ingredient?.name || item.ingredientId}. Anleitung: ${item.instruction || "Keine spezielle Anleitung."}`,
      )
    }
  }

  console.log(`Finished making cocktail: ${cocktail.name}`)
}

// New function to activate a single pump for a duration
export const activatePumpForDuration = async (
  pumpId: string,
  durationMs: number,
  pumpConfig: PumpConfig[],
): Promise<void> => {
  const pump = pumpConfig.find((p) => p.pumpId === pumpId)
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Aktivierung von Pumpe ${pump.pumpId} (GPIO ${pump.gpioPin}) für ${durationMs}ms`)
  await simulateGpioControl(pump.gpioPin, durationMs)
  console.log(`Pumpe ${pump.pumpId} deaktiviert.`)
}

// New function to make a single shot
export const makeSingleShot = async (
  ingredientId: string,
  amountMl: number,
  pumpConfig: PumpConfig[],
): Promise<void> => {
  const pump = pumpConfig.find((p) => p.ingredientId === ingredientId)
  if (!pump) {
    throw new Error(`Pumpe für Zutat "${ingredientId}" nicht konfiguriert.`)
  }

  const duration = (amountMl / pump.calibrationValue) * 1000 // ml / (ml/s) * 1000ms/s = ms
  console.log(
    `Zubereitung eines Shots: ${amountMl}ml ${ingredientId} (Pumpe ${pump.pumpId}, GPIO ${pump.gpioPin}) für ${duration}ms`,
  )
  await simulateGpioControl(pump.gpioPin, duration)
  console.log(`Shot von ${ingredientId} fertig.`)
}

// Added functions
export const savePumpConfig = async (config: PumpConfig[]): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentPumpConfig = config
      console.log("Pump configuration saved (simulated)")
      savePumpConfigToStorage(currentPumpConfig)
      resolve()
    }, 300)
  })
}

export const calibratePump = async (pumpId: string, duration: number): Promise<void> => {
  const pump = currentPumpConfig.find((p) => p.pumpId === pumpId)
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Kalibrierung von Pumpe ${pump.pumpId} (GPIO ${pump.gpioPin}) für ${duration}ms`)
  await simulateGpioControl(pump.gpioPin, duration)
  console.log(`Kalibrierung von Pumpe ${pump.pumpId} abgeschlossen.`)
}

export const cleanPump = async (pumpId: number, duration: number): Promise<void> => {
  const pump = currentPumpConfig.find((p) => p.pumpId === pumpId.toString())
  if (!pump) {
    throw new Error(`Pumpe mit ID "${pumpId}" nicht gefunden.`)
  }

  console.log(`Reinigung von Pumpe ${pump.pumpId} (GPIO ${pump.gpioPin}) für ${duration}ms`)
  await simulateGpioControl(pump.gpioPin, duration)
  console.log(`Reinigung von Pumpe ${pump.pumpId} abgeschlossen.`)
}

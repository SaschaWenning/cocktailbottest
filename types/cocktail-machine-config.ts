import type { PumpConfig } from "./pump" // Importiere PumpConfig aus der bestehenden Datei

export interface IngredientConfig {
  id: string
  name: string
  pumpId: string | null // ID der Pumpe, der diese Zutat zugewiesen ist
  currentLevel: number // Aktueller Füllstand in ml
  maxLevel: number // Maximale Kapazität in ml
}

export interface CocktailMachineConfig {
  machineName: string
  flowRate: number // Standard-Durchflussrate in ml/s
  kioskMode: boolean
  pumps: PumpConfig[]
  ingredients: IngredientConfig[]
}

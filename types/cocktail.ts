export interface Cocktail {
  id: string
  name: string
  description: string
  image: string
  alcoholic: boolean
  // Automatische Zutaten (für die Maschine)
  recipe: {
    ingredientId: string
    amount: number // in ml
  }[]
  // Manuelle Zutaten (vom Benutzer hinzuzufügen)
  manualIngredients?: {
    name: string
    amount: number // Geändert von string zu number für Berechnungen
    instruction: string
  }[]
  // Kombinierte Liste aller Zutaten für die Anzeige
  ingredients: string[]
}

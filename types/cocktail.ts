export interface Cocktail {
  id: string
  name: string
  description: string
  image: string
  alcoholic: boolean
  ingredients: string[] // Dies ist eine abgeleitete Liste für die Anzeige
  recipe: {
    ingredientId: string
    amount: number // in ml
    type: 'automatic' | 'manual' // Neuer Typ: 'automatic' für Maschine, 'manual' für Benutzer
    instruction?: string // Optionale Anweisung für manuelle Zutaten (z.B. "mit Eiswürfeln auffüllen")
  }[]
}

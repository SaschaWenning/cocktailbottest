export interface Cocktail {
  id: string
  name: string
  description: string
  image: string
  alcoholic: boolean
  recipe: {
    ingredientId: string
    amount: number
  }[]
  // New field for manual ingredients
  manualIngredients?: {
    name: string
    amount: number // Ensure amount is a number for calculation
    instruction: string
  }[]
  ingredients: string[] // For display purposes, combines automatic and manual
}

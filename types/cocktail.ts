export interface Cocktail {
  id: string
  name: string
  description: string
  image: string
  alcoholic: boolean
  recipe: {
    ingredientId: string
    amount: number // in ml
  }[]
  manualIngredients?: {
    name: string
    amount: number // Changed from string to number
    instruction: string
  }[]
}

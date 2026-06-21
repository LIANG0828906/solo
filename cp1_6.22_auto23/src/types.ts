export interface Ingredient {
  name: string
  amount: string
}

export interface Recipe {
  id: string
  name: string
  category: 'chinese' | 'western' | 'japanese' | 'dessert'
  coverImage: string
  ingredients: Ingredient[]
  steps: string
  rating: number
  ratingCount: number
  favorited: boolean
  createdAt: string
}

export interface Comment {
  id: string
  recipeId: string
  content: string
  createdAt: string
}

export interface Ingredient {
  name: string
  amount: number
  unit: string
}

export interface Recipe {
  id: string
  name: string
  author: string
  authorAvatar: string
  images: string[]
  thumbnail: string
  description: string
  ingredients: Ingredient[]
  steps: string[]
  cookingTime: number
  difficulty: string
  category: string
}

export interface ShoppingItem {
  id: string
  name: string
  amount: number
  unit: string
  checked: boolean
  source?: string
  manual?: boolean
}

export interface Toast {
  id: string
  message: string
}

export type View = 'list' | 'detail' | 'shopping'

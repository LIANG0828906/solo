export interface User {
  id: number
  username: string
  avatar?: string
}

export interface Ingredient {
  id?: number
  name: string
  amount: string
  sort_order?: number
}

export interface Step {
  id?: number
  description: string
  image?: string
  sort_order?: number
}

export interface Recipe {
  id: number
  title: string
  description: string
  cover_image?: string
  cook_time: number
  author_id: number
  author_name: string
  is_public: boolean
  likes: number
  is_liked: boolean
  is_favorited: boolean
  created_at: string
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
}

export interface RecipeFormData {
  title: string
  description: string
  cover_image: string
  cook_time: number
  is_public: boolean
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
}

export interface SearchFilters {
  q: string
  tag: string
  cook_time: string
  author: string
}

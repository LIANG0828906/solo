export interface Ingredient {
  name: string
  amount: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  steps: string[]
  coverImage: string
  likes: number
  dislikes: number
  author: string
  authorAvatar: string
  createdAt: string
  matchLevel?: 'high' | 'medium' | 'low'
}

export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
  total?: number
  hasMore?: boolean
}

export type CuisineType = 'chinese' | 'western' | 'japanese' | 'dessert'

export const CuisineLabel: Record<CuisineType, string> = {
  chinese: '中餐',
  western: '西餐',
  japanese: '日食',
  dessert: '甜品'
}

export const CuisineColor: Record<CuisineType, string> = {
  chinese: '#C8102E',
  western: '#1E3A5F',
  japanese: '#88A878',
  dessert: '#9B7EBD'
}

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  emoji: string
  category: string
}

export interface CanvasBlock {
  id: string
  title: string
  description: string
  imageUrl?: string
  ingredients: Ingredient[]
  position: { x: number; y: number }
  order: number
}

export interface Recipe {
  id: string
  title: string
  coverImage?: string
  cuisine: CuisineType
  difficulty: DifficultyLevel
  totalTime: number
  blocks: CanvasBlock[]
  description: string
  author: string
  authorAvatar: string
  createdAt: string
  updatedAt: string
  isFavorite: boolean
  ratings: number[]
  views: number
}

export { PRESET_INGREDIENTS, UNITS, INGREDIENT_CATEGORIES } from './data/presets'

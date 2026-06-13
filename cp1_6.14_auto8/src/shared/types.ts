export type Category = 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory'
export type Mood = 'happy' | 'calm' | 'sad' | 'excited' | 'tired'

export const CATEGORY_LABELS: Record<Category, string> = {
  top: '上装',
  bottom: '下装',
  outerwear: '外套',
  shoes: '鞋',
  accessory: '配饰'
}

export const LABEL_TO_CATEGORY: Record<string, Category> = {
  '上装': 'top',
  '下装': 'bottom',
  '外套': 'outerwear',
  '鞋': 'shoes',
  '配饰': 'accessory'
}

export const MOOD_LABELS: Record<Mood, string> = {
  happy: '开心',
  calm: '平静',
  sad: '悲伤',
  excited: '兴奋',
  tired: '疲惫'
}

export const MOOD_COLORS: Record<Mood, string> = {
  happy: '#96CEB4',
  calm: '#45B7D1',
  sad: '#6C5CE7',
  excited: '#F39C12',
  tired: '#B0A8A0'
}

export interface Clothing {
  id: string
  name: string
  category: Category
  color: string
  imageUrl: string
  createdAt: string
}

export interface DiaryEntry {
  id: string
  date: string
  clothingIds: string[]
  mood: Mood
  note: string
  outfitImage?: string
}

export interface OutfitRecommendation {
  id: string
  pattern: {
    color: string
    category: Category
  }[]
  frequency: number
  sampleClothingIds: string[]
}

export const COLOR_PALETTE: string[] = [
  '#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#F39C12', '#8B4513',
  '#6C5CE7', '#A8E6CF', '#FADCD9', '#E8A5A0', '#C9B8A8'
]

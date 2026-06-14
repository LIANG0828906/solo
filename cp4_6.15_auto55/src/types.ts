export type MaterialType = '木材' | '金属' | '塑料' | '织物' | '涂料' | '五金' | '玻璃' | '其他'

export type Difficulty = '新手' | '进阶' | '专家'

export type MaterialStatus = 'available' | 'taken'

export interface Material {
  id: string
  name: string
  quantity: number
  dimensions: string
  materialType: MaterialType
  color: string
  condition: number
  photos: string[]
  status: MaterialStatus
  publisherName: string
  contact: string
  createdAt: number
}

export interface Project {
  id: string
  name: string
  requiredMaterialTypes: MaterialType[]
  difficulty: Difficulty
  estimatedHours: number
  matchScore: number
  publisherName: string
  contact: string
  createdAt: number
}

export interface AppNotification {
  id: string
  type: 'taken' | 'favorite' | 'match'
  message: string
  materialId?: string
  read: boolean
  createdAt: number
}

export interface Favorite {
  id: string
  itemId: string
  itemType: 'material' | 'project'
  createdAt: number
}

export interface FilterState {
  materialType: MaterialType | null
  color: string | null
  conditionRange: [number, number]
}

export const MATERIAL_TYPES: MaterialType[] = ['木材', '金属', '塑料', '织物', '涂料', '五金', '玻璃', '其他']

export const DIFFICULTIES: Difficulty[] = ['新手', '进阶', '专家']

export const CONDITION_EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

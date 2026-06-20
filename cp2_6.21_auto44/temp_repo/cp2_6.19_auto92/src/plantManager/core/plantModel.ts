export interface Plant {
  id: string
  name: string
  category: string
  purchaseDate: string
  wateringCycle: number
  fertilizingCycle: number
  lightRequirement: string
  lastWateringDate?: string
  lastFertilizingDate?: string
  createdAt: string
}

export interface CareLog {
  id: string
  plantId: string
  type: 'watering' | 'fertilizing' | 'pruning' | 'rotating' | 'light'
  date: string
  note?: string
  lightLevel?: 'low' | 'medium' | 'high'
  createdAt: string
}

export type CareLogType = 'watering' | 'fertilizing' | 'pruning' | 'rotating' | 'light'

export type LightLevel = 'low' | 'medium' | 'high'

export type PlantCategory = 'succulent' | 'foliage' | 'flowering' | 'other'

export const CARE_TYPE_LABELS: Record<CareLogType, string> = {
  watering: '浇水',
  fertilizing: '施肥',
  pruning: '修剪',
  rotating: '转盆',
  light: '光照',
}

export const CARE_TYPE_COLORS: Record<CareLogType, string> = {
  watering: '#3B82F6',
  fertilizing: '#10B981',
  pruning: '#F97316',
  rotating: '#8B5CF6',
  light: '#F59E0B',
}

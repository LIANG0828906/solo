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
  type: 'watering' | 'fertilizing' | 'pruning' | 'rotating'
  date: string
  note?: string
  createdAt: string
}

export type CareLogType = 'watering' | 'fertilizing' | 'pruning' | 'rotating'

export type LightLevel = 'low' | 'medium' | 'high'

export type PlantCategory = 'succulent' | 'foliage' | 'flowering' | 'other'

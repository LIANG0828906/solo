export type EventType =
  | 'sowing'
  | 'germination'
  | 'watering'
  | 'fertilizing'
  | 'pruning'
  | 'harvest'
  | 'pests'

export interface GrowthEvent {
  id: string
  plantId: string
  type: EventType
  description: string
  photos: string[]
  timestamp: string
}

export interface Plant {
  id: string
  name: string
  variety: string
  plantDate: string
  expectedMaturityDays: number
  mainImage: string
  createdAt: string
  events: GrowthEvent[]
}

export interface PlantStore {
  plants: Plant[]
  selectedPlantId: string | null
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'events'>) => void
  updatePlant: (id: string, updates: Partial<Plant>) => void
  deletePlant: (id: string) => void
  selectPlant: (id: string | null) => void
  addEvent: (
    plantId: string,
    event: Omit<GrowthEvent, 'id' | 'plantId' | 'timestamp'>
  ) => void
}

export type HealthStatus = 'healthy' | 'warning' | 'none'

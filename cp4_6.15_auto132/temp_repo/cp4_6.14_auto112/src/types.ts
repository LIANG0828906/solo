export type PlantStatus = 'healthy' | 'thirsty' | 'low_light' | 'pest'

export interface Plant {
  id: string
  name: string
  variety: string
  plantedDate: string
  status: PlantStatus
  notes: string
}

export type EventType = 'water' | 'fertilize' | 'repot' | 'prune'

export interface CareEvent {
  id: string
  plantId: string
  type: EventType
  date: string
  notes: string
}

export interface StatusDistribution {
  status: PlantStatus
  count: number
  percentage: number
}

export interface EventFrequencyItem {
  date: string
  count: number
  events: CareEvent[]
}

export interface HealthAnalysis {
  score: number
  suggestion: string
  statusDistribution: StatusDistribution[]
  eventFrequency: EventFrequencyItem[]
}

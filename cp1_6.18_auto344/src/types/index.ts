export type RecallType = 'text' | 'audio'

export interface Location {
  id: string
  name: string
  x: number
  y: number
  description: string
}

export interface Recall {
  id: string
  location_id: string
  type: RecallType
  content: string
  timestamp: string
}

export interface HeatData {
  location_id: string
  heat_score: number
  last_updated: string
}

export interface SubmitRecallRequest {
  location_id: string
  type: RecallType
  content: string
  timestamp: string
}

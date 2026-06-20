export interface TrebuchetParams {
  counterweight: number
  launchAngle: number
}

export interface WindParams {
  speed: number
  direction: 'left' | 'right'
}

export interface TrajectoryPoint {
  x: number
  y: number
  velocity: number
}

export interface Target {
  id: string
  name: string
  type: 'wall' | 'tower' | 'gate' | 'grain'
  x: number
  y: number
  width: number
  height: number
  points: number
  destroyed: boolean
}

export type DifficultyLevel = 'earth_wall' | 'sheep_horse_wall' | 'urn_city'

export interface HitFeedback {
  id: string
  targetId: string
  x: number
  y: number
  type: string
  timestamp: number
}

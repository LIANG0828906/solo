export type Direction = 'north' | 'south' | 'east' | 'west'

export interface DirectionEnergy {
  direction: Direction
  value: number
  changePercent: number
}

export interface FloorEnergyData {
  floor: number
  name: string
  height: number
  baseY: number
  directions: DirectionEnergy[]
}

export interface BarClickPayload {
  floor: number
  direction: string
  value: number
  changePercent: number
  position: { x: number; y: number; z: number }
}

export interface TrendPoint {
  date: string
  value: number
}

export interface FloorTrendData {
  floor: number
  data: TrendPoint[]
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  north: '北',
  south: '南',
  east: '东',
  west: '西'
}

export const DIRECTION_ORDER: Direction[] = ['north', 'east', 'south', 'west']

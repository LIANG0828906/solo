export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night'
export type Weather = 'sunny' | 'overcast'
export type FurnitureType = 'table' | 'chair' | 'sofa' | 'lamp'

export interface FurnitureItem {
  id: string
  type: FurnitureType
  position: [number, number, number]
  rotation: number
}

export interface RoomScheme {
  id: string
  furniture: FurnitureItem[]
  timeOfDay: TimeOfDay
  weather: Weather
  savedAt: string
}

export const ROOM_WIDTH = 6
export const ROOM_DEPTH = 4
export const ROOM_HEIGHT = 3

export const FURNITURE_DIMS: Record<FurnitureType, { width: number; depth: number; height: number }> = {
  table: { width: 1.2, depth: 0.8, height: 0.75 },
  chair: { width: 0.5, depth: 0.5, height: 0.9 },
  sofa: { width: 2, depth: 0.8, height: 0.8 },
  lamp: { width: 0.4, depth: 0.4, height: 1.5 },
}

export const FURNITURE_LABELS: Record<FurnitureType, string> = {
  table: '木桌',
  chair: '椅子',
  sofa: '双人沙发',
  lamp: '落地灯',
}

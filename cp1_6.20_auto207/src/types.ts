export interface Card {
  id: string
  x: number
  y: number
  rotation: number
  width: number
  height: number
  color: string
  opacity: number
  zIndex: number
}

export interface Point {
  x: number
  y: number
}

export const PRESET_COLORS: string[] = [
  'rgba(255, 99, 132, 0.7)',
  'rgba(54, 162, 235, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(230, 230, 230, 0.7)',
]

export const GRID_SIZE = 20
export const CARD_DEFAULT_WIDTH = 120
export const CARD_DEFAULT_HEIGHT = 80

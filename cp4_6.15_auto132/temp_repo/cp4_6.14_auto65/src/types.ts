export type TileType = 'ground' | 'wall' | 'platform'

export interface Tile {
  id: string
  x: number
  y: number
  type: TileType
}

export interface Enemy {
  id: string
  x: number
  y: number
}

export interface Viewport {
  offsetX: number
  offsetY: number
  scale: number
}

export type ToolType = 'ground' | 'wall' | 'platform' | 'eraser' | 'enemy' | 'hand'

export interface LevelData {
  tiles: Tile[]
  enemies: Enemy[]
  viewport: Viewport
  timestamp?: number
}

export type HistoryAction =
  | { type: 'draw_tile'; tiles: Tile[]; previousTiles: Tile[] }
  | { type: 'erase_tile'; erased: Tile[] }
  | { type: 'place_enemy'; enemy: Enemy }
  | { type: 'move_enemy'; enemyId: string; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: 'delete_enemy'; enemy: Enemy }

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

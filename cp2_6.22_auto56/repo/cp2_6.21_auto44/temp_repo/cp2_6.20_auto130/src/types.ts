export type TerrainTheme = 'grass' | 'stone' | 'dirt'

export type CellValue = 0 | 1

export type ObjectType = 'player' | 'spike' | 'movingPlatform' | 'coin'

export interface GameObject {
  id: string
  type: ObjectType
  gridX: number
  gridY: number
  offsetX?: number
  offsetY?: number
  platformRange?: number
  platformSpeed?: number
  platformDirection?: number
  platformOriginalX?: number
}

export interface LevelData {
  grid: CellValue[][]
  objects: GameObject[]
  terrainTheme: TerrainTheme
}

export interface PlayerState {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  onGround: boolean
}

export interface InputState {
  left: boolean
  right: boolean
  jump: boolean
}

export type ResourceType = 'wood' | 'stone' | 'metal' | 'food'

export type BuildingType = 'tower' | 'warehouse' | 'workshop' | 'wall'

export interface ResourcePoint {
  id: string
  type: ResourceType
  position: { x: number; y: number; z: number }
  collected: boolean
}

export interface TerrainData {
  vertices: number[]
  uvs: number[]
  indices: number[]
  heights: number[][]
  size: number
}

export interface Building {
  id: string
  type: BuildingType
  position: { x: number; y: number; z: number }
  chunkX: number
  chunkZ: number
}

export interface ResourceEvent {
  type: 'collect' | 'consume'
  resource: ResourceType
  amount: number
  currentValue: number
  previousValue: number
}

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  wood: '#8B4513',
  stone: '#808080',
  metal: '#C0C0C0',
  food: '#228B22'
}

export const RESOURCE_NAMES: Record<ResourceType, string> = {
  wood: '木材',
  stone: '石料',
  metal: '金属',
  food: '食物'
}

export const BUILDING_COSTS: Record<BuildingType, Partial<Record<ResourceType, number>>> = {
  tower: { wood: 5, stone: 3 },
  warehouse: { wood: 8, metal: 2 },
  workshop: { wood: 6, metal: 4 },
  wall: { stone: 10, wood: 3 }
}

export const BUILDING_NAMES: Record<BuildingType, string> = {
  tower: '瞭望塔',
  warehouse: '仓库',
  workshop: '工坊',
  wall: '城墙'
}

export interface ChunkCoord {
  x: number
  z: number
}

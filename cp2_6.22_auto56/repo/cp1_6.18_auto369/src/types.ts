export type ColorMode = 'original' | 'monochrome' | 'gradient'

export interface VoxelData {
  id: string
  gridX: number
  gridY: number
  gridZ: number
  worldX: number
  worldY: number
  worldZ: number
  color: [number, number, number]
  originalColor: [number, number, number]
}

export interface VoxelizationResult {
  voxels: VoxelData[]
  maxLayers: number
  boundingBox: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  }
}

export interface SelectedVoxelInfo {
  voxel: VoxelData
  screenX: number
  screenY: number
}

export interface TileCoord {
  lat: number
  lon: number
  lod: LODLevel
}

export type LODLevel = 0 | 1 | 2 | 3

export const LOD_RESOLUTIONS: Record<LODLevel, number> = {
  0: 512,
  1: 256,
  2: 128,
  3: 64,
} as const

export const LOD_DISTANCES: Record<LODLevel, number> = {
  0: 50,
  1: 150,
  2: 300,
  3: Infinity,
} as const

export interface ElevationResponse {
  lat: number
  lon: number
  width: number
  height: number
  elevations: number[]
}

export interface GeoSearchResult {
  name: string
  country: string
  lat: number
  lon: number
  displayName: string
}

export interface MeasurementPoint {
  position: { x: number; y: number; z: number }
  latLon: { lat: number; lon: number }
  elevation: number
}

export interface MeasurementResult {
  pointA: MeasurementPoint
  pointB: MeasurementPoint
  distance: number
  elevationDiff: number
}

export interface PerformanceStats {
  fps: number
  vertexCount: number
  lodLevel: LODLevel
}

export const TILE_SIZE = 1

export function tileKey(lat: number, lon: number, lod: LODLevel): string {
  return `${Math.floor(lat)}_${Math.floor(lon)}_${lod}`
}

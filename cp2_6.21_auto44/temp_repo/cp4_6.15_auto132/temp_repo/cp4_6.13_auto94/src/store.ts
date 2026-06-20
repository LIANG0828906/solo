import { create } from 'zustand'

export interface TerrainParams {
  roughness: number
  peakDensity: number
  smoothness: number
}

export interface ClickedPoint {
  x: number
  z: number
  row: number
  col: number
  worldX: number
  worldZ: number
  elevation: number
  slope: number
}

export interface ProfileData {
  distances: number[]
  elevations: number[]
  clickIndex: number
  minElevation: number
  maxElevation: number
}

interface TerrainStore {
  params: TerrainParams
  heightMap: Float32Array | null
  colorMap: Float32Array | null
  gridSize: number
  terrainSize: number
  clickedPoint: ClickedPoint | null
  profileData: ProfileData | null
  animationVersion: number
  
  setParams: (params: Partial<TerrainParams>) => void
  setHeightMap: (heightMap: Float32Array, colorMap: Float32Array) => void
  setClickedPoint: (point: ClickedPoint | null) => void
  setProfileData: (data: ProfileData | null) => void
  incrementAnimationVersion: () => void
}

export const useTerrainStore = create<TerrainStore>((set) => ({
  params: {
    roughness: 50,
    peakDensity: 5,
    smoothness: 3,
  },
  heightMap: null,
  colorMap: null,
  gridSize: 128,
  terrainSize: 50,
  clickedPoint: null,
  profileData: null,
  animationVersion: 0,

  setParams: (params) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),
  setHeightMap: (heightMap, colorMap) =>
    set({ heightMap, colorMap }),
  setClickedPoint: (point) =>
    set({ clickedPoint: point }),
  setProfileData: (data) =>
    set({ profileData: data }),
  incrementAnimationVersion: () =>
    set((state) => ({ animationVersion: state.animationVersion + 1 })),
}))

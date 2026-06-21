import { create } from 'zustand'
import { generateTerrain, ErosionParams, Snapshot } from '../utils/erosionModel'
export type { TerrainType } from '../utils/erosionModel'
import type { TerrainType } from '../utils/erosionModel'

export interface ProfilePoint {
  x: number
  y: number
}

export interface RipplePoint {
  id: number
  x: number
  y: number
  worldX: number
  worldZ: number
  startTime: number
}

interface TerrainState {
  gridSize: number
  terrainSize: number
  terrainType: TerrainType
  heightMap: Float32Array
  windSpeed: number
  waterFlow: number
  glacierStrength: number
  duration: number
  isSimulating: boolean
  simulationTime: number
  timeScale: number
  snapshots: Snapshot[]
  profilePoints: ProfilePoint[]
  fps: number
  ripples: RipplePoint[]

  setTerrainType: (type: TerrainType) => void
  setWindSpeed: (value: number) => void
  setWaterFlow: (value: number) => void
  setGlacierStrength: (value: number) => void
  setDuration: (value: number) => void
  startSimulation: () => void
  pauseSimulation: () => void
  resetSimulation: () => void
  setTimeScale: (scale: number) => void
  updateHeightMap: (data: Float32Array) => void
  saveSnapshot: (name?: string) => void
  clearSnapshots: () => void
  setProfilePoints: (points: ProfilePoint[]) => void
  setFps: (fps: number) => void
  addRipple: (ripple: { x: number; y: number; worldX: number; worldZ: number }) => void
  removeRipple: (id: number) => void
  getErosionParams: () => ErosionParams
}

const GRID_SIZE = 200
const TERRAIN_SIZE = 20

const initialHeightMap = generateTerrain('mountain', GRID_SIZE)

let rippleIdCounter = 0

export const useTerrainStore = create<TerrainState>((set, get) => ({
  gridSize: GRID_SIZE,
  terrainSize: TERRAIN_SIZE,
  terrainType: 'mountain',
  heightMap: initialHeightMap,
  windSpeed: 30,
  waterFlow: 20,
  glacierStrength: 0,
  duration: 50,
  isSimulating: false,
  simulationTime: 0,
  timeScale: 1,
  snapshots: [],
  profilePoints: [],
  fps: 60,
  ripples: [],

  setTerrainType: (type: TerrainType) => {
    const { gridSize } = get()
    const newHeightMap = generateTerrain(type, gridSize)
    set({
      terrainType: type,
      heightMap: newHeightMap,
      simulationTime: 0,
      isSimulating: false,
      profilePoints: []
    })
  },

  setWindSpeed: (value: number) => set({ windSpeed: value }),
  setWaterFlow: (value: number) => set({ waterFlow: value }),
  setGlacierStrength: (value: number) => set({ glacierStrength: value }),
  setDuration: (value: number) => set({ duration: value }),

  startSimulation: () => set({ isSimulating: true }),
  pauseSimulation: () => set({ isSimulating: false }),

  resetSimulation: () => {
    const { terrainType, gridSize } = get()
    const newHeightMap = generateTerrain(terrainType, gridSize)
    set({
      heightMap: newHeightMap,
      simulationTime: 0,
      isSimulating: false,
      profilePoints: []
    })
  },

  setTimeScale: (scale: number) => set({ timeScale: scale }),

  updateHeightMap: (data: Float32Array) => {
    const { simulationTime, timeScale } = get()
    set({
      heightMap: data,
      simulationTime: simulationTime + timeScale * 0.5
    })
  },

  saveSnapshot: (name?: string) => {
    const { heightMap, snapshots, windSpeed, waterFlow, glacierStrength, gridSize } = get()
    const snapshot: Snapshot = {
      id: Date.now().toString(),
      name: name || `快照 ${snapshots.length + 1}`,
      heightMap: new Float32Array(heightMap),
      timestamp: Date.now(),
      params: {
        windSpeed,
        waterFlow,
        glacierStrength,
        gridSize
      }
    }
    set({ snapshots: [...snapshots, snapshot] })
  },

  clearSnapshots: () => set({ snapshots: [] }),

  setProfilePoints: (points: ProfilePoint[]) => set({ profilePoints: points }),

  setFps: (fps: number) => set({ fps }),

  addRipple: (ripple: { x: number; y: number; worldX: number; worldZ: number }) => {
    const id = rippleIdCounter++
    const newRipple: RipplePoint = {
      ...ripple,
      id,
      startTime: Date.now()
    }
    set((state) => ({ ripples: [...state.ripples, newRipple] }))
    
    setTimeout(() => {
      get().removeRipple(id)
    }, 1000)
  },

  removeRipple: (id: number) => {
    set((state) => ({ ripples: state.ripples.filter((r) => r.id !== id) }))
  },

  getErosionParams: (): ErosionParams => {
    const { windSpeed, waterFlow, glacierStrength, gridSize } = get()
    return {
      windSpeed,
      waterFlow,
      glacierStrength,
      gridSize
    }
  }
}))

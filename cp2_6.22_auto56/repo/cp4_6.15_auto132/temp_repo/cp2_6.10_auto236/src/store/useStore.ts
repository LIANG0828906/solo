import { create } from 'zustand'
import * as THREE from 'three'

export interface EchoData {
  id: number
  intensity: number
  distance: number
  angle: number
  timestamp: number
}

export interface SonarProbe {
  id: number
  position: THREE.Vector3
  radius: number
  maxRadius: number
  speed: number
  active: boolean
  createdAt: number
}

export interface TerrainPoint {
  position: THREE.Vector3
  normal: THREE.Vector3
  type: 'mountain' | 'trench' | 'plain'
  height: number
}

interface StoreState {
  sonarProbes: SonarProbe[]
  echoHistory: EchoData[]
  waveFrequency: number
  isPlacingSonar: boolean
  terrainPoints: TerrainPoint[]
  heatmapData: Map<string, number>
  addSonarProbe: (position: THREE.Vector3) => void
  updateProbeRadius: (id: number, radius: number) => void
  removeProbe: (id: number) => void
  addEchoData: (data: Omit<EchoData, 'id' | 'timestamp'>) => void
  setWaveFrequency: (freq: number) => void
  setIsPlacingSonar: (placing: boolean) => void
  setTerrainPoints: (points: TerrainPoint[]) => void
  updateHeatmap: (key: string, value: number) => void
  resetScene: () => void
}

const generateId = () => Date.now() + Math.random() * 1000

export const useStore = create<StoreState>((set) => ({
  sonarProbes: [],
  echoHistory: [],
  waveFrequency: 2,
  isPlacingSonar: false,
  terrainPoints: [],
  heatmapData: new Map(),

  addSonarProbe: (position) =>
    set((state) => ({
      sonarProbes: [
        ...state.sonarProbes,
        {
          id: generateId(),
          position: position.clone(),
          radius: 0,
          maxRadius: 100,
          speed: state.waveFrequency * 5,
          active: true,
          createdAt: Date.now()
        }
      ]
    })),

  updateProbeRadius: (id, radius) =>
    set((state) => ({
      sonarProbes: state.sonarProbes.map((probe) =>
        probe.id === id ? { ...probe, radius, active: radius < probe.maxRadius } : probe
      )
    })),

  removeProbe: (id) =>
    set((state) => ({
      sonarProbes: state.sonarProbes.filter((probe) => probe.id !== id)
    })),

  addEchoData: (data) =>
    set((state) => ({
      echoHistory: [
        { ...data, id: generateId(), timestamp: Date.now() },
        ...state.echoHistory
      ].slice(0, 5)
    })),

  setWaveFrequency: (freq) => set({ waveFrequency: freq }),

  setIsPlacingSonar: (placing) => set({ isPlacingSonar: placing }),

  setTerrainPoints: (points) => set({ terrainPoints: points }),

  updateHeatmap: (key, value) =>
    set((state) => {
      const newHeatmap = new Map(state.heatmapData)
      const current = newHeatmap.get(key) || 0
      newHeatmap.set(key, Math.max(current, value))
      return { heatmapData: newHeatmap }
    }),

  resetScene: () =>
    set({
      sonarProbes: [],
      echoHistory: [],
      heatmapData: new Map(),
      isPlacingSonar: false
    })
}))

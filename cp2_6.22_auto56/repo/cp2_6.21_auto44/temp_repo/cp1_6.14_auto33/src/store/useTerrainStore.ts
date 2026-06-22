import { create } from 'zustand'

export type ViewMode = 'first' | 'third'

export type TerrainConfig = {
  heightScale: number
  frequency: number
  vegetationDensity: number
  lightAngle: number
  viewMode: ViewMode
  seed: number
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
}

type TerrainStore = TerrainConfig & {
  setHeightScale: (value: number) => void
  setFrequency: (value: number) => void
  setVegetationDensity: (value: number) => void
  setLightAngle: (value: number) => void
  setViewMode: (value: ViewMode) => void
  setSeed: (value: number) => void
  setCameraPosition: (value: [number, number, number]) => void
  setCameraTarget: (value: [number, number, number]) => void
  setFogDensity: (value: number) => void
  applyConfig: (config: Partial<TerrainConfig>) => void
  randomizeSeed: () => void
  configVersion: number
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export const useTerrainStore = create<TerrainStore>((set) => ({
  heightScale: 2.0,
  frequency: 3.0,
  vegetationDensity: 50,
  lightAngle: 135,
  viewMode: 'first',
  seed: Math.floor(Math.random() * 100000),
  cameraPosition: [0, 1.7, 15],
  cameraTarget: [0, 1.7, 0],

  setHeightScale: (value) =>
    set({ heightScale: clamp(value, 0.1, 5.0) }),

  setFrequency: (value) =>
    set({ frequency: clamp(value, 1, 10) }),

  setVegetationDensity: (value) =>
    set({ vegetationDensity: clamp(value, 0, 100) }),

  setLightAngle: (value) =>
    set({ lightAngle: clamp(value, 0, 360) }),

  setViewMode: (value) =>
    set({ viewMode: value }),

  setSeed: (value) =>
    set({ seed: value }),

  setCameraPosition: (value) =>
    set({ cameraPosition: value }),

  setCameraTarget: (value) =>
    set({ cameraTarget: value }),

  applyConfig: (config) =>
    set((state) => {
      const next = { ...state }
      if (config.heightScale !== undefined)
        next.heightScale = clamp(config.heightScale, 0.1, 5.0)
      if (config.frequency !== undefined)
        next.frequency = clamp(config.frequency, 1, 10)
      if (config.vegetationDensity !== undefined)
        next.vegetationDensity = clamp(config.vegetationDensity, 0, 100)
      if (config.lightAngle !== undefined)
        next.lightAngle = clamp(config.lightAngle, 0, 360)
      if (config.viewMode !== undefined)
        next.viewMode = config.viewMode
      if (config.seed !== undefined)
        next.seed = config.seed
      if (config.cameraPosition !== undefined)
        next.cameraPosition = config.cameraPosition
      if (config.cameraTarget !== undefined)
        next.cameraTarget = config.cameraTarget
      return next
    }),

  randomizeSeed: () =>
    set({ seed: Math.floor(Math.random() * 100000) }),
}))

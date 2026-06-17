import { create } from 'zustand'
import { TreeParticle, EnvironmentParams } from './forestSim'

interface ForestState {
  light: number
  humidity: number
  temperature: number
  trees: TreeParticle[]
  particleCount: number
  setLight: (value: number) => void
  setHumidity: (value: number) => void
  setTemperature: (value: number) => void
  setTrees: (trees: TreeParticle[]) => void
  setParticleCount: (count: number) => void
  getEnvParams: () => EnvironmentParams
}

export const useForestStore = create<ForestState>((set, get) => ({
  light: 60,
  humidity: 50,
  temperature: 20,
  trees: [],
  particleCount: 0,
  setLight: (value) => set({ light: value }),
  setHumidity: (value) => set({ humidity: value }),
  setTemperature: (value) => set({ temperature: value }),
  setTrees: (trees) => set({ trees }),
  setParticleCount: (count) => set({ particleCount: count }),
  getEnvParams: () => ({
    light: get().light,
    humidity: get().humidity,
    temperature: get().temperature,
  }),
}))

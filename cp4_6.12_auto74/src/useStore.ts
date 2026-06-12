import { create } from 'zustand'

interface RockDensities {
  sandstone: number
  mudstone: number
  granite: number
}

interface SeismicWaveData {
  id: number
  startTime: number
  origin: [number, number, number]
  magnitude: number
}

interface StoreState {
  slipAmount: number
  densities: RockDensities
  isPlaying: boolean
  playDirection: number
  waves: SeismicWaveData[]
  waveIdCounter: number
  lastWaveTriggerSlip: number
  setSlipAmount: (value: number) => void
  setDensity: (rockType: keyof RockDensities, value: number) => void
  setIsPlaying: (value: boolean) => void
  setPlayDirection: (value: number) => void
  addWave: (origin: [number, number, number], magnitude: number) => void
  removeWave: (id: number) => void
  setLastWaveTriggerSlip: (value: number) => void
  reset: () => void
}

const DEFAULT_DENSITIES: RockDensities = {
  sandstone: 1.2,
  mudstone: 1.5,
  granite: 2.3
}

export const useStore = create<StoreState>((set) => ({
  slipAmount: 0,
  densities: { ...DEFAULT_DENSITIES },
  isPlaying: false,
  playDirection: 1,
  waves: [],
  waveIdCounter: 0,
  lastWaveTriggerSlip: 0,
  setSlipAmount: (value) => set({ slipAmount: value }),
  setDensity: (rockType, value) =>
    set((state) => ({
      densities: { ...state.densities, [rockType]: value }
    })),
  setIsPlaying: (value) => set({ isPlaying: value }),
  setPlayDirection: (value) => set({ playDirection: value }),
  addWave: (origin, magnitude) =>
    set((state) => ({
      waves: [
        ...state.waves,
        {
          id: state.waveIdCounter,
          startTime: performance.now(),
          origin,
          magnitude
        }
      ],
      waveIdCounter: state.waveIdCounter + 1
    })),
  removeWave: (id) =>
    set((state) => ({
      waves: state.waves.filter((w) => w.id !== id)
    })),
  setLastWaveTriggerSlip: (value) => set({ lastWaveTriggerSlip: value }),
  reset: () =>
    set({
      slipAmount: 0,
      densities: { ...DEFAULT_DENSITIES },
      isPlaying: false,
      playDirection: 1,
      waves: [],
      lastWaveTriggerSlip: 0
    })
}))

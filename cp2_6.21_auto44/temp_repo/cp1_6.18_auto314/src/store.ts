import { create } from 'zustand'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

interface ParticleInfo {
  index: number
  position: [number, number, number]
  speed: number
}

interface WindStore {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  currentTime: number
  season: Season
  intensity: number
  timeScale: number
  cameraRotationX: number
  cameraRotationY: number
  cameraZoom: number
  selectedParticle: ParticleInfo | null
  averageSpeed: number
  activeRatio: number
  workerReady: boolean
  updateParticles: (positions: Float32Array, colors: Float32Array, sizes: Float32Array) => void
  setSeason: (season: Season) => void
  setIntensity: (intensity: number) => void
  setTimeScale: (scale: number) => void
  setCameraRotation: (x: number, y: number) => void
  setCameraZoom: (zoom: number) => void
  setSelectedParticle: (info: ParticleInfo | null) => void
  setAverageSpeed: (speed: number) => void
  setActiveRatio: (ratio: number) => void
  setWorkerReady: (ready: boolean) => void
  tickTime: (delta: number) => void
}

export const useWindStore = create<WindStore>((set) => ({
  positions: new Float32Array(3000 * 6),
  colors: new Float32Array(3000 * 6),
  sizes: new Float32Array(3000),
  currentTime: 0,
  season: 'spring',
  intensity: 0.7,
  timeScale: 1,
  cameraRotationX: 0,
  cameraRotationY: 0.5,
  cameraZoom: 1,
  selectedParticle: null,
  averageSpeed: 0,
  activeRatio: 1,
  workerReady: false,
  updateParticles: (positions, colors, sizes) => set({ positions, colors, sizes }),
  setSeason: (season) => set({ season }),
  setIntensity: (intensity) => set({ intensity }),
  setTimeScale: (timeScale) => set({ timeScale }),
  setCameraRotation: (x, y) => set({ cameraRotationX: x, cameraRotationY: y }),
  setCameraZoom: (cameraZoom) => set({ cameraZoom }),
  setSelectedParticle: (selectedParticle) => set({ selectedParticle }),
  setAverageSpeed: (averageSpeed) => set({ averageSpeed }),
  setActiveRatio: (activeRatio) => set({ activeRatio }),
  setWorkerReady: (workerReady) => set({ workerReady }),
  tickTime: (delta) => set((state) => ({ currentTime: state.currentTime + delta * state.timeScale })),
}))

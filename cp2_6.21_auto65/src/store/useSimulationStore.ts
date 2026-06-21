import { create } from 'zustand'

type SeasonPreset = 'vernal' | 'summer' | 'autumnal' | 'winter'

const SEASON_TO_DECLINATION: Record<SeasonPreset, number> = {
  vernal: 0,
  summer: 23.5,
  autumnal: 0,
  winter: -23.5,
}

interface SimulationState {
  time: number
  cameraPosition: [number, number, number]
  selectedLat: number | null
  selectedLon: number | null
  isPlaying: boolean
  seasonPreset: SeasonPreset
  sunDeclination: number

  setTime: (t: number) => void
  setCameraPosition: (pos: [number, number, number]) => void
  setSelectedPosition: (lat: number | null, lon: number | null) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  resetCamera: () => void
  setSeasonPreset: (preset: SeasonPreset) => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  time: 720,
  cameraPosition: [0, 0, 2.5],
  selectedLat: null,
  selectedLon: null,
  isPlaying: false,
  seasonPreset: 'vernal',
  sunDeclination: 0,

  setTime: (t: number) => set({ time: ((t % 1440) + 1440) % 1440 }),
  setCameraPosition: (pos: [number, number, number]) => set({ cameraPosition: pos }),
  setSelectedPosition: (lat: number | null, lon: number | null) => set({ selectedLat: lat, selectedLon: lon }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  resetCamera: () => set({ cameraPosition: [0, 0, 2.5] }),
  setSeasonPreset: (preset: SeasonPreset) => set({ seasonPreset: preset, sunDeclination: SEASON_TO_DECLINATION[preset] }),
}))

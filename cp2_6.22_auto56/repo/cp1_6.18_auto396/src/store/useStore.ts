import { create } from 'zustand'
import { PLANETS } from '@/data/planets'
import type { StoreState, ViewMode } from '@/types'

export const useStore = create<StoreState>((set) => ({
  planets: PLANETS,
  selectedPlanetId: null,
  viewMode: 'distance',
  showOrbits: true,
  cameraTarget: [0, 0, 0],

  selectPlanet: (id: string | null) => {
    set({ selectedPlanetId: id })
  },

  setViewMode: (mode: ViewMode) => {
    set({
      viewMode: mode,
      showOrbits: mode === 'distance',
    })
  },

  toggleOrbits: () => {
    set((state) => ({ showOrbits: !state.showOrbits }))
  },

  setCameraTarget: (target: [number, number, number]) => {
    set({ cameraTarget: target })
  },
}))

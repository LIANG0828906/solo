import { create } from 'zustand'
import type { ViewerState } from '@/types'

export const useStore = create<ViewerState>((set) => ({
  selectedPdbId: '1BRS',
  pdbData: null,
  selectedResidueId: null,
  renderStyle: 'cartoon',
  showSideChains: false,
  ssaoIntensity: 50,
  backgroundColor: '#0F172A',
  facingResidueRange: null,
  setSelectedPdbId: (id) => set({ selectedPdbId: id, selectedResidueId: null }),
  setPdbData: (data) => set({ pdbData: data }),
  setSelectedResidueId: (id) => set({ selectedResidueId: id }),
  setRenderStyle: (style) => set({ renderStyle: style }),
  setShowSideChains: (show) => set({ showSideChains: show }),
  setSsaoIntensity: (intensity) => set({ ssaoIntensity: intensity }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setFacingResidueRange: (range) => set({ facingResidueRange: range }),
}))

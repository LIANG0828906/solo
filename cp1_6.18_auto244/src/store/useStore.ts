import { create } from 'zustand'
import { DynamicMode, SelectedParticleInfo, StoreState } from '../modules/particle/types'

export const useStore = create<StoreState>((set) => ({
  dynamicMode: 'free',
  selectedParticle: null,
  activeConstellation: null,
  engineRef: null,
  setDynamicMode: (mode: DynamicMode) => set({ dynamicMode: mode }),
  setSelectedParticle: (info: SelectedParticleInfo | null) => set({ selectedParticle: info }),
  setActiveConstellation: (id: string | null) => set({ activeConstellation: id }),
}))

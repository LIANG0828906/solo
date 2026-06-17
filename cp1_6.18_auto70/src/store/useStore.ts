import { create } from 'zustand'
import type { Atom, Bond, Molecule } from '@/models/Molecule'
import { getMoleculeById, MOLECULE_PRESETS } from '@/models/Molecule'

interface HoverInfo {
  atom: Atom | null
  bond: Bond | null
  screenX: number
  screenY: number
}

interface AppState {
  currentMoleculeId: string
  currentMolecule: Molecule
  hoverInfo: HoverInfo
  autoRotate: boolean
  clipPlaneY: number
  clipEnabled: boolean
  isTransitioning: boolean

  setMolecule: (id: string) => void
  setHoverInfo: (info: HoverInfo) => void
  clearHover: () => void
  toggleAutoRotate: () => void
  setClipPlaneY: (y: number) => void
  setClipEnabled: (enabled: boolean) => void
  setTransitioning: (v: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  currentMoleculeId: 'dna',
  currentMolecule: MOLECULE_PRESETS[0],
  hoverInfo: { atom: null, bond: null, screenX: 0, screenY: 0 },
  autoRotate: true,
  clipPlaneY: -5,
  clipEnabled: true,
  isTransitioning: false,

  setMolecule: (id: string) => {
    const mol = getMoleculeById(id)
    if (mol) {
      set({ isTransitioning: true })
      setTimeout(() => {
        set({
          currentMoleculeId: id,
          currentMolecule: mol,
          hoverInfo: { atom: null, bond: null, screenX: 0, screenY: 0 },
          isTransitioning: false,
        })
      }, 300)
    }
  },

  setHoverInfo: (info: HoverInfo) => set({ hoverInfo: info }),
  clearHover: () => set({ hoverInfo: { atom: null, bond: null, screenX: 0, screenY: 0 } }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  setClipPlaneY: (y: number) => set({ clipPlaneY: y }),
  setClipEnabled: (enabled: boolean) => set({ clipEnabled: enabled }),
  setTransitioning: (v: boolean) => set({ isTransitioning: v }),
}))

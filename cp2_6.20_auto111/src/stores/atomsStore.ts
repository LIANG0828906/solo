import { create } from 'zustand'
import type { Atom, Molecule } from '../data/molecules'
import { MOLECULES } from '../data/molecules'

export type DisplayMode = 'ballstick' | 'spacefill' | 'wireframe'

export interface Annotation {
  id: string
  atomId: string
  note: string
  createdAt: number
}

interface HoveredAtom {
  atom: Atom
  screenPosition: { x: number; y: number }
}

interface AtomsState {
  selectedMoleculeId: string
  molecule: Molecule
  displayMode: DisplayMode
  rotationSpeed: number
  autoRotate: boolean
  annotations: Annotation[]
  highlightedAtomId: string | null
  hoveredAtom: HoveredAtom | null
  selectedAtomId: string | null
  resetTrigger: number

  setSelectedMoleculeId: (id: string) => void
  setDisplayMode: (mode: DisplayMode) => void
  setRotationSpeed: (speed: number) => void
  setAutoRotate: (auto: boolean) => void
  addAnnotation: (atomId: string, note: string) => void
  updateAnnotation: (id: string, note: string) => void
  deleteAnnotation: (id: string) => void
  setHighlightedAtomId: (id: string | null) => void
  setHoveredAtom: (hovered: HoveredAtom | null) => void
  setSelectedAtomId: (id: string | null) => void
  resetView: () => void
  getAnnotationByAtomId: (atomId: string) => Annotation | undefined
}

export const useAtomsStore = create<AtomsState>((set, get) => ({
  selectedMoleculeId: MOLECULES[0].id,
  molecule: MOLECULES[0],
  displayMode: 'ballstick',
  rotationSpeed: 1,
  autoRotate: false,
  annotations: [],
  highlightedAtomId: null,
  hoveredAtom: null,
  selectedAtomId: null,
  resetTrigger: 0,

  setSelectedMoleculeId: (id) => {
    const molecule = MOLECULES.find((m) => m.id === id) || MOLECULES[0]
    set({
      selectedMoleculeId: id,
      molecule,
      annotations: [],
      highlightedAtomId: null,
      hoveredAtom: null,
      selectedAtomId: null,
    })
  },

  setDisplayMode: (mode) => set({ displayMode: mode }),

  setRotationSpeed: (speed) => set({ rotationSpeed: speed }),

  setAutoRotate: (auto) => set({ autoRotate: auto }),

  addAnnotation: (atomId, note) => {
    const existing = get().annotations.find((a) => a.atomId === atomId)
    if (existing) {
      set({
        annotations: get().annotations.map((a) =>
          a.atomId === atomId ? { ...a, note } : a
        ),
      })
    } else {
      set({
        annotations: [
          ...get().annotations,
          {
            id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            atomId,
            note,
            createdAt: Date.now(),
          },
        ],
      })
    }
  },

  updateAnnotation: (id, note) => {
    set({
      annotations: get().annotations.map((a) =>
        a.id === id ? { ...a, note } : a
      ),
    })
  },

  deleteAnnotation: (id) => {
    set({
      annotations: get().annotations.filter((a) => a.id !== id),
    })
    const currentHighlighted = get().highlightedAtomId
    const annotation = get().annotations.find((a) => a.id === id)
    if (annotation && currentHighlighted === annotation.atomId) {
      set({ highlightedAtomId: null })
    }
  },

  setHighlightedAtomId: (id) => set({ highlightedAtomId: id }),

  setHoveredAtom: (hovered) => set({ hoveredAtom: hovered }),

  setSelectedAtomId: (id) => set({ selectedAtomId: id }),

  resetView: () => {
    set((state) => ({ resetTrigger: state.resetTrigger + 1 }))
  },

  getAnnotationByAtomId: (atomId) => {
    return get().annotations.find((a) => a.atomId === atomId)
  },
}))

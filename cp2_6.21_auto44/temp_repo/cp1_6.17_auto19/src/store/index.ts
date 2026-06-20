import { create } from 'zustand'
import moleculesData from '@/data/molecules.json'

export interface Atom {
  element: string
  x: number
  y: number
  z: number
  radius: number
  color: string
}

export interface Bond {
  from: number
  to: number
  order: number
}

export interface Molecule {
  id: string
  name: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}

interface MoleculeState {
  currentMoleculeId: string
  cameraDistance: number
  rotationY: number
  rotationX: number
  showLabels: boolean
  autoRotate: boolean
  molecules: Molecule[]

  setCurrentMolecule: (id: string) => void
  setCameraDistance: (distance: number) => void
  setRotationY: (angle: number) => void
  setRotationX: (angle: number) => void
  toggleLabels: () => void
  setShowLabels: (show: boolean) => void
  toggleAutoRotate: () => void
  resetView: () => void
  getCurrentMolecule: () => Molecule | undefined
}

export const useMoleculeStore = create<MoleculeState>((set, get) => ({
  currentMoleculeId: 'water',
  cameraDistance: 10,
  rotationY: 0,
  rotationX: 0,
  showLabels: true,
  autoRotate: true,
  molecules: moleculesData.molecules as Molecule[],

  setCurrentMolecule: (id: string) => set({ currentMoleculeId: id }),
  setCameraDistance: (distance: number) => set({ cameraDistance: distance }),
  setRotationY: (angle: number) => set({ rotationY: angle }),
  setRotationX: (angle: number) => set({ rotationX: angle }),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  setShowLabels: (show: boolean) => set({ showLabels: show }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  resetView: () => set({
    cameraDistance: 10,
    rotationY: 0,
    rotationX: 0,
  }),
  getCurrentMolecule: () => {
    const state = get()
    return state.molecules.find(m => m.id === state.currentMoleculeId)
  },
}))

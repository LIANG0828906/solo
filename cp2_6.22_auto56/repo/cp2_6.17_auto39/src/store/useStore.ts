import { create } from 'zustand'
import type { MoleculeData, AtomData } from '../types'
import { sampleMolecule } from '../data/sampleMolecule'

interface MoleculeState {
  molecule: MoleculeData
  selectedAtomId: number | null
  rotationY: number
  isAutoRotating: boolean
  isDragging: boolean
  atomScale: number

  setMolecule: (molecule: MoleculeData) => void
  setSelectedAtom: (atomId: number | null) => void
  setRotationY: (rotation: number) => void
  setAutoRotating: (auto: boolean) => void
  setDragging: (dragging: boolean) => void
  setAtomScale: (scale: number) => void
  getSelectedAtom: () => AtomData | null
  getConnectedAtoms: (atomId: number) => AtomData[]
}

export const useStore = create<MoleculeState>((set, get) => ({
  molecule: sampleMolecule,
  selectedAtomId: null,
  rotationY: 0,
  isAutoRotating: true,
  isDragging: false,
  atomScale: 1,

  setMolecule: (molecule) => set({ molecule, selectedAtomId: null }),
  setSelectedAtom: (atomId) => set({ selectedAtomId: atomId }),
  setRotationY: (rotation) => set({ rotationY: rotation }),
  setAutoRotating: (auto) => set({ isAutoRotating: auto }),
  setDragging: (dragging) => set({ isDragging: dragging }),
  setAtomScale: (scale) => set({ atomScale: scale }),

  getSelectedAtom: () => {
    const { molecule, selectedAtomId } = get()
    if (selectedAtomId === null) return null
    return molecule.atoms.find((a) => a.id === selectedAtomId) || null
  },

  getConnectedAtoms: (atomId) => {
    const { molecule } = get()
    const connectedIds = new Set<number>()
    molecule.bonds.forEach((bond) => {
      if (bond.atom1 === atomId) connectedIds.add(bond.atom2)
      if (bond.atom2 === atomId) connectedIds.add(bond.atom1)
    })
    return molecule.atoms.filter((a) => connectedIds.has(a.id))
  },
}))

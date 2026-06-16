import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  AtomData,
  BondData,
  MoleculeData,
  parseMOL,
  parseSDF,
  toMOL,
  getCaffeineMolecule,
} from './MoleculeData'

export interface MoleculeStore {
  molecule: MoleculeData
  selectedAtomId: string | null
  bondEditMode: boolean
  firstBondAtomId: string | null
  selectedBondId: string | null
  atomTargetPositions: Map<string, { x: number; y: number; z: number }>

  setMolecule(mol: MoleculeData): void
  selectAtom(id: string | null): void
  updateAtomPosition(id: string, x: number, y: number, z: number): void
  setAtomTarget(id: string, x: number, y: number, z: number): void
  toggleBondEditMode(): void
  setFirstBondAtom(id: string | null): void
  selectBond(id: string | null): void
  cycleBondType(bondId: string): void
  createBond(atom1Id: string, atom2Id: string, type?: 1 | 2 | 3 | 4): void
  removeBond(bondId: string): void
  importMOL(text: string): boolean
  exportMOL(): string
  resetView(): void
}

export const useMoleculeStore = create<MoleculeStore>((set, get) => ({
  molecule: getCaffeineMolecule(),
  selectedAtomId: null,
  bondEditMode: false,
  firstBondAtomId: null,
  selectedBondId: null,
  atomTargetPositions: new Map(),

  setMolecule: (mol: MoleculeData) => {
    set({
      molecule: mol,
      selectedAtomId: null,
      selectedBondId: null,
      firstBondAtomId: null,
      atomTargetPositions: new Map(),
    })
  },

  selectAtom: (id: string | null) => {
    const state = get()

    if (!state.bondEditMode) {
      const newId = state.selectedAtomId === id ? null : id
      set({
        selectedAtomId: newId,
        selectedBondId: null,
      })
      return
    }

    if (id === null) {
      set({
        selectedAtomId: null,
      })
      return
    }

    if (state.firstBondAtomId === null) {
      set({
        firstBondAtomId: id,
        selectedAtomId: id,
      })
    } else {
      if (state.firstBondAtomId === id) {
        set({
          firstBondAtomId: null,
          selectedAtomId: null,
        })
        return
      }

      const existingBond = state.molecule.bonds.find(
        (b) =>
          (b.atom1Id === state.firstBondAtomId && b.atom2Id === id) ||
          (b.atom1Id === id && b.atom2Id === state.firstBondAtomId)
      )

      let targetBondId: string
      if (existingBond) {
        targetBondId = existingBond.id
      } else {
        targetBondId = uuidv4()
        const newBond: BondData = {
          id: targetBondId,
          atom1Id: state.firstBondAtomId,
          atom2Id: id,
          type: 1,
        }
        set({
          molecule: {
            ...state.molecule,
            bonds: [...state.molecule.bonds, newBond],
          },
        })
      }

      const currentBond = get().molecule.bonds.find((b) => b.id === targetBondId)
      if (currentBond) {
        const nextType = ((currentBond.type % 4) + 1) as 1 | 2 | 3 | 4
        set({
          molecule: {
            ...get().molecule,
            bonds: get().molecule.bonds.map((b) =>
              b.id === targetBondId ? { ...b, type: nextType } : b
            ),
          },
          firstBondAtomId: null,
          selectedAtomId: null,
          selectedBondId: targetBondId,
        })
      } else {
        set({
          firstBondAtomId: null,
          selectedAtomId: null,
          selectedBondId: targetBondId,
        })
      }
    }
  },

  updateAtomPosition: (id: string, x: number, y: number, z: number) => {
    const state = get()
    set({
      molecule: {
        ...state.molecule,
        atoms: state.molecule.atoms.map((a) =>
          a.id === id ? { ...a, x, y, z } : a
        ),
      },
    })
  },

  setAtomTarget: (id: string, x: number, y: number, z: number) => {
    const state = get()
    const newMap = new Map(state.atomTargetPositions)
    newMap.set(id, { x, y, z })
    set({ atomTargetPositions: newMap })
  },

  toggleBondEditMode: () => {
    const state = get()
    set({
      bondEditMode: !state.bondEditMode,
      firstBondAtomId: null,
      selectedBondId: null,
      selectedAtomId: null,
    })
  },

  setFirstBondAtom: (id: string | null) => {
    set({ firstBondAtomId: id })
  },

  selectBond: (id: string | null) => {
    set({
      selectedBondId: id,
      selectedAtomId: null,
    })
  },

  cycleBondType: (bondId: string) => {
    const state = get()
    set({
      molecule: {
        ...state.molecule,
        bonds: state.molecule.bonds.map((b) =>
          b.id === bondId
            ? { ...b, type: ((b.type % 4) + 1) as 1 | 2 | 3 | 4 }
            : b
        ),
      },
    })
  },

  createBond: (atom1Id: string, atom2Id: string, type: 1 | 2 | 3 | 4 = 1) => {
    const state = get()
    const exists = state.molecule.bonds.some(
      (b) =>
        (b.atom1Id === atom1Id && b.atom2Id === atom2Id) ||
        (b.atom1Id === atom2Id && b.atom2Id === atom1Id)
    )
    if (exists) return

    const newBond: BondData = {
      id: uuidv4(),
      atom1Id,
      atom2Id,
      type,
    }
    set({
      molecule: {
        ...state.molecule,
        bonds: [...state.molecule.bonds, newBond],
      },
    })
  },

  removeBond: (bondId: string) => {
    const state = get()
    set({
      molecule: {
        ...state.molecule,
        bonds: state.molecule.bonds.filter((b) => b.id !== bondId),
      },
      selectedBondId: state.selectedBondId === bondId ? null : state.selectedBondId,
    })
  },

  importMOL: (text: string): boolean => {
    let mol: MoleculeData | null = null
    try {
      mol = parseMOL(text)
    } catch {
      try {
        mol = parseSDF(text)
      } catch (e) {
        throw e
      }
    }
    if (mol) {
      get().setMolecule(mol)
      return true
    }
    return false
  },

  exportMOL: (): string => {
    return toMOL(get().molecule)
  },

  resetView: () => {},
}))

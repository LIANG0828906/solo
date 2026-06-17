import { create } from 'zustand'

export type AtomType = 'carbon' | 'hydrogen' | 'oxygen'

export interface Atom {
  id: string
  type: AtomType
  x: number
  y: number
  z: number
  isDragging: boolean
}

export interface Bond {
  id: string
  atom1Id: string
  atom2Id: string
  order: 1 | 2 | 3
}

export interface MoleculeTemplate {
  name: string
  formula: string
  atoms: { type: AtomType; count: number }[]
  connections: { from: number; to: number; order: 1 | 2 | 3 }[]
}

export const MOLECULE_TEMPLATES: MoleculeTemplate[] = [
  {
    name: '水分子 (H₂O)',
    formula: 'H2O',
    atoms: [
      { type: 'oxygen', count: 1 },
      { type: 'hydrogen', count: 2 }
    ],
    connections: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 }
    ]
  },
  {
    name: '二氧化碳 (CO₂)',
    formula: 'CO2',
    atoms: [
      { type: 'carbon', count: 1 },
      { type: 'oxygen', count: 2 }
    ],
    connections: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 }
    ]
  },
  {
    name: '甲烷 (CH₄)',
    formula: 'CH4',
    atoms: [
      { type: 'carbon', count: 1 },
      { type: 'hydrogen', count: 4 }
    ],
    connections: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 }
    ]
  },
  {
    name: '氧气 (O₂)',
    formula: 'O2',
    atoms: [{ type: 'oxygen', count: 2 }],
    connections: [{ from: 0, to: 1, order: 2 }]
  },
  {
    name: '氢气 (H₂)',
    formula: 'H2',
    atoms: [{ type: 'hydrogen', count: 2 }],
    connections: [{ from: 0, to: 1, order: 1 }]
  }
]

export const ATOM_CONFIG: Record<AtomType, { radius: number; color: string; name: string }> = {
  carbon: { radius: 30, color: '#4A5568', name: '碳 (C)' },
  hydrogen: { radius: 18, color: '#E2E8F0', name: '氢 (H)' },
  oxygen: { radius: 24, color: '#FC8181', name: '氧 (O)' }
}

export interface ValidationResult {
  success: boolean
  matchedName?: string
  mismatchedCount?: number
}

interface MoleculeState {
  atoms: Atom[]
  bonds: Bond[]
  selectedAtomType: AtomType | null
  validationResult: ValidationResult | null
  addAtom: (type: AtomType, x: number, y: number, z: number) => void
  removeAtom: (id: string) => void
  updateAtomPosition: (id: string, x: number, y: number, z: number) => void
  setAtomDragging: (id: string, isDragging: boolean) => void
  connectAtoms: (atom1Id: string, atom2Id: string) => void
  changeBondOrder: (bondId: string) => void
  setSelectedAtomType: (type: AtomType | null) => void
  validateMolecule: () => void
  clearValidation: () => void
  resetScene: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 11)

export const useMoleculeStore = create<MoleculeState>((set, get) => ({
  atoms: [],
  bonds: [],
  selectedAtomType: null,
  validationResult: null,

  addAtom: (type, x, y, z) => {
    const newAtom: Atom = {
      id: generateId(),
      type,
      x,
      y,
      z,
      isDragging: false
    }
    set((state) => ({ atoms: [...state.atoms, newAtom] }))
  },

  removeAtom: (id) => {
    set((state) => ({
      atoms: state.atoms.filter((a) => a.id !== id),
      bonds: state.bonds.filter((b) => b.atom1Id !== id && b.atom2Id !== id)
    }))
  },

  updateAtomPosition: (id, x, y, z) => {
    set((state) => ({
      atoms: state.atoms.map((a) =>
        a.id === id ? { ...a, x, y, z } : a
      )
    }))
  },

  setAtomDragging: (id, isDragging) => {
    set((state) => ({
      atoms: state.atoms.map((a) =>
        a.id === id ? { ...a, isDragging } : a
      )
    }))
  },

  connectAtoms: (atom1Id, atom2Id) => {
    const { bonds } = get()
    const existingBond = bonds.find(
      (b) =>
        (b.atom1Id === atom1Id && b.atom2Id === atom2Id) ||
        (b.atom1Id === atom2Id && b.atom2Id === atom1Id)
    )
    if (existingBond) return

    const newBond: Bond = {
      id: generateId(),
      atom1Id,
      atom2Id,
      order: 1
    }
    set((state) => ({ bonds: [...state.bonds, newBond] }))
  },

  changeBondOrder: (bondId) => {
    set((state) => ({
      bonds: state.bonds.map((b) =>
        b.id === bondId
          ? { ...b, order: ((b.order % 3) + 1) as 1 | 2 | 3 }
          : b
      )
    }))
  },

  setSelectedAtomType: (type) => set({ selectedAtomType: type }),

  validateMolecule: () => {
    const { atoms, bonds } = get()
    
    if (atoms.length === 0) {
      set({ validationResult: { success: false, mismatchedCount: 0 } })
      return
    }

    const atomCounts: Record<string, number> = {}
    atoms.forEach((a) => {
      atomCounts[a.type] = (atomCounts[a.type] || 0) + 1
    })

    let matchedTemplate: MoleculeTemplate | null = null

    for (const template of MOLECULE_TEMPLATES) {
      const templateCounts: Record<string, number> = {}
      template.atoms.forEach((a) => {
        templateCounts[a.type] = (templateCounts[a.type] || 0) + a.count
      })

      const countsMatch = Object.keys(templateCounts).every(
        (key) => atomCounts[key] === templateCounts[key]
      )
      const noExtraAtoms = Object.keys(atomCounts).every(
        (key) => templateCounts[key] !== undefined
      )

      if (countsMatch && noExtraAtoms && atoms.length === bonds.length + 1) {
        matchedTemplate = template
        break
      }
    }

    if (matchedTemplate) {
      set({
        validationResult: {
          success: true,
          matchedName: matchedTemplate.name
        }
      })
      setTimeout(() => {
        set({ validationResult: null })
      }, 2000)
    } else {
      const totalAtoms = atoms.length
      set({
        validationResult: {
          success: false,
          mismatchedCount: totalAtoms
        }
      })
      setTimeout(() => {
        set({ validationResult: null })
      }, 1000)
    }
  },

  clearValidation: () => set({ validationResult: null }),

  resetScene: () => set({ atoms: [], bonds: [], validationResult: null })
}))

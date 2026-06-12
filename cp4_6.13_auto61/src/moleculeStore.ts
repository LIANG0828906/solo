import { create } from 'zustand'

export interface Atom {
  id: string
  element: string
  position: [number, number, number]
}

export interface Bond {
  id: string
  atomAId: string
  atomBId: string
  order: 1 | 2 | 3
}

export interface Molecule {
  id: string
  name: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}

export interface DragState {
  element: string | null
  isDragging: boolean
  screenX: number
  screenY: number
}

export interface BondChange {
  bondId: string
  atomAId: string
  atomBId: string
  order: number
}

export interface ReactionResult {
  product: Molecule
  brokenBonds: BondChange[]
  formedBonds: BondChange[]
}

export type ReactionType = 'substitution' | 'addition' | 'elimination'
export type ReactionPhase = 'idle' | 'breaking' | 'forming' | 'showcase'

export const ELEMENTS = [
  { symbol: 'H', name: '氢', number: 1, electronegativity: 2.20, radius: 0.31 },
  { symbol: 'C', name: '碳', number: 6, electronegativity: 2.55, radius: 0.77 },
  { symbol: 'N', name: '氮', number: 7, electronegativity: 3.04, radius: 0.75 },
  { symbol: 'O', name: '氧', number: 8, electronegativity: 3.44, radius: 0.73 },
  { symbol: 'F', name: '氟', number: 9, electronegativity: 3.98, radius: 0.72 },
  { symbol: 'Na', name: '钠', number: 11, electronegativity: 0.93, radius: 1.54 },
  { symbol: 'P', name: '磷', number: 15, electronegativity: 2.19, radius: 1.06 },
  { symbol: 'S', name: '硫', number: 16, electronegativity: 2.58, radius: 1.02 },
  { symbol: 'Cl', name: '氯', number: 17, electronegativity: 3.16, radius: 0.99 },
  { symbol: 'Br', name: '溴', number: 35, electronegativity: 2.96, radius: 1.14 },
  { symbol: 'Fe', name: '铁', number: 26, electronegativity: 1.83, radius: 1.26 },
  { symbol: 'I', name: '碘', number: 53, electronegativity: 2.66, radius: 1.33 },
]

const MIN_EN = 0.93
const MAX_EN = 3.98

export function getElementColor(en: number): string {
  const t = (en - MIN_EN) / (MAX_EN - MIN_EN)
  const r = Math.round(59 + t * (239 - 59))
  const g = Math.round(130 + t * (68 - 130))
  const b = Math.round(246 + t * (68 - 246))
  return `rgb(${r},${g},${b})`
}

export function getElementHex(en: number): string {
  const t = (en - MIN_EN) / (MAX_EN - MIN_EN)
  const r = Math.round(59 + t * (239 - 59))
  const g = Math.round(130 + t * (68 - 130))
  const b = Math.round(246 + t * (68 - 246))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

export function getAtom3DRadius(element: string): number {
  const el = ELEMENTS.find(e => e.symbol === element)
  return el ? el.radius * 0.4 + 0.15 : 0.35
}

export function getAtom3DColor(element: string): string {
  const el = ELEMENTS.find(e => e.symbol === element)
  return el ? getElementHex(el.electronegativity) : '#888888'
}

let _idCounter = 0
export function genId(): string {
  return 'id_' + Date.now().toString(36) + '_' + (++_idCounter)
}

export function generateFormula(atoms: Atom[]): string {
  const count: Record<string, number> = {}
  for (const a of atoms) {
    count[a.element] = (count[a.element] || 0) + 1
  }
  const order = ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'Na', 'Fe']
  const sorted = Object.keys(count).sort((a, b) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
  return sorted.map(e => e + (count[e] > 1 ? count[e] : '')).join('')
}

interface MoleculeStore {
  currentAtoms: Atom[]
  currentBonds: Bond[]
  selectedAtomId: string | null
  selectedBondId: string | null
  hoveredAtomId: string | null
  dragState: DragState
  savedMolecules: Molecule[]
  reactantA: string | null
  reactantB: string | null
  reactionType: ReactionType
  isReacting: boolean
  reactionPhase: ReactionPhase
  reactionProgress: number
  reactionResult: ReactionResult | null
  showcaseRotation: number

  addAtom: (element: string, position: [number, number, number]) => string
  removeAtom: (id: string) => void
  moveAtom: (id: string, position: [number, number, number]) => void
  addBond: (atomAId: string, atomBId: string) => void
  removeBond: (id: string) => void
  upgradeBond: (id: string) => void
  selectAtom: (id: string | null) => void
  selectBond: (id: string | null) => void
  setHoveredAtom: (id: string | null) => void
  setDragState: (state: Partial<DragState>) => void
  saveMolecule: (name: string) => void
  loadMolecule: (id: string) => void
  deleteMolecule: (id: string) => void
  setReactantA: (id: string | null) => void
  setReactantB: (id: string | null) => void
  setReactionType: (type: ReactionType) => void
  startReaction: (result: ReactionResult) => void
  updateReactionProgress: (progress: number) => void
  setReactionPhase: (phase: ReactionPhase) => void
  finishReaction: () => void
  clearScene: () => void
  setSceneData: (atoms: Atom[], bonds: Bond[]) => void
}

export const useMoleculeStore = create<MoleculeStore>((set, get) => ({
  currentAtoms: [],
  currentBonds: [],
  selectedAtomId: null,
  selectedBondId: null,
  hoveredAtomId: null,
  dragState: { element: null, isDragging: false, screenX: 0, screenY: 0 },
  savedMolecules: [],
  reactantA: null,
  reactantB: null,
  reactionType: 'substitution',
  isReacting: false,
  reactionPhase: 'idle',
  reactionProgress: 0,
  reactionResult: null,
  showcaseRotation: 0,

  addAtom: (element, position) => {
    const id = genId()
    set(s => ({ currentAtoms: [...s.currentAtoms, { id, element, position }] }))
    return id
  },

  removeAtom: (id) => {
    set(s => ({
      currentAtoms: s.currentAtoms.filter(a => a.id !== id),
      currentBonds: s.currentBonds.filter(b => b.atomAId !== id && b.atomBId !== id),
      selectedAtomId: s.selectedAtomId === id ? null : s.selectedAtomId,
    }))
  },

  moveAtom: (id, position) => {
    set(s => ({
      currentAtoms: s.currentAtoms.map(a => a.id === id ? { ...a, position } : a),
    }))
  },

  addBond: (atomAId, atomBId) => {
    const exists = get().currentBonds.find(
      b => (b.atomAId === atomAId && b.atomBId === atomBId) ||
           (b.atomAId === atomBId && b.atomBId === atomAId)
    )
    if (exists) return
    if (atomAId === atomBId) return
    const id = genId()
    set(s => ({
      currentBonds: [...s.currentBonds, { id, atomAId, atomBId, order: 1 }],
    }))
  },

  removeBond: (id) => {
    set(s => ({
      currentBonds: s.currentBonds.filter(b => b.id !== id),
      selectedBondId: s.selectedBondId === id ? null : s.selectedBondId,
    }))
  },

  upgradeBond: (id) => {
    set(s => ({
      currentBonds: s.currentBonds.map(b =>
        b.id === id ? { ...b, order: (b.order % 3 + 1) as 1 | 2 | 3 } : b
      ),
    }))
  },

  selectAtom: (id) => set({ selectedAtomId: id, selectedBondId: null }),
  selectBond: (id) => set({ selectedBondId: id, selectedAtomId: null }),
  setHoveredAtom: (id) => set({ hoveredAtomId: id }),
  setDragState: (state) => set(s => ({ dragState: { ...s.dragState, ...state } })),

  saveMolecule: (name) => {
    const s = get()
    if (s.currentAtoms.length === 0) return
    const mol: Molecule = {
      id: genId(),
      name,
      formula: generateFormula(s.currentAtoms),
      atoms: s.currentAtoms.map(a => ({ ...a })),
      bonds: s.currentBonds.map(b => ({ ...b })),
    }
    set({ savedMolecules: [...s.savedMolecules, mol] })
  },

  loadMolecule: (id) => {
    const mol = get().savedMolecules.find(m => m.id === id)
    if (!mol) return
    set({
      currentAtoms: mol.atoms.map(a => ({ ...a, id: genId() })),
      currentBonds: [],
      selectedAtomId: null,
      selectedBondId: null,
    })
    const newAtoms = get().currentAtoms
    const atomIdMap = new Map<string, string>()
    mol.atoms.forEach((oldA, i) => atomIdMap.set(oldA.id, newAtoms[i].id))
    const newBonds = mol.bonds.map(b => ({
      ...b,
      id: genId(),
      atomAId: atomIdMap.get(b.atomAId)!,
      atomBId: atomIdMap.get(b.atomBId)!,
    }))
    set({ currentBonds: newBonds })
  },

  deleteMolecule: (id) => {
    set(s => ({
      savedMolecules: s.savedMolecules.filter(m => m.id !== id),
      reactantA: s.reactantA === id ? null : s.reactantA,
      reactantB: s.reactantB === id ? null : s.reactantB,
    }))
  },

  setReactantA: (id) => set({ reactantA: id }),
  setReactantB: (id) => set({ reactantB: id }),
  setReactionType: (type) => set({ reactionType: type }),

  startReaction: (result) => {
    set({
      isReacting: true,
      reactionPhase: 'breaking',
      reactionProgress: 0,
      reactionResult: result,
    })
  },

  updateReactionProgress: (progress) => set({ reactionProgress: progress }),

  setReactionPhase: (phase) => set({ reactionPhase: phase }),

  finishReaction: () => {
    const s = get()
    const result = s.reactionResult
    if (result) {
      const atomIdMap = new Map<string, string>()
      const newAtoms = result.product.atoms.map(a => {
        const nid = genId()
        atomIdMap.set(a.id, nid)
        return { ...a, id: nid }
      })
      const newBonds = result.product.bonds.map(b => ({
        ...b,
        id: genId(),
        atomAId: atomIdMap.get(b.atomAId)!,
        atomBId: atomIdMap.get(b.atomBId)!,
      }))
      set({
        currentAtoms: newAtoms,
        currentBonds: newBonds,
        isReacting: false,
        reactionPhase: 'showcase',
        reactionProgress: 0,
        reactionResult: null,
        selectedAtomId: null,
        selectedBondId: null,
      })
    } else {
      set({
        isReacting: false,
        reactionPhase: 'idle',
        reactionProgress: 0,
        reactionResult: null,
      })
    }
  },

  clearScene: () => set({
    currentAtoms: [],
    currentBonds: [],
    selectedAtomId: null,
    selectedBondId: null,
  }),

  setSceneData: (atoms, bonds) => set({
    currentAtoms: atoms,
    currentBonds: bonds,
    selectedAtomId: null,
    selectedBondId: null,
  }),
}))

import { create } from 'zustand'

export interface AtomPosition {
  x: number
  y: number
  z: number
}

export interface Atom {
  id: string
  element: 'C' | 'H' | 'Cl' | 'O'
  position: AtomPosition
  energy: number
}

export interface Bond {
  id: string
  atomA: string
  atomB: string
  energy: number
  visible: boolean
  opacity: number
}

export interface EnergyPoint {
  time: number
  energy: number
  isPeak: boolean
}

export type ReactionStatus = 'idle' | 'playing' | 'paused' | 'finished'

export interface AppState {
  atoms: Atom[]
  bonds: Bond[]
  energyHistory: EnergyPoint[]
  trajectories: Record<string, AtomPosition[]>
  reactionStatus: ReactionStatus
  currentReaction: string
  currentTime: number
  moleculeName: string

  setAtoms: (atoms: Atom[]) => void
  setBonds: (bonds: Bond[]) => void
  addEnergyPoint: (point: EnergyPoint) => void
  clearEnergyHistory: () => void
  setTrajectories: (trajectories: Record<string, AtomPosition[]>) => void
  addTrajectoryPoint: (atomId: string, point: AtomPosition) => void
  clearTrajectories: () => void
  setReactionStatus: (status: ReactionStatus) => void
  setCurrentReaction: (reaction: string) => void
  setCurrentTime: (time: number) => void
  setMoleculeName: (name: string) => void
  updateAtomPosition: (atomId: string, position: AtomPosition) => void
  updateAtomEnergy: (atomId: string, energy: number) => void
  updateBondOpacity: (bondId: string, opacity: number) => void
  updateBondVisibility: (bondId: string, visible: boolean) => void
  resetState: () => void
}

const getInitialAtoms = (): Atom[] => [
  { id: 'C1', element: 'C', position: { x: 0, y: 0, z: 0 }, energy: 0.5 },
  { id: 'H1', element: 'H', position: { x: 0.63, y: 0.63, z: 0.63 }, energy: 0.2 },
  { id: 'H2', element: 'H', position: { x: -0.63, y: -0.63, z: 0.63 }, energy: 0.2 },
  { id: 'H3', element: 'H', position: { x: -0.63, y: 0.63, z: -0.63 }, energy: 0.2 },
  { id: 'H4', element: 'H', position: { x: 0.63, y: -0.63, z: -0.63 }, energy: 0.2 },
  { id: 'Cl1', element: 'Cl', position: { x: 3, y: 0, z: 0 }, energy: 0.3 },
  { id: 'Cl2', element: 'Cl', position: { x: 4, y: 0, z: 0 }, energy: 0.3 },
  { id: 'O1', element: 'O', position: { x: -3, y: 2, z: 0 }, energy: 0.4 },
  { id: 'O2', element: 'O', position: { x: -3, y: -2, z: 0 }, energy: 0.4 },
  { id: 'H5', element: 'H', position: { x: -4, y: 2.5, z: 0 }, energy: 0.2 },
  { id: 'H6', element: 'H', position: { x: -4, y: -2.5, z: 0 }, energy: 0.2 },
  { id: 'C2', element: 'C', position: { x: 0, y: 3, z: 0 }, energy: 0.5 }
]

const getInitialBonds = (): Bond[] => [
  { id: 'bond-C1-H1', atomA: 'C1', atomB: 'H1', energy: 4.3, visible: true, opacity: 1 },
  { id: 'bond-C1-H2', atomA: 'C1', atomB: 'H2', energy: 4.3, visible: true, opacity: 1 },
  { id: 'bond-C1-H3', atomA: 'C1', atomB: 'H3', energy: 4.3, visible: true, opacity: 1 },
  { id: 'bond-C1-H4', atomA: 'C1', atomB: 'H4', energy: 4.3, visible: true, opacity: 1 },
  { id: 'bond-Cl1-Cl2', atomA: 'Cl1', atomB: 'Cl2', energy: 2.5, visible: true, opacity: 1 },
  { id: 'bond-O1-H5', atomA: 'O1', atomB: 'H5', energy: 4.8, visible: true, opacity: 1 },
  { id: 'bond-O2-H6', atomA: 'O2', atomB: 'H6', energy: 4.8, visible: true, opacity: 1 }
]

export const useAppStore = create<AppState>((set) => ({
  atoms: getInitialAtoms(),
  bonds: getInitialBonds(),
  energyHistory: [],
  trajectories: {},
  reactionStatus: 'idle',
  currentReaction: 'halogenation',
  currentTime: 0,
  moleculeName: '甲烷 (CH₄)',

  setAtoms: (atoms) => set({ atoms }),
  setBonds: (bonds) => set({ bonds }),
  addEnergyPoint: (point) =>
    set((state) => ({ energyHistory: [...state.energyHistory, point] })),
  clearEnergyHistory: () => set({ energyHistory: [] }),
  setTrajectories: (trajectories) => set({ trajectories }),
  addTrajectoryPoint: (atomId, point) =>
    set((state) => ({
      trajectories: {
        ...state.trajectories,
        [atomId]: [...(state.trajectories[atomId] || []), point]
      }
    })),
  clearTrajectories: () => set({ trajectories: {} }),
  setReactionStatus: (status) => set({ reactionStatus: status }),
  setCurrentReaction: (reaction) => set({ currentReaction: reaction }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setMoleculeName: (name) => set({ moleculeName: name }),
  updateAtomPosition: (atomId, position) =>
    set((state) => ({
      atoms: state.atoms.map((a) =>
        a.id === atomId ? { ...a, position } : a
      )
    })),
  updateAtomEnergy: (atomId, energy) =>
    set((state) => ({
      atoms: state.atoms.map((a) =>
        a.id === atomId ? { ...a, energy } : a
      )
    })),
  updateBondOpacity: (bondId, opacity) =>
    set((state) => ({
      bonds: state.bonds.map((b) =>
        b.id === bondId ? { ...b, opacity } : b
      )
    })),
  updateBondVisibility: (bondId, visible) =>
    set((state) => ({
      bonds: state.bonds.map((b) =>
        b.id === bondId ? { ...b, visible } : b
      )
    })),
  resetState: () =>
    set({
      atoms: getInitialAtoms(),
      bonds: getInitialBonds(),
      energyHistory: [],
      trajectories: {},
      reactionStatus: 'idle',
      currentTime: 0
    })
}))

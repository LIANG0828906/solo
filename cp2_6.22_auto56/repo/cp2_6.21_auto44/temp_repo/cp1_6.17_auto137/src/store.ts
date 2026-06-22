import { create } from 'zustand'

export interface Slot {
  id: string
  x: number
  y: number
  fragmentId: string
}

export interface Fragment {
  id: string
  color: string
  isPlaced: boolean
  targetSlotId: string
}

export interface Connection {
  from: string
  to: string
}

export interface Constellation {
  id: string
  name: string
  color: string
  slots: Slot[]
  connections: Connection[]
}

const CONSTELLATIONS: Constellation[] = [
  {
    id: 'draco',
    name: '天龙座',
    color: '#6C63FF',
    slots: [
      { id: 's1', x: 150, y: 150, fragmentId: 'f1' },
      { id: 's2', x: 300, y: 120, fragmentId: 'f2' },
      { id: 's3', x: 450, y: 180, fragmentId: 'f3' },
      { id: 's4', x: 550, y: 300, fragmentId: 'f4' },
      { id: 's5', x: 400, y: 400, fragmentId: 'f5' },
    ],
    connections: [
      { from: 's1', to: 's2' },
      { from: 's2', to: 's3' },
      { from: 's3', to: 's4' },
      { from: 's4', to: 's5' },
    ],
  },
  {
    id: 'cygnus',
    name: '天鹅座',
    color: '#FF6584',
    slots: [
      { id: 's1', x: 450, y: 100, fragmentId: 'f1' },
      { id: 's2', x: 450, y: 250, fragmentId: 'f2' },
      { id: 's3', x: 450, y: 400, fragmentId: 'f3' },
      { id: 's4', x: 300, y: 250, fragmentId: 'f4' },
      { id: 's5', x: 600, y: 250, fragmentId: 'f5' },
    ],
    connections: [
      { from: 's1', to: 's2' },
      { from: 's2', to: 's3' },
      { from: 's2', to: 's4' },
      { from: 's2', to: 's5' },
    ],
  },
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createFragmentsForConstellation(constellation: Constellation): Fragment[] {
  return constellation.slots.map((slot) => ({
    id: slot.fragmentId,
    color: constellation.color,
    isPlaced: false,
    targetSlotId: slot.id,
  }))
}

interface GameState {
  currentConstellation: Constellation
  placedFragments: Fragment[]
  fragmentPool: Fragment[]
  score: number
  completedCount: number
  isCompleted: boolean
  animationState: 'idle' | 'rising' | 'animating'
  placeFragment: (fragmentId: string, slotId: string) => boolean
  resetGame: () => void
  startStarAnimation: () => void
  nextConstellation: () => void
}

const initialConstellation = CONSTELLATIONS[0]
const initialFragments = shuffleArray(createFragmentsForConstellation(initialConstellation))

export const useGameStore = create<GameState>((set, get) => ({
  currentConstellation: initialConstellation,
  placedFragments: [],
  fragmentPool: initialFragments,
  score: 0,
  completedCount: 0,
  isCompleted: false,
  animationState: 'idle',

  placeFragment: (fragmentId: string, slotId: string): boolean => {
    const state = get()
    const fragment = state.fragmentPool.find((f) => f.id === fragmentId)
    const slot = state.currentConstellation.slots.find((s) => s.id === slotId)

    if (!fragment || !slot || fragment.isPlaced) return false

    const isCorrect = fragment.targetSlotId === slotId

    if (isCorrect) {
      const updatedFragment = { ...fragment, isPlaced: true }
      const newPlacedFragments = [...state.placedFragments, updatedFragment]
      const newFragmentPool = state.fragmentPool.map((f) =>
        f.id === fragmentId ? updatedFragment : f
      )
      const newScore = state.score + 100
      const totalSlots = state.currentConstellation.slots.length
      const newIsCompleted = newPlacedFragments.length === totalSlots
      const newCompletedCount = newIsCompleted ? state.completedCount + 1 : state.completedCount

      set({
        placedFragments: newPlacedFragments,
        fragmentPool: newFragmentPool,
        score: newScore,
        isCompleted: newIsCompleted,
        completedCount: newCompletedCount,
      })

      return true
    }

    return false
  },

  resetGame: () => {
    const state = get()
    const newFragments = shuffleArray(
      createFragmentsForConstellation(state.currentConstellation)
    )
    set({
      placedFragments: [],
      fragmentPool: newFragments,
      isCompleted: false,
      animationState: 'idle',
    })
  },

  startStarAnimation: () => {
    set({ animationState: 'rising' })
    setTimeout(() => {
      set({ animationState: 'animating' })
    }, 2000)
  },

  nextConstellation: () => {
    const state = get()
    const currentIndex = CONSTELLATIONS.findIndex(
      (c) => c.id === state.currentConstellation.id
    )
    const nextIndex = (currentIndex + 1) % CONSTELLATIONS.length
    const nextConstellation = CONSTELLATIONS[nextIndex]
    const newFragments = shuffleArray(createFragmentsForConstellation(nextConstellation))

    set({
      currentConstellation: nextConstellation,
      placedFragments: [],
      fragmentPool: newFragments,
      isCompleted: false,
      animationState: 'idle',
    })
  },
}))

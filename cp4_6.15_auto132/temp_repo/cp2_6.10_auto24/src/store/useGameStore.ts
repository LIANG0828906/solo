import { create } from 'zustand'
import type { DifficultyLevel, HitFeedback, Target, WindParams } from '../types/army'

interface GameState {
  score: number
  consecutiveHits: number
  difficulty: DifficultyLevel
  isFiring: boolean
  isProjectileFlying: boolean
  counterweight: number
  launchAngle: number
  wind: WindParams
  targets: Target[]
  hitFeedbacks: HitFeedback[]
  showComboEffect: boolean
  currentTargetId: string | null

  setCounterweight: (weight: number) => void
  setLaunchAngle: (angle: number) => void
  setWind: (wind: WindParams) => void
  startFiring: () => void
  stopFiring: () => void
  setProjectileFlying: (flying: boolean) => void
  addScore: (points: number) => void
  registerHit: (targetId: string) => void
  addHitFeedback: (feedback: Omit<HitFeedback, 'id' | 'timestamp'>) => void
  removeHitFeedback: (id: string) => void
  resetTargets: () => void
  nextDifficulty: () => void
  setCurrentTarget: (targetId: string) => void
  generateRandomWind: () => void
}

const initialTargets: Target[] = [
  {
    id: 'tower',
    name: '箭楼',
    type: 'tower',
    x: 780,
    y: 150,
    width: 60,
    height: 200,
    points: 100,
    destroyed: false
  },
  {
    id: 'gate',
    name: '城门',
    type: 'gate',
    x: 650,
    y: 300,
    width: 50,
    height: 100,
    points: 100,
    destroyed: false
  },
  {
    id: 'wall',
    name: '城墙垛口',
    type: 'wall',
    x: 700,
    y: 135,
    width: 30,
    height: 15,
    points: 100,
    destroyed: false
  },
  {
    id: 'grain',
    name: '粮草车',
    type: 'grain',
    x: 900,
    y: 340,
    width: 50,
    height: 40,
    points: 100,
    destroyed: false
  }
]

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  consecutiveHits: 0,
  difficulty: 'earth_wall',
  isFiring: false,
  isProjectileFlying: false,
  counterweight: 400,
  launchAngle: 45,
  wind: { speed: 0, direction: 'right' },
  targets: initialTargets,
  hitFeedbacks: [],
  showComboEffect: false,
  currentTargetId: 'tower',

  setCounterweight: (weight) => set({ counterweight: weight }),
  setLaunchAngle: (angle) => set({ launchAngle: angle }),
  setWind: (wind) => set({ wind }),

  startFiring: () => set({ isFiring: true }),
  stopFiring: () => set({ isFiring: false }),
  setProjectileFlying: (flying) => set({ isProjectileFlying: flying }),

  addScore: (points) => set((state) => ({ score: state.score + points })),

  registerHit: (targetId) => {
    const state = get()
    const newConsecutive = state.consecutiveHits + 1
    const newScore = state.score + 100

    set({
      consecutiveHits: newConsecutive,
      score: newScore,
      targets: state.targets.map((t) =>
        t.id === targetId ? { ...t, destroyed: true } : t
      )
    })

    if (newConsecutive >= 3) {
      set({ showComboEffect: true })
      setTimeout(() => set({ showComboEffect: false }), 2000)
    }

    if (newScore >= 300 && state.difficulty === 'earth_wall') {
      setTimeout(() => get().nextDifficulty(), 1500)
    }
  },

  addHitFeedback: (feedback) =>
    set((state) => ({
      hitFeedbacks: [
        ...state.hitFeedbacks,
        { ...feedback, id: Math.random().toString(36), timestamp: Date.now() }
      ]
    })),

  removeHitFeedback: (id) =>
    set((state) => ({
      hitFeedbacks: state.hitFeedbacks.filter((f) => f.id !== id)
    })),

  resetTargets: () => set({ targets: initialTargets.map((t) => ({ ...t, destroyed: false })) }),

  nextDifficulty: () => {
    const state = get()
    if (state.difficulty === 'earth_wall') {
      set({ difficulty: 'sheep_horse_wall' })
    } else if (state.difficulty === 'sheep_horse_wall') {
      set({ difficulty: 'urn_city' })
    }
    get().resetTargets()
    get().generateRandomWind()
  },

  setCurrentTarget: (targetId) => set({ currentTargetId: targetId }),

  generateRandomWind: () => {
    const speed = Math.floor(Math.random() * 11)
    const direction = Math.random() > 0.5 ? 'right' : 'left'
    set({ wind: { speed, direction } })
  }
}))

import { create } from 'zustand'
import type { ElementType, Point, ScoreResponse } from '../../shared/types'
import { ELEMENT_COUNTER } from '../../shared/types'

interface GameStore {
  currentElement: ElementType
  combo: number
  totalScore: number
  highScore: number
  dailyElement: ElementType
  isDrawing: boolean
  currentTrajectory: Point[]
  lastScoreResult: ScoreResponse | null
  isLeaderboardOpen: boolean
  leaderboardData: Array<{ rank: number; nickname: string; score: number; isNewRecord?: boolean }>
  mousePosition: { x: number; y: number }
  isNewRecordFlash: boolean
  nickname: string
  backgroundTint: string
  setCurrentElement: (element: ElementType) => void
  setIsDrawing: (isDrawing: boolean) => void
  setCurrentTrajectory: (trajectory: Point[]) => void
  addScore: (result: ScoreResponse) => void
  resetCombo: () => void
  setIsLeaderboardOpen: (open: boolean) => void
  setLeaderboardData: (data: Array<{ rank: number; nickname: string; score: number; isNewRecord?: boolean }>) => void
  setMousePosition: (x: number, y: number) => void
  setNickname: (name: string) => void
  setBackgroundTint: (color: string) => void
  clearLastResult: () => void
  triggerNewRecordFlash: () => void
  resetGame: () => void
}

const ELEMENTS: ElementType[] = ['fire', 'water', 'wind', 'thunder']

function getDailyElement(): ElementType {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  return ELEMENTS[seed % ELEMENTS.length]
}

const dailyElement = getDailyElement()

export const useGameStore = create<GameStore>((set, get) => ({
  currentElement: 'fire',
  combo: 0,
  totalScore: 0,
  highScore: 0,
  dailyElement,
  isDrawing: false,
  currentTrajectory: [],
  lastScoreResult: null,
  isLeaderboardOpen: false,
  leaderboardData: [],
  mousePosition: { x: 0, y: 0 },
  isNewRecordFlash: false,
  nickname: '魔法师学员',
  backgroundTint: '#ff6b35',

  setCurrentElement: (element: ElementType) => {
    set({ currentElement: element })
  },
  setIsDrawing: (isDrawing: boolean) => {
    set({ isDrawing })
  },
  setCurrentTrajectory: (trajectory: Point[]) => {
    set({ currentTrajectory: trajectory })
  },
  addScore: (result: ScoreResponse) => {
    const state = get()
    const isSuccess = result.matchQuality !== 'fail'
    const newCombo = isSuccess ? state.combo + 1 : 0

    let baseScore = result.score
    if (result.matchQuality === 'perfect') {
      baseScore *= 2
    }

    const currentElementCountersDaily = ELEMENT_COUNTER[state.currentElement] === state.dailyElement
    if (currentElementCountersDaily) {
      baseScore *= 1.5
    }

    const comboBonus = newCombo > 5 ? (newCombo - 5) * 10 : 0
    const finalScore = Math.round(baseScore + comboBonus)
    const newTotal = state.totalScore + finalScore
    const newHigh = Math.max(state.highScore, newTotal)

    set({
      lastScoreResult: result,
      combo: newCombo,
      totalScore: newTotal,
      highScore: newHigh,
    })

    if (newHigh === newTotal && newHigh > 0) {
      get().triggerNewRecordFlash()
    }
  },
  resetCombo: () => {
    set({ combo: 0 })
  },
  setIsLeaderboardOpen: (open: boolean) => {
    set({ isLeaderboardOpen: open })
  },
  setLeaderboardData: (data) => {
    set({ leaderboardData: data })
  },
  setMousePosition: (x, y) => {
    set({ mousePosition: { x, y } })
  },
  setNickname: (name: string) => {
    set({ nickname: name })
  },
  setBackgroundTint: (color: string) => {
    set({ backgroundTint: color })
  },
  clearLastResult: () => {
    set({ lastScoreResult: null })
  },
  triggerNewRecordFlash: () => {
    set({ isNewRecordFlash: true })
    setTimeout(() => {
      set({ isNewRecordFlash: false })
    }, 2000)
  },
  resetGame: () => {
    set({
      combo: 0,
      totalScore: 0,
      currentTrajectory: [],
      lastScoreResult: null,
    })
  },
}))

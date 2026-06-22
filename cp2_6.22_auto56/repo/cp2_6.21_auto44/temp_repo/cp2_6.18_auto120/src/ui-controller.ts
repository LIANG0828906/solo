import { create } from 'zustand'

type GameStatus = 'playing' | 'gameover' | 'victory'

interface GameState {
  score: number
  lives: number
  combo: number
  lastHitTime: number
  asteroidsRemaining: number
  gameStatus: GameStatus
  isLifeFlashing: boolean

  incrementScore: (points: number) => void
  decrementLife: () => void
  incrementCombo: () => void
  resetCombo: () => void
  checkComboTimeout: () => void
  setAsteroidsRemaining: (count: number) => void
  setGameStatus: (status: GameStatus) => void
  startLifeFlash: () => void
  stopLifeFlash: () => void
  resetGame: () => void
}

const INITIAL_LIVES = 3
const COMBO_TIMEOUT = 2000

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  lives: INITIAL_LIVES,
  combo: 0,
  lastHitTime: 0,
  asteroidsRemaining: 8,
  gameStatus: 'playing',
  isLifeFlashing: false,

  incrementScore: (points: number) => {
    const { combo } = get()
    const multiplier = 1 + combo * 0.1
    set({ score: get().score + Math.floor(points * multiplier) })
  },

  decrementLife: () => {
    const newLives = get().lives - 1
    set({ lives: newLives })
    if (newLives <= 0) {
      set({ gameStatus: 'gameover' })
    }
  },

  incrementCombo: () => {
    set((state) => ({ combo: state.combo + 1, lastHitTime: Date.now() }))
  },

  resetCombo: () => {
    set({ combo: 0 })
  },

  checkComboTimeout: () => {
    const { combo, lastHitTime } = get()
    if (combo > 0 && Date.now() - lastHitTime > COMBO_TIMEOUT) {
      set({ combo: 0 })
    }
  },

  setAsteroidsRemaining: (count: number) => {
    set({ asteroidsRemaining: count })
    if (count === 0 && get().gameStatus === 'playing') {
      set({ gameStatus: 'victory' })
    }
  },

  setGameStatus: (status: GameStatus) => {
    set({ gameStatus: status })
  },

  startLifeFlash: () => {
    set({ isLifeFlashing: true })
  },

  stopLifeFlash: () => {
    set({ isLifeFlashing: false })
  },

  resetGame: () => {
    set({
      score: 0,
      lives: INITIAL_LIVES,
      combo: 0,
      lastHitTime: 0,
      asteroidsRemaining: 8,
      gameStatus: 'playing',
      isLifeFlashing: false,
    })
  },
}))

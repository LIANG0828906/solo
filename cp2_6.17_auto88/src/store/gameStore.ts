import { create } from 'zustand'
import type { GameStatus, GameActions } from '@/types'

interface GameStore {
  status: GameStatus
  score: number
  setStatus: (s: GameStatus) => void
  setScore: (n: number) => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore & GameActions>((set) => ({
  status: 'START',
  score: 0,
  setStatus: (s: GameStatus) => set({ status: s }),
  setScore: (n: number) => set({ score: n }),
  startGame: () => set({ status: 'PLAYING', score: 0 }),
  endGame: () => set({ status: 'GAMEOVER' }),
  resetGame: () => set({ status: 'START', score: 0 }),
}))

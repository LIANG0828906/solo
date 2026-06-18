import { create } from 'zustand'

interface GameState {
  score: number
  timeLeft: number
  level: number
  isPlaying: boolean
  isGameOver: boolean
  addScore: (points: number) => void
  setTimeLeft: (time: number) => void
  nextLevel: () => void
  startGame: () => void
  endGame: () => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  timeLeft: 60,
  level: 1,
  isPlaying: false,
  isGameOver: false,
  addScore: (points: number) => set((state) => ({ score: state.score + points })),
  setTimeLeft: (time: number) => set({ timeLeft: time }),
  nextLevel: () => set((state) => ({ level: state.level + 1, timeLeft: 60 })),
  startGame: () => set({ isPlaying: true, isGameOver: false }),
  endGame: () => set({ isPlaying: false, isGameOver: true }),
  resetGame: () => set({ score: 0, timeLeft: 60, level: 1, isPlaying: true, isGameOver: false }),
}))

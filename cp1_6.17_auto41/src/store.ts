import { create } from 'zustand'

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover'

interface GameStore {
  gameState: GameState
  score: number
  lives: number
  maxLives: number
  level: number
  soundEnabled: boolean
  setGameState: (state: GameState) => void
  addScore: (points: number) => void
  setLives: (lives: number) => void
  setLevel: (level: number) => void
  toggleSound: () => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'menu',
  score: 0,
  lives: 3,
  maxLives: 3,
  level: 1,
  soundEnabled: true,
  setGameState: (state) => set({ gameState: state }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  setLives: (lives) => set({ lives }),
  setLevel: (level) => set({ level }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  resetGame: () => set({
    gameState: 'playing',
    score: 0,
    lives: 3,
    level: 1
  })
}))

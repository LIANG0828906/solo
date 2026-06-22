import { create } from 'zustand'
import type { GameScreen, GameStatus, GameStateData } from '../types'

interface GameState {
  screen: GameScreen
  gameStatus: GameStatus
  lapData: GameStateData
  showResultPanel: boolean
  lastLapStats: {
    time: number
    driftScore: number
    nitroUses: number
  } | null

  setScreen: (screen: GameScreen) => void
  setGameStatus: (status: GameStatus) => void
  setLapData: (data: GameStateData) => void
  setShowResultPanel: (show: boolean) => void
  setLastLapStats: (stats: { time: number; driftScore: number; nitroUses: number } | null) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'menu',
  gameStatus: 'ready',
  lapData: {
    status: 'ready',
    lap: 0,
    lapTime: 0,
    bestLapTime: null,
    driftScore: 0,
    nitroUses: 0,
    currentWaypointIndex: 0,
  },
  showResultPanel: false,
  lastLapStats: null,

  setScreen: (screen) => set({ screen }),
  setGameStatus: (status) => set({ gameStatus: status }),
  setLapData: (data) => set({ lapData: data }),
  setShowResultPanel: (show) => set({ showResultPanel: show }),
  setLastLapStats: (stats) => set({ lastLapStats: stats }),

  resetGame: () =>
    set({
      gameStatus: 'ready',
      lapData: {
        status: 'ready',
        lap: 0,
        lapTime: 0,
        bestLapTime: null,
        driftScore: 0,
        nitroUses: 0,
        currentWaypointIndex: 0,
      },
      showResultPanel: false,
      lastLapStats: null,
    }),
}))

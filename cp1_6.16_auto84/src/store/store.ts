import { create } from 'zustand'

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'
export type GamePhase = 'playing' | 'chamber-opening' | 'achievement'

interface GameState {
  shadowAngle: number
  unlockedCharts: Record<Season, boolean>
  collectedFragments: number
  totalFragments: number
  gamePhase: GamePhase
  startTime: number
  achievementTime: number
  activeSeason: Season | null
  
  setShadowAngle: (angle: number) => void
  unlockChart: (season: Season) => void
  collectFragment: () => void
  setGamePhase: (phase: GamePhase) => void
  setActiveSeason: (season: Season | null) => void
  setAchievementTime: (time: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>((set) => ({
  shadowAngle: -Math.PI / 2,
  unlockedCharts: {
    winter: true,
    spring: false,
    summer: false,
    autumn: false,
  },
  collectedFragments: 1,
  totalFragments: 8,
  gamePhase: 'playing',
  startTime: Date.now(),
  achievementTime: 0,
  activeSeason: null,

  setShadowAngle: (angle) => set({ shadowAngle: angle }),
  unlockChart: (season) =>
    set((state) => ({
      unlockedCharts: {
        ...state.unlockedCharts,
        [season]: true,
      },
    })),
  collectFragment: () =>
    set((state) => {
      const next = state.collectedFragments + 1
      const newPhase = next >= state.totalFragments ? 'chamber-opening' : state.gamePhase
      return {
        collectedFragments: Math.min(next, state.totalFragments),
        gamePhase: newPhase,
      }
    }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
  setActiveSeason: (season) => set({ activeSeason: season }),
  setAchievementTime: (time) => set({ achievementTime: time }),
  resetGame: () =>
    set({
      shadowAngle: -Math.PI / 2,
      unlockedCharts: { winter: true, spring: false, summer: false, autumn: false },
      collectedFragments: 1,
      gamePhase: 'playing',
      startTime: Date.now(),
      activeSeason: null,
    }),
}))

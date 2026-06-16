import { create } from 'zustand'
import { get as idbGet, set as idbSet } from 'idb-keyval'

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover'
export type WindType = 'updraft' | 'downdraft' | 'tailwind' | null

export interface LeaderboardEntry {
  distance: number
  fireflies: number
  date: string
}

interface GameState {
  status: GameStatus
  distance: number
  fireflyCount: number
  energy: number
  planeTilt: number
  activeWind: WindType
  lastTerrain: string | null
  highScore: number
  leaderboard: LeaderboardEntry[]
  unlockedTerrains: string[]
  boostReady: boolean
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  updateState: (patch: Partial<GameState>) => void
  loadFromStorage: () => Promise<void>
}

const TERRAIN_NAMES = ['森林', '峡谷', '瀑布', '火山口']

export const useGameStore = create<GameState>((set, get) => ({
  status: 'menu',
  distance: 0,
  fireflyCount: 0,
  energy: 100,
  planeTilt: 0,
  activeWind: null,
  lastTerrain: null,
  highScore: 0,
  leaderboard: [],
  unlockedTerrains: [TERRAIN_NAMES[0]],
  boostReady: false,

  startGame: () => {
    set({
      status: 'playing',
      distance: 0,
      fireflyCount: 0,
      energy: 100,
      planeTilt: 0,
      activeWind: null,
      lastTerrain: null,
      boostReady: false,
    })
  },

  pauseGame: () => {
    if (get().status === 'playing') {
      set({ status: 'paused' })
    }
  },

  resumeGame: () => {
    if (get().status === 'paused') {
      set({ status: 'playing' })
    }
  },

  endGame: async () => {
    const state = get()
    const newDistance = state.distance
    const newFireflies = state.fireflyCount
    
    const entry: LeaderboardEntry = {
      distance: newDistance,
      fireflies: newFireflies,
      date: new Date().toLocaleDateString('zh-CN'),
    }
    
    const newLeaderboard = [...state.leaderboard, entry]
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 10)
    
    const newHighScore = Math.max(state.highScore, newDistance)
    
    const newUnlocked = [...state.unlockedTerrains]
    const unlockThresholds = [500, 1500, 3000, 5000]
    for (let i = 0; i < TERRAIN_NAMES.length; i++) {
      if (newDistance >= unlockThresholds[i] && !newUnlocked.includes(TERRAIN_NAMES[i])) {
        newUnlocked.push(TERRAIN_NAMES[i])
      }
    }
    
    const lastTerrain = newUnlocked[newUnlocked.length - 1] || null
    
    set({
      status: 'gameover',
      highScore: newHighScore,
      leaderboard: newLeaderboard,
      unlockedTerrains: newUnlocked,
      lastTerrain,
    })
    
    try {
      await set('windwalker:highscore', newHighScore)
      await set('windwalker:leaderboard', newLeaderboard)
      await set('windwalker:unlocked', newUnlocked)
    } catch (e) {
      console.warn('Failed to save to IndexedDB', e)
    }
  },

  updateState: (patch) => {
    set(patch)
  },

  loadFromStorage: async () => {
    try {
      const [hs, lb, un] = await Promise.all([
        get<number>('windwalker:highscore'),
        get<LeaderboardEntry[]>('windwalker:leaderboard'),
        get<string[]>('windwalker:unlocked'),
      ])
      set({
        highScore: hs || 0,
        leaderboard: lb || [],
        unlockedTerrains: un || [TERRAIN_NAMES[0]],
      })
    } catch (e) {
      console.warn('Failed to load from IndexedDB', e)
    }
  },
}))

import { create } from 'zustand'

export interface Lantern {
  id: number
  isLit: boolean
  position: { x: number; y: number }
}

export interface Riddle {
  id: number
  riddle: string
  answer: string
  hint: string
  lanternId: number
}

export interface LeaderboardEntry {
  id: number
  nickname: string
  litCount: number
  timeUsed: number
  createdAt: string
}

export interface PlayerInfo {
  nickname: string
  startTime: number | null
  timeUsed: number
}

interface GameState {
  player: PlayerInfo
  lanterns: Lantern[]
  riddles: Riddle[]
  leaderboard: LeaderboardEntry[]
  currentModal: {
    isOpen: boolean
    lanternId: number | null
  }
  celebration: boolean
  actions: {
    initGame: (nickname: string) => void
    verifyAnswer: (lanternId: number, answer: string) => Promise<boolean>
    updateTimer: () => void
    saveScore: () => Promise<void>
    fetchLeaderboard: () => Promise<void>
    openModal: (lanternId: number) => void
    closeModal: () => void
    setCelebration: (value: boolean) => void
  }
}

const initialLanterns: Lantern[] = [
  { id: 1, isLit: false, position: { x: 150, y: 120 } },
  { id: 2, isLit: false, position: { x: 350, y: 80 } },
  { id: 3, isLit: false, position: { x: 550, y: 150 } },
  { id: 4, isLit: false, position: { x: 700, y: 100 } },
  { id: 5, isLit: false, position: { x: 250, y: 200 } },
  { id: 6, isLit: false, position: { x: 800, y: 180 } },
]

export const useGameStore = create<GameState>((set, get) => ({
  player: {
    nickname: '',
    startTime: null,
    timeUsed: 0,
  },
  lanterns: initialLanterns,
  riddles: [],
  leaderboard: [],
  currentModal: {
    isOpen: false,
    lanternId: null,
  },
  celebration: false,

  actions: {
    initGame: (nickname: string) => {
      fetch('/api/lanterns')
        .then(res => res.json())
        .then((data: Riddle[]) => {
          set({
            player: {
              nickname,
              startTime: Date.now(),
              timeUsed: 0,
            },
            riddles: data.map((r, index) => ({
              ...r,
              lanternId: index + 1,
            })),
            lanterns: initialLanterns.map(l => ({ ...l, isLit: false })),
            celebration: false,
          })
        })
    },

    verifyAnswer: async (lanternId: number, answer: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lanternId, answer }),
        })
        const data = await res.json()
        if (data.correct) {
          set(state => {
            const newLanterns = state.lanterns.map(l =>
              l.id === lanternId ? { ...l, isLit: true } : l
            )
            const allLit = newLanterns.every(l => l.isLit)
            return {
              lanterns: newLanterns,
              celebration: allLit,
            }
          })
        }
        return data.correct
      } catch {
        return false
      }
    },

    updateTimer: () => {
      const { player } = get()
      if (player.startTime) {
        set({
          player: {
            ...player,
            timeUsed: Math.floor((Date.now() - player.startTime) / 1000),
          },
        })
      }
    },

    saveScore: async () => {
      const { player, lanterns } = get()
      const litCount = lanterns.filter(l => l.isLit).length
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: player.nickname,
          litCount,
          timeUsed: player.timeUsed,
        }),
      })
    },

    fetchLeaderboard: async () => {
      const res = await fetch('/api/leaderboard')
      const data = await res.json()
      set({ leaderboard: data })
    },

    openModal: (lanternId: number) => {
      set({
        currentModal: {
          isOpen: true,
          lanternId,
        },
      })
    },

    closeModal: () => {
      set({
        currentModal: {
          isOpen: false,
          lanternId: null,
        },
      })
    },

    setCelebration: (value: boolean) => {
      set({ celebration: value })
    },
  },
}))

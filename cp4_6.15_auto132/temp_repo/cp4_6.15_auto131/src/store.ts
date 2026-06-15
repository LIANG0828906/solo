import { create } from 'zustand'
import { calculateCarbon, getCarbonLevel } from './carbonCalculator'
import type { Category, ActivityItem } from './carbonCalculator'

type Badge = {
  id: string
  name: string
  description: string
  icon: string
}

type DailyRecord = {
  userId: string
  date: string
  activities: ActivityItem[]
  totalCarbon: number
  level: 'low' | 'medium' | 'high'
  advice: string
}

type LeaderboardEntry = {
  userId: string
  nickname: string
  avatar: string
  weeklyReduction: number
  badges: Badge[]
  rank: number
}

type UserProfile = {
  userId: string
  nickname: string
  avatar: string
  weeklyReduction: number
  badges: Badge[]
  challengeCount: number
}

type CarbonState = {
  activities: ActivityItem[]
  totalCarbon: number
  dailyRecord: DailyRecord | null
  leaderboard: LeaderboardEntry[]
  currentUser: UserProfile
  wsConnected: boolean
  showConfetti: boolean

  addActivity: (category: Category, name: string) => void
  removeActivity: (id: string) => void
  submitRecord: () => Promise<void>
  fetchLeaderboard: () => Promise<void>
  setCurrentUser: (user: UserProfile) => void
}

let nextId = 0

export const useStore = create<CarbonState>((set, get) => ({
  activities: [],
  totalCarbon: 0,
  dailyRecord: null,
  leaderboard: [],
  currentUser: {
    userId: 'user-0',
    nickname: '我',
    avatar: '🌿',
    weeklyReduction: 0,
    badges: [],
    challengeCount: 0,
  },
  wsConnected: false,
  showConfetti: false,

  addActivity: (category, name) => {
    const carbonKg = calculateCarbon(category, name)
    const id = `act-${++nextId}-${Date.now()}`
    const activity: ActivityItem = { id, category, name, carbonKg }
    set((state) => {
      const activities = [...state.activities, activity]
      const totalCarbon = activities.reduce((sum, a) => sum + a.carbonKg, 0)
      return { activities, totalCarbon }
    })
  },

  removeActivity: (id) => {
    set((state) => {
      const activities = state.activities.filter((a) => a.id !== id)
      const totalCarbon = activities.reduce((sum, a) => sum + a.carbonKg, 0)
      return { activities, totalCarbon }
    })
  },

  submitRecord: async () => {
    const { activities, totalCarbon, currentUser } = get()
    const level = getCarbonLevel(totalCarbon)
    const record: DailyRecord = {
      userId: currentUser.userId,
      date: new Date().toISOString().slice(0, 10),
      activities,
      totalCarbon,
      level,
    }

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      if (res.ok) {
        const data = await res.json()
        record.advice = data.advice || ''
        set({ dailyRecord: record, showConfetti: true })
      }
    } catch {
      // network error, ignore
    }
  },

  fetchLeaderboard: async () => {
    try {
      const res = await fetch('/api/leaderboard')
      if (res.ok) {
        const result = await res.json()
        const data: LeaderboardEntry[] = result.data ?? result
        set({ leaderboard: data })
      }
    } catch {
      // network error, ignore
    }
  },

  setCurrentUser: (user) => {
    set({ currentUser: user })
  },
}))

export type { DailyRecord, LeaderboardEntry, UserProfile, Badge }

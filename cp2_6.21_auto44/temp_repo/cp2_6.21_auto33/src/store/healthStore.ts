import { create } from 'zustand'
import {
  getTodayRecord,
  getWeekTrend,
  getGoal,
  updateGoal as updateGoalApi,
  submitRecord as submitRecordApi,
  HealthRecord,
  WeekTrendItem,
  Goal
} from '../api/health'

interface HealthState {
  todayRecord: HealthRecord | null
  weekTrend: WeekTrendItem[]
  goal: Goal | null
  loading: boolean
  fetchToday: (userId: number) => Promise<void>
  fetchWeek: (userId: number) => Promise<void>
  fetchGoal: (userId: number) => Promise<void>
  updateGoal: (goal: Goal) => Promise<void>
  submitRecord: (record: HealthRecord) => Promise<void>
}

export const useHealthStore = create<HealthState>((set) => ({
  todayRecord: null,
  weekTrend: [],
  goal: null,
  loading: false,

  fetchToday: async (userId: number) => {
    set({ loading: true })
    try {
      const record = await getTodayRecord(userId)
      set({ todayRecord: record })
    } finally {
      set({ loading: false })
    }
  },

  fetchWeek: async (userId: number) => {
    set({ loading: true })
    try {
      const trend = await getWeekTrend(userId)
      set({ weekTrend: trend })
    } finally {
      set({ loading: false })
    }
  },

  fetchGoal: async (userId: number) => {
    set({ loading: true })
    try {
      const goal = await getGoal(userId)
      set({ goal })
    } finally {
      set({ loading: false })
    }
  },

  updateGoal: async (goal: Goal) => {
    set({ loading: true })
    try {
      const updated = await updateGoalApi(goal)
      set({ goal: updated })
    } finally {
      set({ loading: false })
    }
  },

  submitRecord: async (record: HealthRecord) => {
    set({ loading: true })
    try {
      const saved = await submitRecordApi(record)
      set({ todayRecord: saved })
    } finally {
      set({ loading: false })
    }
  }
}))

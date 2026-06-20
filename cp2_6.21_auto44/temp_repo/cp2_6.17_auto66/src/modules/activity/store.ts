import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/utils/db'
import type { Activity } from '@/shared/types'

interface ActivityState {
  activities: Activity[]
  loading: boolean
  init: () => Promise<void>
  addActivity: (data: Omit<Activity, 'id' | 'createdAt'>) => Promise<Activity>
  getRecentActivities: (limit?: number) => Activity[]
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  activities: [],
  loading: false,

  init: async () => {
    set({ loading: true })
    try {
      const activities = await db.getActivities()
      set({
        activities: activities.sort((a, b) => b.createdAt - a.createdAt),
        loading: false,
      })
    } catch (error) {
      console.error('Failed to init activity store:', error)
      set({ loading: false })
    }
  },

  addActivity: async (data) => {
    const activity: Activity = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
    }
    await db.saveActivity(activity)
    set(state => ({
      activities: [activity, ...state.activities],
    }))
    return activity
  },

  getRecentActivities: (limit = 5) => get().activities.slice(0, limit),
}))

import { create } from 'zustand'
import {
  Activity,
  Registration,
  addActivity as dbAddActivity,
  getActivities as dbGetActivities,
  updateActivity as dbUpdateActivity,
  deleteActivity as dbDeleteActivity,
  addRegistration as dbAddRegistration,
  getAllRegistrations as dbGetAllRegistrations,
} from './db'

interface AppStore {
  activities: Activity[]
  registrations: Registration[]
  isAdmin: boolean
  currentUser: string | null
  initialized: boolean
  setActivities: (activities: Activity[]) => void
  addActivity: (activity: Activity) => Promise<void>
  updateActivity: (id: string, data: Partial<Activity>) => Promise<void>
  removeActivity: (id: string) => Promise<void>
  addRegistration: (registration: Registration) => Promise<void>
  setCurrentUser: (user: string | null) => void
  setIsAdmin: (value: boolean) => void
  initData: () => Promise<void>
  getRegistrationCount: (activityId: string) => number
}

export const useStore = create<AppStore>((set, get) => ({
  activities: [],
  registrations: [],
  isAdmin: false,
  currentUser: null,
  initialized: false,

  setActivities: (activities) => set({ activities }),

  addActivity: async (activity) => {
    await dbAddActivity(activity)
    set((state) => ({ activities: [...state.activities, activity] }))
  },

  updateActivity: async (id, data) => {
    await dbUpdateActivity(id, data)
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    }))
  },

  removeActivity: async (id) => {
    await dbDeleteActivity(id)
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
      registrations: state.registrations.filter((r) => r.activityId !== id),
    }))
  },

  addRegistration: async (registration) => {
    await dbAddRegistration(registration)
    set((state) => ({
      registrations: [...state.registrations, registration],
    }))
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  setIsAdmin: (value) => set({ isAdmin: value }),

  initData: async () => {
    if (get().initialized) return
    const [activities, registrations] = await Promise.all([
      dbGetActivities(),
      dbGetAllRegistrations(),
    ])
    set({ activities, registrations, initialized: true })
  },

  getRegistrationCount: (activityId) => {
    return get().registrations.filter((r) => r.activityId === activityId).length
  },
}))

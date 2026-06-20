import { create } from 'zustand'
import type { Activity, Equipment, Registration, WeatherForecast } from '@/types'

interface AppState {
  activities: Activity[]
  selectedActivityId: string | null
  equipment: Equipment[]
  registrations: Registration[]
  weatherForecasts: WeatherForecast[]
  isCreateModalOpen: boolean
  isRegistrationModalOpen: boolean
  isLoading: boolean
  mobileTab: 'detail' | 'equipment'

  fetchActivities: () => Promise<void>
  selectActivity: (id: string) => void
  createActivity: (data: Omit<Activity, 'id'>) => Promise<void>
  fetchEquipment: () => Promise<void>
  fetchRegistrations: (activityId: string) => Promise<void>
  registerMember: (data: {
    activityId: string
    memberName: string
    phone: string
    equipmentIds: string[]
  }) => Promise<void>
  fetchWeather: (activityId: string) => Promise<void>
  openCreateModal: () => void
  closeCreateModal: () => void
  openRegistrationModal: () => void
  closeRegistrationModal: () => void
  setMobileTab: (tab: 'detail' | 'equipment') => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activities: [],
  selectedActivityId: null,
  equipment: [],
  registrations: [],
  weatherForecasts: [],
  isCreateModalOpen: false,
  isRegistrationModalOpen: false,
  isLoading: false,
  mobileTab: 'detail',

  fetchActivities: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/activities')
      const data = await res.json()
      set({ activities: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  selectActivity: (id: string) => {
    set({ selectedActivityId: id, mobileTab: 'detail' })
    const state = get()
    state.fetchRegistrations(id)
    state.fetchWeather(id)
  },

  createActivity: async (data) => {
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const newActivity = await res.json()
      set((state) => ({
        activities: [newActivity, ...state.activities],
        isCreateModalOpen: false,
      }))
    } catch {
      console.error('Failed to create activity')
    }
  },

  fetchEquipment: async () => {
    try {
      const res = await fetch('/api/equipment')
      const data = await res.json()
      set({ equipment: data })
    } catch {
      console.error('Failed to fetch equipment')
    }
  },

  fetchRegistrations: async (activityId: string) => {
    try {
      const res = await fetch(`/api/registrations/${activityId}`)
      const data = await res.json()
      set({ registrations: data })
    } catch {
      console.error('Failed to fetch registrations')
    }
  },

  registerMember: async (data) => {
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const newReg = await res.json()
      set((state) => ({
        registrations: [...state.registrations, newReg],
        isRegistrationModalOpen: false,
      }))
      get().fetchEquipment()
    } catch {
      console.error('Failed to register')
    }
  },

  fetchWeather: async (activityId: string) => {
    try {
      const res = await fetch(`/api/weather/${activityId}`)
      const data = await res.json()
      set({ weatherForecasts: data })
    } catch {
      console.error('Failed to fetch weather')
    }
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openRegistrationModal: () => set({ isRegistrationModalOpen: true }),
  closeRegistrationModal: () => set({ isRegistrationModalOpen: false }),
  setMobileTab: (tab) => set({ mobileTab: tab }),
}))

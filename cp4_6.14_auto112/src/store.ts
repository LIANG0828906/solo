import { create } from 'zustand'
import type { Plant, CareEvent, HealthAnalysis } from '@/types'
import { api } from '@/utils/api'

interface AppState {
  plants: Plant[]
  selectedPlant: Plant | null
  events: CareEvent[]
  healthAnalysis: HealthAnalysis | null
  loading: boolean
  error: string | null

  fetchPlants: () => Promise<void>
  fetchPlant: (id: string) => Promise<void>
  createPlant: (data: Omit<Plant, 'id'>) => Promise<void>
  updatePlant: (id: string, data: Partial<Plant>) => Promise<void>
  deletePlant: (id: string) => Promise<void>
  fetchEvents: (plantId: string) => Promise<void>
  createEvent: (plantId: string, data: { type: string; date: string; notes?: string }) => Promise<void>
  deleteEvent: (eventId: string) => Promise<void>
  fetchHealthAnalysis: () => Promise<void>
  clearError: () => void
}

export const useStore = create<AppState>((set) => ({
  plants: [],
  selectedPlant: null,
  events: [],
  healthAnalysis: null,
  loading: false,
  error: null,

  fetchPlants: async () => {
    set({ loading: true, error: null })
    try {
      const plants = await api.getPlants()
      set({ plants, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchPlant: async (id) => {
    set({ loading: true, error: null })
    try {
      const plant = await api.getPlant(id)
      set({ selectedPlant: plant, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createPlant: async (data) => {
    set({ loading: true, error: null })
    try {
      const plant = await api.createPlant(data)
      set((state) => ({ plants: [...state.plants, plant], loading: false }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  updatePlant: async (id, data) => {
    set({ loading: true, error: null })
    try {
      const updated = await api.updatePlant(id, data)
      set((state) => ({
        plants: state.plants.map((p) => (p.id === id ? updated : p)),
        selectedPlant: state.selectedPlant?.id === id ? updated : state.selectedPlant,
        loading: false,
      }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  deletePlant: async (id) => {
    set({ loading: true, error: null })
    try {
      await api.deletePlant(id)
      set((state) => ({
        plants: state.plants.filter((p) => p.id !== id),
        loading: false,
      }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchEvents: async (plantId) => {
    set({ loading: true, error: null })
    try {
      const events = await api.getEvents(plantId)
      set({ events, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  createEvent: async (plantId, data) => {
    set({ loading: true, error: null })
    try {
      const event = await api.createEvent(plantId, data)
      set((state) => ({
        events: [event, ...state.events].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        loading: false,
      }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  deleteEvent: async (eventId) => {
    set({ loading: true, error: null })
    try {
      await api.deleteEvent(eventId)
      set((state) => ({
        events: state.events.filter((e) => e.id !== eventId),
        loading: false,
      }))
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchHealthAnalysis: async () => {
    set({ loading: true, error: null })
    try {
      const analysis = await api.getHealthAnalysis()
      set({ healthAnalysis: analysis, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

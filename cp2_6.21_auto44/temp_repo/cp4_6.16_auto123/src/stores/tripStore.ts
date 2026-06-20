import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del, keys } from 'idb-keyval'
import { v4 as uuidv4 } from 'uuid'
import { LuggageItem } from '../utils/templateEngine'
import { WeatherData } from '../utils/weatherMock'

export interface Trip {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  templateId: string
  templateName: string
  weather: WeatherData | null
  luggageItems: LuggageItem[]
  createdAt: string
  updatedAt: string
  status: 'upcoming' | 'ongoing' | 'completed'
  totalWeight?: number
}

interface TripStore {
  trips: Trip[]
  currentTripId: string | null
  isLoading: boolean
  error: string | null
  
  createTrip: (tripData: Omit<Trip, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Trip>
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>
  deleteTrip: (id: string) => Promise<void>
  getTrip: (id: string) => Trip | undefined
  setCurrentTrip: (id: string | null) => void
  
  addLuggageItem: (tripId: string, item: Omit<LuggageItem, 'id'>) => Promise<void>
  updateLuggageItem: (tripId: string, itemId: string, updates: Partial<LuggageItem>) => Promise<void>
  deleteLuggageItem: (tripId: string, itemId: string) => Promise<void>
  moveLuggageItem: (tripId: string, itemId: string, newCategory: string) => Promise<void>
  toggleItemPacked: (tripId: string, itemId: string) => Promise<void>
  
  loadTrips: () => Promise<void>
  getCompletedTrips: () => Trip[]
  getUpcomingTrips: () => Trip[]
  calculateTripWeight: (tripId: string) => number
}

const customIndexedDBStorage = {
  getItem: async (name: string) => {
    try {
      const val = await get(name)
      return val ?? null
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await set(name, value)
    } catch (e) {
      console.error('Failed to save to IndexedDB:', e)
    }
  },
  removeItem: async (name: string) => {
    try {
      await del(name)
    } catch (e) {
      console.error('Failed to remove from IndexedDB:', e)
    }
  }
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],
      currentTripId: null,
      isLoading: false,
      error: null,

      createTrip: async (tripData) => {
        const newTrip: Trip = {
          ...tripData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'upcoming',
          totalWeight: tripData.luggageItems.reduce((sum, item) => sum + (item.weight || 0), 0)
        }
        
        set((state) => ({
          trips: [...state.trips, newTrip]
        }))
        
        return newTrip
      },

      updateTrip: async (id, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
              : trip
          )
        }))
      },

      deleteTrip: async (id) => {
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
          currentTripId: state.currentTripId === id ? null : state.currentTripId
        }))
      },

      getTrip: (id) => {
        return get().trips.find((trip) => trip.id === id)
      },

      setCurrentTrip: (id) => {
        set({ currentTripId: id })
      },

      addLuggageItem: async (tripId, item) => {
        const newItem: LuggageItem = {
          ...item,
          id: uuidv4()
        }
        
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              luggageItems: [...trip.luggageItems, newItem],
              totalWeight: (trip.totalWeight || 0) + (newItem.weight || 0),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      updateLuggageItem: async (tripId, itemId, updates) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              luggageItems: trip.luggageItems.map((item) => {
                if (item.id !== itemId) return item
                const oldWeight = item.weight || 0
                const newWeight = updates.weight !== undefined ? updates.weight : oldWeight
                return { ...item, ...updates, weight: newWeight }
              }),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      deleteLuggageItem: async (tripId, itemId) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            const item = trip.luggageItems.find(i => i.id === itemId)
            return {
              ...trip,
              luggageItems: trip.luggageItems.filter((i) => i.id !== itemId),
              totalWeight: (trip.totalWeight || 0) - (item?.weight || 0),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      moveLuggageItem: async (tripId, itemId, newCategory) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              luggageItems: trip.luggageItems.map((item) =>
                item.id === itemId ? { ...item, category: newCategory } : item
              ),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      toggleItemPacked: async (tripId, itemId) => {
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip
            return {
              ...trip,
              luggageItems: trip.luggageItems.map((item) =>
                item.id === itemId ? { ...item, packed: !item.packed } : item
              ),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      loadTrips: async () => {
        set({ isLoading: true, error: null })
        try {
          const storedKeys = await keys()
          console.log('IndexedDB keys:', storedKeys)
          set({ isLoading: false })
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error.message : '加载失败' 
          })
        }
      },

      getCompletedTrips: () => {
        return get().trips
          .filter(trip => trip.status === 'completed')
          .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      },

      getUpcomingTrips: () => {
        const now = new Date()
        return get().trips
          .filter(trip => {
            const endDate = new Date(trip.endDate)
            return trip.status === 'upcoming' || endDate >= now
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      },

      calculateTripWeight: (tripId) => {
        const trip = get().trips.find(t => t.id === tripId)
        if (!trip) return 0
        return trip.luggageItems.reduce((sum, item) => sum + (item.weight || 0), 0)
      }
    }),
    {
      name: 'nomadnest-trips-storage',
      storage: createJSONStorage(() => customIndexedDBStorage),
    }
  )
)

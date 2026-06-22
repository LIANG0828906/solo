import { create } from 'zustand'
import type { Location, Recall, HeatData } from '@/types'
import { locations } from '@/data/locations'
import { recallApi } from '@/api/recallApi'

interface ParticleEffect {
  locationId: string
  x: number
  y: number
}

interface RecallState {
  locations: Location[]
  recalls: Record<string, Recall[]>
  heatData: Record<string, HeatData>
  selectedLocation: Location | null
  isModalOpen: boolean
  isLoading: boolean
  particleEffects: ParticleEffect[]

  setSelectedLocation: (location: Location | null) => void
  setModalOpen: (open: boolean) => void
  loadHeatData: () => Promise<void>
  loadRecalls: (locationId: string) => Promise<void>
  submitRecall: (locationId: string, type: 'text' | 'audio', content: string) => Promise<Recall>
  addParticleEffect: (locationId: string, x: number, y: number) => void
  removeParticleEffect: (locationId: string) => void
}

export const useRecallStore = create<RecallState>((set) => ({
  locations,
  recalls: {},
  heatData: {},
  selectedLocation: null,
  isModalOpen: false,
  isLoading: false,
  particleEffects: [],

  setSelectedLocation: (location) => set({ selectedLocation: location }),
  setModalOpen: (open) => set({ isModalOpen: open }),

  loadHeatData: async () => {
    try {
      const data = await recallApi.getHeatmap()
      const heatMap: Record<string, HeatData> = {}
      data.forEach((item) => {
        heatMap[item.location_id] = item
      })
      set({ heatData: heatMap })
    } catch (error) {
      console.error('Failed to load heat data:', error)
      const mockHeat: Record<string, HeatData> = {}
      locations.forEach((loc) => {
        mockHeat[loc.id] = {
          location_id: loc.id,
          heat_score: Math.floor(Math.random() * 100),
          last_updated: new Date().toISOString(),
        }
      })
      set({ heatData: mockHeat })
    }
  },

  loadRecalls: async (locationId: string) => {
    set({ isLoading: true })
    try {
      const data = await recallApi.getRecallsByLocation(locationId)
      set((state) => ({
        recalls: { ...state.recalls, [locationId]: data },
        isLoading: false,
      }))
    } catch (error) {
      console.error('Failed to load recalls:', error)
      const mockRecalls: Recall[] = [
        {
          id: '1',
          location_id: locationId,
          type: 'text',
          content: '在这里度过了最难忘的大学时光，每天都期待来这里看书。',
          timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: '2',
          location_id: locationId,
          type: 'text',
          content: '毕业三年了，还是会梦见这个地方。阳光洒在桌面上的感觉，一辈子都忘不掉。',
          timestamp: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
      ]
      set((state) => ({
        recalls: { ...state.recalls, [locationId]: mockRecalls },
        isLoading: false,
      }))
    }
  },

  submitRecall: async (locationId: string, type: 'text' | 'audio', content: string) => {
    const newRecall: Recall = {
      id: Date.now().toString(),
      location_id: locationId,
      type,
      content,
      timestamp: new Date().toISOString(),
    }

    try {
      await recallApi.submitRecall({
        location_id: locationId,
        type,
        content,
        timestamp: newRecall.timestamp,
      })
    } catch (error) {
      console.error('Failed to submit recall:', error)
    }

    set((state) => {
      const existingRecalls = state.recalls[locationId] || []
      return {
        recalls: {
          ...state.recalls,
          [locationId]: [newRecall, ...existingRecalls],
        },
      }
    })

    return newRecall
  },

  addParticleEffect: (locationId: string, x: number, y: number) => {
    set((state) => ({
      particleEffects: [...state.particleEffects, { locationId, x, y }],
    }))
  },

  removeParticleEffect: (locationId: string) => {
    set((state) => ({
      particleEffects: state.particleEffects.filter((p) => p.locationId !== locationId),
    }))
  },
}))

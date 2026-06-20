import { create } from 'zustand'

export interface StandRecord {
  id: string
  lat: number
  lng: number
  address: string
  timeSlot: 'morning' | 'noon' | 'evening'
  categories: string[]
  revenue: number
  createdAt: string
}

export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

export interface Filters {
  dateRange: [string, string] | null
  categories: string[]
  timeSlot: string | null
}

export type ViewMode = 'markers' | 'heatmap'

interface StandState {
  records: StandRecord[]
  filteredRecords: StandRecord[]
  filters: Filters
  heatmapData: HeatmapPoint[]
  viewMode: ViewMode
  selectedLocation: { lat: number; lng: number; address: string } | null
  blinkingIds: string[]
  showStats: boolean
  addRecord: (record: Omit<StandRecord, 'id' | 'createdAt'>) => Promise<void>
  fetchRecords: () => Promise<void>
  filterRecords: (filters: Partial<Filters>) => void
  generateHeatmapData: (period?: 'week' | 'month') => Promise<void>
  setViewMode: (mode: ViewMode) => void
  setSelectedLocation: (loc: { lat: number; lng: number; address: string } | null) => void
  setBlinkingIds: (ids: string[]) => void
  setShowStats: (show: boolean) => void
}

export const CATEGORIES = ['小吃', '饰品', '饮品', '服装', '水果', '蔬菜', '日用品', '手工艺品']

export const TIME_SLOTS = {
  morning: { label: '早 6-10点', value: 'morning' },
  noon: { label: '中 11-14点', value: 'noon' },
  evening: { label: '晚 17-21点', value: 'evening' },
} as const

export const getRevenueColor = (revenue: number): string => {
  if (revenue < 100) return '#3498DB'
  if (revenue <= 300) return '#2ECC71'
  return '#F1C40F'
}

export const getMarkerSize = (revenue: number): number => {
  const baseSize = 12
  const scale = Math.min(revenue / 100, 3)
  return baseSize + scale * 4
}

export const useStandStore = create<StandState>((set, get) => ({
  records: [],
  filteredRecords: [],
  filters: {
    dateRange: null,
    categories: [],
    timeSlot: null,
  },
  heatmapData: [],
  viewMode: 'markers',
  selectedLocation: null,
  blinkingIds: [],
  showStats: false,

  fetchRecords: async () => {
    try {
      const response = await fetch('/api/records')
      const result = await response.json()
      if (result.success) {
        set({ records: result.data, filteredRecords: result.data })
      }
    } catch (error) {
      console.error('Failed to fetch records:', error)
    }
  },

  addRecord: async (record) => {
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      const result = await response.json()
      if (result.success) {
        const { records } = get()
        const newRecords = [result.data, ...records]
        set({
          records: newRecords,
          filteredRecords: newRecords,
          selectedLocation: null,
        })
      }
    } catch (error) {
      console.error('Failed to add record:', error)
    }
  },

  filterRecords: (newFilters) => {
    const { records } = get()
    const updatedFilters = { ...get().filters, ...newFilters }

    let filtered = [...records]

    if (updatedFilters.dateRange) {
      const [start, end] = updatedFilters.dateRange
      filtered = filtered.filter((r) => {
        const date = new Date(r.createdAt)
        return date >= new Date(start) && date <= new Date(end + 'T23:59:59')
      })
    }

    if (updatedFilters.categories.length > 0) {
      filtered = filtered.filter((r) =>
        r.categories.some((c) => updatedFilters.categories.includes(c))
      )
    }

    if (updatedFilters.timeSlot) {
      filtered = filtered.filter((r) => r.timeSlot === updatedFilters.timeSlot)
    }

    set({
      filters: updatedFilters,
      filteredRecords: filtered,
      blinkingIds: filtered.map((r) => r.id),
    })

    setTimeout(() => set({ blinkingIds: [] }), 2000)
  },

  generateHeatmapData: async (period = 'month') => {
    try {
      const response = await fetch(`/api/heatmap?period=${period}`)
      const result = await response.json()
      if (result.success) {
        set({ heatmapData: result.data })
      }
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error)
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedLocation: (loc) => set({ selectedLocation: loc }),

  setBlinkingIds: (ids) => set({ blinkingIds: ids }),

  setShowStats: (show) => set({ showStats: show }),
}))

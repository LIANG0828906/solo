import { create } from 'zustand'
import { dataFetcher, DashboardData, AnomalyRecord, TimeSeriesPoint } from '../api/dataFetcher'

interface SnapshotEntry {
  timestamp: number
  data: DashboardData
}

interface DashboardState {
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  summary: DashboardData['summary'] | null
  timeSeries: TimeSeriesPoint[]
  anomalies: AnomalyRecord[]
  selectedAnomalyId: string | null
  zoomRange: { start: number; end: number } | null
  historySnapshots: SnapshotEntry[]
  lastUpdated: number | null

  fetchData: () => Promise<void>
  selectAnomaly: (id: string | null) => void
  setZoomRange: (range: { start: number; end: number } | null) => void
  clearError: () => void
}

const MAX_SNAPSHOTS = 48

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isLoading: false,
  isError: false,
  errorMessage: null,
  summary: null,
  timeSeries: [],
  anomalies: [],
  selectedAnomalyId: null,
  zoomRange: null,
  historySnapshots: [],
  lastUpdated: null,

  fetchData: async () => {
    const state = get()
    if (state.isLoading) return

    set({ isLoading: true, isError: false, errorMessage: null })

    try {
      const data = await dataFetcher.fetchDashboardData()

      const newSnapshot: SnapshotEntry = {
        timestamp: Date.now(),
        data
      }

      const snapshots = [newSnapshot, ...state.historySnapshots].slice(0, MAX_SNAPSHOTS)

      set({
        summary: data.summary,
        timeSeries: data.timeSeries,
        anomalies: data.anomalies,
        isLoading: false,
        lastUpdated: Date.now(),
        historySnapshots: snapshots
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '获取数据失败'
      set({
        isLoading: false,
        isError: true,
        errorMessage: message
      })
    }
  },

  selectAnomaly: (id: string | null) => {
    if (id === null) {
      set({ selectedAnomalyId: null, zoomRange: null })
      return
    }

    const { anomalies } = get()
    const anomaly = anomalies.find(a => a.id === id)

    if (anomaly) {
      const anomalyTime = anomaly.timestamp
      const range = {
        start: anomalyTime - 2 * 60 * 60 * 1000,
        end: anomalyTime + 1 * 60 * 60 * 1000
      }
      set({ selectedAnomalyId: id, zoomRange: range })
    } else {
      set({ selectedAnomalyId: id })
    }
  },

  setZoomRange: (range: { start: number; end: number } | null) => {
    set({ zoomRange: range })
  },

  clearError: () => {
    set({ isError: false, errorMessage: null })
  }
}))

import { create } from 'zustand'
import type { ChartType, Dataset, ViewState, Snapshot, DataPoint, DataSeries } from './types'
import { v4 as uuidv4 } from 'uuid'

interface DataStore {
  datasets: Dataset[]
  chartType: ChartType
  viewState: ViewState
  snapshots: Snapshot[]
  selectedPoint: { seriesId: string; pointIndex: number; data: DataPoint; seriesName: string } | null
  timeRange: { start: number; end: number } | null
  hasTimeDimension: boolean
  isLoading: boolean
  loadingProgress: number
  snapshotPanelCollapsed: boolean

  addDataset: (dataset: Omit<Dataset, 'id'>) => void
  removeDataset: (id: string) => void
  clearDatasets: () => void
  setChartType: (type: ChartType) => void
  setViewState: (state: Partial<ViewState>) => void
  setSelectedPoint: (point: { seriesId: string; pointIndex: number; data: DataPoint; seriesName: string } | null) => void
  setTimeRange: (range: { start: number; end: number } | null) => void
  setHasTimeDimension: (has: boolean) => void
  setLoading: (loading: boolean, progress?: number) => void
  toggleSnapshotPanel: () => void
  saveSnapshot: (name?: string) => void
  loadSnapshot: (id: string) => Snapshot | undefined
  deleteSnapshot: (id: string) => void
  getSeriesColors: () => Map<string, string>
}

const defaultViewState: ViewState = {
  cameraPosition: { x: 0, y: 15, z: 30 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  autoRotate: false,
  autoRotateSpeed: 0.5
}

const warmColor = '#FF6B35'
const coolColor = '#1A73E8'

function interpolateColor(color1: string, color2: string, factor: number): string {
  const hex = (x: string) => parseInt(x, 16)
  const r1 = hex(color1.slice(1, 3))
  const g1 = hex(color1.slice(3, 5))
  const b1 = hex(color1.slice(5, 7))
  const r2 = hex(color2.slice(1, 3))
  const g2 = hex(color2.slice(3, 5))
  const b2 = hex(color2.slice(5, 7))
  
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export const useDataStore = create<DataStore>((set, get) => ({
  datasets: [],
  chartType: 'bar',
  viewState: defaultViewState,
  snapshots: [],
  selectedPoint: null,
  timeRange: null,
  hasTimeDimension: false,
  isLoading: false,
  loadingProgress: 0,
  snapshotPanelCollapsed: false,

  addDataset: (dataset) => {
    const newDataset: Dataset = {
      ...dataset,
      id: uuidv4(),
      series: dataset.series.map(s => ({
        ...s,
        id: uuidv4()
      }))
    }
    
    const allSeries = [...get().datasets.flatMap(d => d.series), ...newDataset.series]
    const hasTime = allSeries.some(s => 
      s.data.some(p => p.time !== undefined) || 
      s.hasTimeDimension
    )
    
    set(state => ({
      datasets: [...state.datasets, newDataset],
      hasTimeDimension: hasTime
    }))
  },

  removeDataset: (id) => {
    set(state => ({
      datasets: state.datasets.filter(d => d.id !== id)
    }))
    const state = get()
    if (state.datasets.length === 0) {
      set({ hasTimeDimension: false })
    }
  },

  clearDatasets: () => {
    set({ datasets: [], hasTimeDimension: false, selectedPoint: null })
  },

  setChartType: (type) => {
    set({ chartType: type })
  },

  setViewState: (state) => {
    set(prev => ({
      viewState: { ...prev.viewState, ...state }
    }))
  },

  setSelectedPoint: (point) => {
    set({ selectedPoint: point })
  },

  setTimeRange: (range) => {
    set({ timeRange: range })
  },

  setHasTimeDimension: (has) => {
    set({ hasTimeDimension: has })
  },

  setLoading: (loading, progress) => {
    set({ 
      isLoading: loading, 
      loadingProgress: progress ?? (loading ? 0 : 100) 
    })
  },

  toggleSnapshotPanel: () => {
    set(state => ({ snapshotPanelCollapsed: !state.snapshotPanelCollapsed }))
  },

  saveSnapshot: (name) => {
    const state = get()
    const snapshot: Snapshot = {
      id: uuidv4(),
      name: name || `快照 ${state.snapshots.length + 1}`,
      timestamp: Date.now(),
      chartType: state.chartType,
      datasets: JSON.parse(JSON.stringify(state.datasets)),
      viewState: JSON.parse(JSON.stringify(state.viewState)),
      timeRange: state.timeRange ? { ...state.timeRange } : null,
      selectedPointIndex: state.selectedPoint 
        ? { seriesId: state.selectedPoint.seriesId, pointIndex: state.selectedPoint.pointIndex }
        : null
    }
    
    set(prev => ({
      snapshots: [...prev.snapshots, snapshot]
    }))
    
    return snapshot.id
  },

  loadSnapshot: (id) => {
    const snapshot = get().snapshots.find(s => s.id === id)
    if (snapshot) {
      set({
        chartType: snapshot.chartType,
        datasets: JSON.parse(JSON.stringify(snapshot.datasets)),
        viewState: JSON.parse(JSON.stringify(snapshot.viewState)),
        timeRange: snapshot.timeRange ? { ...snapshot.timeRange } : null,
        selectedPoint: null
      })
    }
    return snapshot
  },

  deleteSnapshot: (id) => {
    set(state => ({
      snapshots: state.snapshots.filter(s => s.id !== id)
    }))
  },

  getSeriesColors: () => {
    const { datasets } = get()
    const colorMap = new Map<string, string>()
    const allSeries = datasets.flatMap(d => d.series)
    
    allSeries.forEach((series, index) => {
      if (series.color) {
        colorMap.set(series.id, series.color)
      } else {
        const factor = allSeries.length <= 1 ? 0 : index / (allSeries.length - 1)
        colorMap.set(series.id, interpolateColor(warmColor, coolColor, factor))
      }
    })
    
    return colorMap
  }
}))

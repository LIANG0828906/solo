import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  generateChartData,
  type ChartType,
  type ColorThemeKey,
  colorThemes,
  type LineChartData,
  type BarChartData,
  type PieChartData
} from '../utils/mockData'

export type RefreshInterval = 5 | 15 | 30 | 60

export interface ChartConfig {
  id: string
  type: ChartType
  dataSourceId: string
  colorTheme: ColorThemeKey
  refreshInterval: RefreshInterval
}

export interface DataSource {
  id: string
  name: string
  type: 'mock' | 'api'
}

export type ChartData = LineChartData | BarChartData | PieChartData

interface DashboardState {
  chartConfigs: ChartConfig[]
  dataSources: Record<string, DataSource>
  chartData: Record<string, ChartData>
  refreshTimers: Record<string, number | null>
  isPreviewMode: boolean
  lastUpdateTime: string

  addChart: (type: ChartType, insertIndex?: number) => void
  removeChart: (id: string) => void
  updateChart: (id: string, config: Partial<ChartConfig>) => void
  reorderCharts: (fromIndex: number, toIndex: number) => void
  setDataSource: (chartId: string, dataSourceId: string) => void
  setRefreshInterval: (chartId: string, interval: RefreshInterval) => void
  setColorTheme: (chartId: string, theme: ColorThemeKey) => void
  togglePreviewMode: () => void
  refreshChartData: (chartId: string) => void
  refreshAllChartData: () => void
  startDataRefresh: () => void
  stopDataRefresh: () => void
  updateLastUpdateTime: () => void
}

const defaultDataSources: Record<string, DataSource> = {
  'mock-sales': { id: 'mock-sales', name: '销售数据模拟', type: 'mock' },
  'mock-traffic': { id: 'mock-traffic', name: '流量数据模拟', type: 'mock' },
  'mock-revenue': { id: 'mock-revenue', name: '收入数据模拟', type: 'mock' },
  'mock-users': { id: 'mock-users', name: '用户数据模拟', type: 'mock' }
}

function formatLastUpdateTime(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  chartConfigs: [],
  dataSources: defaultDataSources,
  chartData: {},
  refreshTimers: {},
  isPreviewMode: false,
  lastUpdateTime: formatLastUpdateTime(),

  addChart: (type: ChartType, insertIndex?: number) => {
    const newChart: ChartConfig = {
      id: uuidv4(),
      type,
      dataSourceId: 'mock-sales',
      colorTheme: 'blue',
      refreshInterval: 30
    }

    set((state) => {
      const newConfigs = [...state.chartConfigs]
      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= newConfigs.length) {
        newConfigs.splice(insertIndex, 0, newChart)
      } else {
        newConfigs.push(newChart)
      }

      const newData = generateChartData(type)
      const newChartData = { ...state.chartData, [newChart.id]: newData }

      return {
        chartConfigs: newConfigs,
        chartData: newChartData
      }
    })
  },

  removeChart: (id: string) => {
    const state = get()
    const timer = state.refreshTimers[id]
    if (timer) {
      window.clearInterval(timer)
    }

    set((state) => {
      const { [id]: _, ...remainingData } = state.chartData
      const { [id]: __, ...remainingTimers } = state.refreshTimers
      return {
        chartConfigs: state.chartConfigs.filter(c => c.id !== id),
        chartData: remainingData,
        refreshTimers: remainingTimers
      }
    })
  },

  updateChart: (id: string, config: Partial<ChartConfig>) => {
    set((state) => ({
      chartConfigs: state.chartConfigs.map(c =>
        c.id === id ? { ...c, ...config } : c
      )
    }))
  },

  reorderCharts: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const newConfigs = [...state.chartConfigs]
      const [removed] = newConfigs.splice(fromIndex, 1)
      newConfigs.splice(toIndex, 0, removed)
      return { chartConfigs: newConfigs }
    })
  },

  setDataSource: (chartId: string, dataSourceId: string) => {
    get().updateChart(chartId, { dataSourceId })
    get().refreshChartData(chartId)
  },

  setRefreshInterval: (chartId: string, interval: RefreshInterval) => {
    const state = get()
    const oldTimer = state.refreshTimers[chartId]
    if (oldTimer) {
      window.clearInterval(oldTimer)
    }

    get().updateChart(chartId, { refreshInterval: interval })

    if (state.isPreviewMode) {
      const timer = window.setInterval(() => {
        get().refreshChartData(chartId)
      }, interval * 1000)
      set((state) => ({
        refreshTimers: { ...state.refreshTimers, [chartId]: timer }
      }))
    }
  },

  setColorTheme: (chartId: string, theme: ColorThemeKey) => {
    get().updateChart(chartId, { colorTheme: theme })
  },

  togglePreviewMode: () => {
    const state = get()
    const newMode = !state.isPreviewMode
    set({ isPreviewMode: newMode })

    if (newMode) {
      get().startDataRefresh()
    } else {
      get().stopDataRefresh()
    }
  },

  refreshChartData: (chartId: string) => {
    const state = get()
    const chart = state.chartConfigs.find(c => c.id === chartId)
    if (!chart) return

    const newData = generateChartData(chart.type)
    set((state) => ({
      chartData: { ...state.chartData, [chartId]: newData }
    }))
    get().updateLastUpdateTime()
  },

  refreshAllChartData: () => {
    const state = get()
    const newChartData: Record<string, ChartData> = { ...state.chartData }
    
    state.chartConfigs.forEach(chart => {
      newChartData[chart.id] = generateChartData(chart.type)
    })

    set({ chartData: newChartData })
    get().updateLastUpdateTime()
  },

  startDataRefresh: () => {
    const state = get()
    const newTimers: Record<string, number | null> = { ...state.refreshTimers }

    state.chartConfigs.forEach(chart => {
      if (newTimers[chart.id]) {
        window.clearInterval(newTimers[chart.id]!)
      }
      const timer = window.setInterval(() => {
        get().refreshChartData(chart.id)
      }, chart.refreshInterval * 1000)
      newTimers[chart.id] = timer
    })

    set({ refreshTimers: newTimers })
  },

  stopDataRefresh: () => {
    const state = get()
    Object.values(state.refreshTimers).forEach(timer => {
      if (timer) window.clearInterval(timer)
    })
    set({ refreshTimers: {} })
  },

  updateLastUpdateTime: () => {
    set({ lastUpdateTime: formatLastUpdateTime() })
  }
}))

export { colorThemes }

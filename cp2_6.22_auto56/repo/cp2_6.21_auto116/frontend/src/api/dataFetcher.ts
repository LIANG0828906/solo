import axios from 'axios'

export interface OrderSummary {
  totalOrders: number
  totalSales: number
  avgOrderValue: number
  totalInventoryChange: number
}

export interface TimeSeriesPoint {
  time: string
  timestamp: number
  sales: number
  orders: number
  inventory: number
}

export interface AnomalyRecord {
  id: string
  time: string
  timestamp: number
  platform: string
  metric: string
  currentValue: number
  historicalAvg: number
  stdDev: number
  deviation: number
  threshold: number
  severity: 'warning' | 'critical'
}

export interface DashboardData {
  summary: OrderSummary
  timeSeries: TimeSeriesPoint[]
  anomalies: AnomalyRecord[]
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const dataFetcher = {
  async fetchDashboardData(): Promise<DashboardData> {
    const response = await api.get('/dashboard')
    return response.data
  },

  async fetchAnomalyDetail(anomalyId: string): Promise<AnomalyRecord> {
    const response = await api.get(`/anomalies/${anomalyId}`)
    return response.data
  }
}

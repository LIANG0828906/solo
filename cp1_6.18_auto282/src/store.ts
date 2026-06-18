import { create } from 'zustand'
import type { Report, ReportsResponse, QueryParams, FacilityType, ReportStatus } from './types'
import * as api from './api'

interface ReportState {
  reports: Report[]
  total: number
  page: number
  totalPages: number
  currentReport: Report | null
  loading: boolean
  error: string | null
  toast: string | null

  fetchReports: (params?: QueryParams) => Promise<void>
  fetchReport: (id: string) => Promise<void>
  addReport: (data: {
    facilityType: FacilityType
    description: string
    image?: File
    lat: number
    lng: number
  }) => Promise<void>
  changeStatus: (id: string, status: ReportStatus) => Promise<void>
  setToast: (message: string | null) => void
  clearError: () => void
}

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  total: 0,
  page: 1,
  totalPages: 0,
  currentReport: null,
  loading: false,
  error: null,
  toast: null,

  fetchReports: async (params?: QueryParams) => {
    set({ loading: true, error: null })
    try {
      const response: ReportsResponse = await api.getReports(params)
      set({
        reports: response.reports,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
        loading: false
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取数据失败', loading: false })
    }
  },

  fetchReport: async (id: string) => {
    set({ loading: true, error: null, currentReport: null })
    try {
      const report = await api.getReport(id)
      set({ currentReport: report, loading: false })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取详情失败', loading: false })
    }
  },

  addReport: async (data) => {
    set({ loading: true, error: null })
    try {
      await api.createReport(data)
      set({ loading: false, toast: '上报成功' })
      setTimeout(() => set({ toast: null }), 3000)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '上报失败', loading: false })
      throw err
    }
  },

  changeStatus: async (id: string, status: ReportStatus) => {
    set({ loading: true, error: null })
    try {
      await api.updateStatus(id, status)
      const currentReports = get().reports
      const updatedReports = currentReports.map(r =>
        r.id === id ? { ...r, status } : r
      )
      set({ reports: updatedReports, loading: false, toast: '状态更新成功' })
      setTimeout(() => set({ toast: null }), 3000)
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新状态失败', loading: false })
      throw err
    }
  },

  setToast: (message) => set({ toast: message }),

  clearError: () => set({ error: null })
}))

import { create } from 'zustand'
import type { TimeRecord, LeaveRequest, Summary } from '../../shared/types'

interface AppState {
  records: TimeRecord[]
  leaves: LeaveRequest[]
  summary: Summary | null
  toast: { message: string; visible: boolean }
  period: 'week' | 'month'
  setRecords: (records: TimeRecord[]) => void
  setLeaves: (leaves: LeaveRequest[]) => void
  setSummary: (summary: Summary) => void
  showToast: (message: string) => void
  hideToast: () => void
  setPeriod: (period: 'week' | 'month') => void
}

export const useStore = create<AppState>((set) => ({
  records: [],
  leaves: [],
  summary: null,
  toast: { message: '', visible: false },
  period: 'week',
  setRecords: (records) => set({ records }),
  setLeaves: (leaves) => set({ leaves }),
  setSummary: (summary) => set({ summary }),
  showToast: (message) => {
    set({ toast: { message, visible: true } })
    setTimeout(() => set({ toast: { message: '', visible: false } }), 2000)
  },
  hideToast: () => set({ toast: { message: '', visible: false } }),
  setPeriod: (period) => set({ period }),
}))

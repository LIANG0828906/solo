import { create } from 'zustand'
import type { SignRecord, SignStoreState } from '@/types'
import { addRecordToDB, getAllRecordsFromDB } from '@/utils/db'

function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export const useSignStore = create<SignStoreState>((set, get) => ({
  records: [],
  initialized: false,

  initStore: async () => {
    if (get().initialized) return
    try {
      const records = await getAllRecordsFromDB()
      set({ records, initialized: true })
    } catch (error) {
      console.error('初始化数据失败:', error)
      set({ initialized: true })
    }
  },

  addRecord: (record) => {
    const newRecord: SignRecord = {
      ...record,
      id: generateId(),
      timestamp: new Date().toISOString(),
    }

    addRecordToDB(newRecord).catch((err) => {
      console.error('写入IndexedDB失败:', err)
    })

    set((state) => ({
      records: [...state.records, newRecord],
    }))

    return newRecord
  },

  queryRecords: (filters) => {
    const { records } = get()
    let result = [...records]

    if (filters.trackingNumber && filters.trackingNumber.trim()) {
      const keyword = filters.trackingNumber.trim().toLowerCase()
      result = result.filter((r) => r.trackingNumber.toLowerCase().includes(keyword))
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime()
      result = result.filter((r) => new Date(r.timestamp).getTime() >= start)
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate + 'T23:59:59').getTime()
      result = result.filter((r) => new Date(r.timestamp).getTime() <= end)
    }

    if (filters.courier && filters.courier.trim()) {
      result = result.filter((r) => r.courier === filters.courier)
    }

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return result
  },

  getCouriers: () => {
    const { records } = get()
    const couriers = new Set<string>()
    records.forEach((r) => {
      if (r.courier && r.courier.trim()) {
        couriers.add(r.courier.trim())
      }
    })
    return Array.from(couriers).sort()
  },
}))

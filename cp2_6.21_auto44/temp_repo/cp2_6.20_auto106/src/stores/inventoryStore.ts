import { create } from 'zustand'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import type { InventoryStoreState, Consumable, StockRecord, TrendData, StockStatus, Alert } from '@/types'

const API_BASE = '/api'

export const useInventoryStore = create<InventoryStoreState>((set, get) => ({
  consumables: [],
  records: [],
  alerts: [],
  searchKeyword: '',
  statusFilter: 'all',
  loading: false,
  alertCount: 0,
  selectedConsumableId: null,

  fetchInventory: async () => {
    set({ loading: true })
    try {
      const response = await axios.get<Consumable[]>(`${API_BASE}/inventory`)
      set({ consumables: response.data })
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchRecords: async () => {
    try {
      const response = await axios.get<StockRecord[]>(`${API_BASE}/inventory/records`)
      set({ records: response.data })
    } catch (error) {
      console.error('Failed to fetch records:', error)
    }
  },

  fetchTrends: async (consumableId?: string) => {
    try {
      const url = consumableId
        ? `${API_BASE}/inventory/trends?consumableId=${consumableId}`
        : `${API_BASE}/inventory/trends`
      const response = await axios.get<TrendData[]>(url)
      return response.data
    } catch (error) {
      console.error('Failed to fetch trends:', error)
      return []
    }
  },

  updateStock: async (id: string, type: 'in' | 'out', quantity: number, remark?: string) => {
    try {
      await axios.post(`${API_BASE}/inventory/check`, {
        consumableId: id,
        type,
        quantity,
        remark,
      })
      await get().fetchInventory()
      await get().fetchRecords()
    } catch (error) {
      console.error('Failed to update stock:', error)
      throw error
    }
  },

  triggerCheck: async (id: string) => {
    try {
      await axios.post(`${API_BASE}/inventory/check`, {
        consumableId: id,
        type: 'check',
        quantity: 0,
      })
      await get().fetchInventory()
    } catch (error) {
      console.error('Failed to trigger check:', error)
    }
  },

  setSearchKeyword: (keyword: string) => set({ searchKeyword: keyword }),

  setStatusFilter: (status: StockStatus | 'all') => set({ statusFilter: status }),

  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => {
    const newAlert: Alert = {
      ...alert,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      read: false,
    }
    set((state) => ({
      alerts: [newAlert, ...state.alerts],
      alertCount: state.alertCount + 1,
    }))
  },

  markAlertAsRead: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, read: true } : a
      ),
      alertCount: state.alerts.filter((a) => !a.read && a.id !== alertId).length,
    }))
  },

  setAlertCount: (count: number) => set({ alertCount: count }),

  setSelectedConsumableId: (id: string | null) => set({ selectedConsumableId: id }),

  getStockStatus: (current: number, threshold: number): StockStatus => {
    if (current < threshold * 0.5) return 'critical'
    if (current < threshold) return 'low'
    return 'normal'
  },

  getFilteredConsumables: () => {
    const { consumables, searchKeyword, statusFilter, getStockStatus } = get()
    return consumables.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.code.toLowerCase().includes(searchKeyword.toLowerCase())
      const status = getStockStatus(item.currentStock, item.safetyThreshold)
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesSearch && matchesStatus
    })
  },

  getRecentConsumables: (limit: number = 5) => {
    const { consumables, records } = get()
    const recentConsumableIds = new Set<string>()
    const recentConsumables: Consumable[] = []

    for (const record of records) {
      if (!recentConsumableIds.has(record.consumableId)) {
        const consumable = consumables.find(c => c.id === record.consumableId)
        if (consumable) {
          recentConsumableIds.add(record.consumableId)
          recentConsumables.push(consumable)
          if (recentConsumables.length >= limit) break
        }
      }
    }

    if (recentConsumables.length < limit) {
      const remaining = consumables
        .filter(c => !recentConsumableIds.has(c.id))
        .sort((a, b) => new Date(b.lastCheckTime).getTime() - new Date(a.lastCheckTime).getTime())
        .slice(0, limit - recentConsumables.length)
      recentConsumables.push(...remaining)
    }

    return recentConsumables
  },

  quickUpdateStock: async (id: string, type: 'in' | 'out', quantity: number) => {
    try {
      const response = await axios.post(`${API_BASE}/inventory/check`, {
        consumableId: id,
        type,
        quantity,
        remark: `快速${type === 'in' ? '入库' : '出库'}`,
      })

      const updatedConsumable = response.data.consumable
      set((state) => ({
        consumables: state.consumables.map(c =>
          c.id === id ? updatedConsumable : c
        ),
      }))

      await get().fetchRecords()
      return response.data
    } catch (error) {
      console.error('Failed to quick update stock:', error)
      throw error
    }
  },
}))

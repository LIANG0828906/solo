import { create } from 'zustand'
import api from '@/api/client'
import type {
  Order,
  OrderStatus,
  GlazeFormula,
  GreenwareStock,
  RawMaterialStock,
  FinishedProduct,
  KilnFiring,
  MaterialWarning,
} from '../../shared/types'

export const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'throwing',
  'trimming',
  'bisque',
  'glaze',
  'polishing',
  'completed',
]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '泥坯准备中',
  throwing: '拉坯成型',
  trimming: '修坯干燥',
  bisque: '素烧',
  glaze: '釉烧',
  polishing: '打磨出窑',
  completed: '已完成',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#BDBDBD',
  confirmed: '#BDBDBD',
  preparing: '#42A5F5',
  throwing: '#42A5F5',
  trimming: '#42A5F5',
  bisque: '#FF7043',
  glaze: '#FF7043',
  polishing: '#FF7043',
  completed: '#66BB6A',
}

export const VESSEL_LABELS: Record<string, string> = {
  cup: '杯',
  bowl: '碗',
  plate: '盘',
  vase: '花瓶',
  teapot: '茶壶',
  decor: '摆件',
}

export const CLAY_LABELS: Record<string, string> = {
  white_porcelain: '白瓷',
  coarse_pottery: '粗陶',
  red_clay: '红陶',
  stoneware: '炻器',
}

export const GLAZE_BASE_LABELS: Record<string, string> = {
  transparent: '透明',
  opaque: '乳浊',
  crystalline: '结晶',
  metallic: '金属',
}

export const MATERIAL_LABELS: Record<string, string> = {
  feldspar: '长石',
  quartz: '石英',
  kaolin: '高岭土',
  limestone: '石灰石',
  iron_oxide: '氧化铁',
  cobalt_oxide: '氧化钴',
}

const WARN_STORAGE_KEY = 'pottery_dismissed_warnings'

interface AppState {
  orders: Order[]
  glazes: GlazeFormula[]
  greenware: GreenwareStock[]
  rawMaterials: RawMaterialStock[]
  finishedProducts: FinishedProduct[]
  kilnBatches: KilnFiring[]
  selectedOrderId: string | null
  orderStatusFilter: OrderStatus | 'all'
  searchKeyword: string
  warnings: MaterialWarning[]
  dismissedWarningIds: string[]
  loading: boolean

  loadAllData: () => Promise<void>
  loadOrders: () => Promise<void>
  loadGlazes: () => Promise<void>
  loadKilnBatches: () => Promise<void>
  loadInventory: () => Promise<void>
  loadWarnings: () => Promise<void>

  createOrder: (data: Partial<Order>) => Promise<Order | null>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  selectOrder: (orderId: string | null) => void
  setOrderStatusFilter: (filter: OrderStatus | 'all') => void
  setSearchKeyword: (keyword: string) => void

  createGlaze: (data: Partial<GlazeFormula>) => Promise<GlazeFormula | null>
  updateGlaze: (id: string, data: Partial<GlazeFormula>) => Promise<GlazeFormula | null>
  deleteGlaze: (id: string) => Promise<void>

  createKilnBatch: (data: Partial<KilnFiring>) => Promise<KilnFiring | null>
  addTemperatureRecord: (batchId: string, temperature: number, remainingMinutes: number) => Promise<KilnFiring | null>
  completeKilnBatch: (batchId: string, report: { tempDeviation: string; colorEffect: string }) => Promise<KilnFiring | null>

  dismissWarning: (warningId: string) => void
  isWarningDismissed: (warningId: string) => boolean
}

function loadDismissedFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(WARN_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<{ id: string; dismissedAt: number }>
    const now = Date.now()
    return parsed
      .filter((item) => now - item.dismissedAt < 24 * 60 * 60 * 1000)
      .map((item) => item.id)
  } catch {
    return []
  }
}

function saveDismissedToStorage(ids: string[]): void {
  try {
    const now = Date.now()
    const data = ids.map((id) => ({ id, dismissedAt: now }))
    localStorage.setItem(WARN_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  orders: [],
  glazes: [],
  greenware: [],
  rawMaterials: [],
  finishedProducts: [],
  kilnBatches: [],
  selectedOrderId: null,
  orderStatusFilter: 'all',
  searchKeyword: '',
  warnings: [],
  dismissedWarningIds: loadDismissedFromStorage(),
  loading: false,

  loadAllData: async () => {
    set({ loading: true })
    try {
      await Promise.all([
        get().loadOrders(),
        get().loadGlazes(),
        get().loadKilnBatches(),
        get().loadInventory(),
        get().loadWarnings(),
      ])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      set({ loading: false })
    }
  },

  loadOrders: async () => {
    const res = await api.get('/orders')
    if (res.data?.success) {
      set({ orders: res.data.data || [] })
    }
  },

  loadGlazes: async () => {
    const res = await api.get('/glazes')
    if (res.data?.success) {
      set({ glazes: res.data.data || [] })
    }
  },

  loadKilnBatches: async () => {
    const res = await api.get('/kiln')
    if (res.data?.success) {
      set({ kilnBatches: res.data.data || [] })
    }
  },

  loadInventory: async () => {
    const [greenwareRes, materialsRes, finishedRes] = await Promise.all([
      api.get('/inventory/greenware'),
      api.get('/inventory/materials'),
      api.get('/inventory/finished'),
    ])
    set({
      greenware: greenwareRes.data?.data || [],
      rawMaterials: materialsRes.data?.data || [],
      finishedProducts: finishedRes.data?.data || [],
    })
  },

  loadWarnings: async () => {
    const res = await api.get('/inventory/warnings')
    if (res.data?.success) {
      set({ warnings: res.data.data || [] })
    }
  },

  createOrder: async (data) => {
    const res = await api.post('/orders', data)
    if (res.data?.success) {
      const newOrder = res.data.data as Order
      set((state) => ({ orders: [newOrder, ...state.orders] }))
      return newOrder
    }
    return null
  },

  updateOrderStatus: async (orderId, status) => {
    const res = await api.patch(`/orders/${orderId}/status`, { status })
    if (res.data?.success) {
      const updated = res.data.data as Order
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      }))
    }
  },

  selectOrder: (orderId) => set({ selectedOrderId: orderId }),
  setOrderStatusFilter: (filter) => set({ orderStatusFilter: filter }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  createGlaze: async (data) => {
    const res = await api.post('/glazes', data)
    if (res.data?.success) {
      const newGlaze = res.data.data as GlazeFormula
      set((state) => ({ glazes: [...state.glazes, newGlaze] }))
      return newGlaze
    }
    return null
  },

  updateGlaze: async (id, data) => {
    const res = await api.put(`/glazes/${id}`, data)
    if (res.data?.success) {
      const updated = res.data.data as GlazeFormula
      set((state) => ({
        glazes: state.glazes.map((g) => (g.id === id ? updated : g)),
      }))
      return updated
    }
    return null
  },

  deleteGlaze: async (id) => {
    await api.delete(`/glazes/${id}`)
    set((state) => ({ glazes: state.glazes.filter((g) => g.id !== id) }))
  },

  createKilnBatch: async (data) => {
    const res = await api.post('/kiln', data)
    if (res.data?.success) {
      const newBatch = res.data.data as KilnFiring
      set((state) => ({ kilnBatches: [newBatch, ...state.kilnBatches] }))
      return newBatch
    }
    return null
  },

  addTemperatureRecord: async (batchId, temperature, remainingMinutes) => {
    const res = await api.post(`/kiln/${batchId}/record`, {
      temperature,
      remainingMinutes,
    })
    if (res.data?.success) {
      const updated = res.data.data as KilnFiring
      set((state) => ({
        kilnBatches: state.kilnBatches.map((b) => (b.id === batchId ? updated : b)),
      }))
      return updated
    }
    return null
  },

  completeKilnBatch: async (batchId, report) => {
    const res = await api.post(`/kiln/${batchId}/complete`, report)
    if (res.data?.success) {
      const updated = res.data.data as KilnFiring
      set((state) => ({
        kilnBatches: state.kilnBatches.map((b) => (b.id === batchId ? updated : b)),
      }))
      return updated
    }
    return null
  },

  dismissWarning: (warningId) => {
    const dismissed = [...get().dismissedWarningIds, warningId]
    set({ dismissedWarningIds: dismissed })
    saveDismissedToStorage(dismissed)
  },

  isWarningDismissed: (warningId) => {
    return get().dismissedWarningIds.includes(warningId)
  },
}))

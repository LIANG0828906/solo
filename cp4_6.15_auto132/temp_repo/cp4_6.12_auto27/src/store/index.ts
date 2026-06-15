import { create } from 'zustand'

export interface Product {
  id: number
  name: string
  category: string
  description: string
  base_price: number
  clay_types: string[]
  glaze_colors: string[]
  image_url: string
}

export interface Material {
  id: number
  name: string
  type: 'clay' | 'glaze'
  current_stock: number
  unit: string
  threshold: number
  consumption_30d: number
}

export interface ProcessStep {
  id: number
  order_id: number
  step_name: string
  status: 'pending' | 'in_progress' | 'completed'
  assignee?: string | null
  completed_at?: string | null
}

export interface Order {
  id: number
  product_id: number
  product_name: string
  quantity: number
  clay_type: string
  glaze_color: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  reference_images: string[]
  special_notes?: string
  status: 'pending' | 'making' | 'shipped' | 'completed'
  total_price: number
  clay_used: number
  glaze_used: number
  created_at: string
  updated_at: string
  steps: ProcessStep[]
}

export interface FiringRecord {
  id: number
  order_id?: number | null
  firing_type: string
  start_time?: string | null
  end_time?: string | null
  temp_curve: Array<{ time: number; temp: number }>
  notes?: string
}

export interface Stats {
  totalOrders: number
  pendingOrders: number
  makingOrders: number
  totalRevenue: number
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface AppState {
  products: Product[]
  orders: Order[]
  ordersTotal: number
  ordersPage: number
  materials: Material[]
  warningMaterials: Material[]
  warningCount: number
  firingRecords: FiringRecord[]
  stats: Stats
  toasts: Toast[]
  loading: {
    products: boolean
    orders: boolean
    materials: boolean
  }
  selectedProduct: Product | null
  activeNav: string
  sidebarOpen: boolean

  setActiveNav: (nav: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedProduct: (p: Product | null) => void
  setProducts: (products: Product[]) => void
  setOrders: (orders: Order[], total: number, page: number) => void
  updateOrderInList: (order: Order) => void
  addOrder: (order: Order) => void
  setMaterials: (materials: Material[], warnings: Material[], count: number) => void
  setFiringRecords: (records: FiringRecord[]) => void
  setStats: (stats: Stats) => void
  setLoading: (key: keyof AppState['loading'], val: boolean) => void
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  orders: [],
  ordersTotal: 0,
  ordersPage: 1,
  materials: [],
  warningMaterials: [],
  warningCount: 0,
  firingRecords: [],
  stats: { totalOrders: 0, pendingOrders: 0, makingOrders: 0, totalRevenue: 0 },
  toasts: [],
  loading: { products: false, orders: false, materials: false },
  selectedProduct: null,
  activeNav: 'customer',
  sidebarOpen: false,

  setActiveNav: (nav) => set({ activeNav: nav, sidebarOpen: false }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedProduct: (p) => set({ selectedProduct: p }),
  setProducts: (products) => set({ products }),
  setOrders: (orders, total, page) => set({ orders, ordersTotal: total, ordersPage: page }),
  updateOrderInList: (order) =>
    set({
      orders: get().orders.map((o) => (o.id === order.id ? { ...o, ...order } : o)),
    }),
  addOrder: (order) =>
    set({
      orders: [order, ...get().orders],
      ordersTotal: get().ordersTotal + 1,
    }),
  setMaterials: (materials, warnings, count) =>
    set({ materials, warningMaterials: warnings, warningCount: count }),
  setFiringRecords: (records) => set({ firingRecords: records }),
  setStats: (stats) => set({ stats }),
  setLoading: (key, val) => set({ loading: { ...get().loading, [key]: val } }),
  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2, 9)
    set({ toasts: [...get().toasts, { id, type, message }] })
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) })
    }, 3200)
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const GLAZE_COLORS: Record<string, { name: string; hex: string }> = {
  青釉: { name: '青釉', hex: '#7BA23F' },
  天目釉: { name: '天目釉', hex: '#2C1810' },
  铁锈釉: { name: '铁锈釉', hex: '#8B4513' },
  结晶釉: { name: '结晶釉', hex: '#DAA520' },
  裂纹釉: { name: '裂纹釉', hex: '#6B8E23' },
}

export const CLAY_TYPES: Record<string, { name: string; hex: string }> = {
  白瓷泥: { name: '白瓷', hex: '#F5F5DC' },
  粗陶泥: { name: '粗陶', hex: '#A0522D' },
  紫砂泥: { name: '紫砂', hex: '#6B4423' },
  炻器泥: { name: '炻器', hex: '#8B7355' },
}

export const CLAY_NAMES: Record<string, string> = {
  白瓷: '白瓷泥',
  粗陶: '粗陶泥',
  紫砂: '紫砂泥',
  炻器: '炻器泥',
}

export const CATEGORY_ICONS: Record<string, string> = {
  杯子: '☕',
  碗: '🥣',
  花瓶: '🏺',
  茶壶: '🫖',
  摆件: '🎐',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  making: '制作中',
  shipped: '已发货',
  completed: '已完成',
}

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'

export type OrderStatus = 'pending' | 'confirmed' | 'producing' | 'completed' | 'delivered'
export type ProductCategory = 'wallet' | 'belt' | 'backpack' | 'cardholder' | 'keycase'
export type LeatherType = 'vegetable' | 'chrome' | 'shell' | 'all'

export interface Order {
  id: string
  customerName: string
  category: ProductCategory
  size: string
  color: string
  hardware: string
  estimatedHours: number
  materialCost: number
  status: OrderStatus
  leatherType: LeatherType
  leatherConsumption: number
  statusTimestamps: Record<OrderStatus, string | null>
  createdAt: string
}

export interface Material {
  id: string
  name: string
  type: Exclude<LeatherType, 'all'>
  area: number
  unitPrice: number
  dailyConsumption: number
  lastUpdated: string
}

interface WorkshopState {
  orders: Order[]
  inventory: Material[]
  statusFilter: OrderStatus | 'all'
  categoryFilter: ProductCategory | 'all'
  leatherTypeFilter: LeatherType
  addOrder: (orderData: Omit<Order, 'id' | 'status' | 'statusTimestamps' | 'createdAt' | 'estimatedHours' | 'materialCost' | 'leatherConsumption'>) => void
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void
  consumeMaterial: (leatherType: LeatherType, amount: number) => void
  setStatusFilter: (status: OrderStatus | 'all') => void
  setCategoryFilter: (category: ProductCategory | 'all') => void
  setLeatherTypeFilter: (type: LeatherType) => void
  getFilteredOrders: () => Order[]
  getFilteredInventory: () => Material[]
}

const calculateEstimatedHours = (category: ProductCategory): number => {
  const hoursMap: Record<ProductCategory, number> = {
    wallet: 8,
    belt: 4,
    backpack: 24,
    cardholder: 3,
    keycase: 2
  }
  return hoursMap[category]
}

const calculateMaterialCost = (category: ProductCategory, leatherUnitPrice: number): number => {
  const consumptionMap: Record<ProductCategory, number> = {
    wallet: 1.2,
    belt: 0.8,
    backpack: 3.5,
    cardholder: 0.5,
    keycase: 0.3
  }
  return consumptionMap[category] * leatherUnitPrice
}

const getLeatherConsumption = (category: ProductCategory): number => {
  const consumptionMap: Record<ProductCategory, number> = {
    wallet: 1.2,
    belt: 0.8,
    backpack: 3.5,
    cardholder: 0.5,
    keycase: 0.3
  }
  return consumptionMap[category]
}

const initialInventory: Material[] = [
  { id: 'mat-1', name: '植鞣革 - 棕色', type: 'vegetable', area: 25.5, unitPrice: 120, dailyConsumption: 2.5, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-2', name: '植鞣革 - 原色', type: 'vegetable', area: 18.0, unitPrice: 100, dailyConsumption: 2.5, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-3', name: '铬鞣革 - 黑色', type: 'chrome', area: 32.0, unitPrice: 80, dailyConsumption: 3.0, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-4', name: '铬鞣革 - 酒红', type: 'chrome', area: 15.5, unitPrice: 95, dailyConsumption: 3.0, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-5', name: '马臀皮 - 深棕', type: 'shell', area: 8.0, unitPrice: 350, dailyConsumption: 0.8, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-6', name: '马臀皮 - 黑色', type: 'shell', area: 6.5, unitPrice: 380, dailyConsumption: 0.8, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
]

const initialOrders: Order[] = [
  {
    id: uuidv4(),
    customerName: '张先生',
    category: 'wallet',
    size: '标准款 (10x9cm)',
    color: '棕色',
    hardware: '黄铜',
    estimatedHours: 8,
    materialCost: 144,
    status: 'producing',
    leatherType: 'vegetable',
    leatherConsumption: 1.2,
    statusTimestamps: {
      pending: '2026-06-15 10:30:00',
      confirmed: '2026-06-15 14:20:00',
      producing: '2026-06-16 09:00:00',
      completed: null,
      delivered: null
    },
    createdAt: '2026-06-15 10:30:00'
  },
  {
    id: uuidv4(),
    customerName: '李女士',
    category: 'belt',
    size: '105cm',
    color: '黑色',
    hardware: '银色',
    estimatedHours: 4,
    materialCost: 64,
    status: 'confirmed',
    leatherType: 'chrome',
    leatherConsumption: 0.8,
    statusTimestamps: {
      pending: '2026-06-17 11:00:00',
      confirmed: '2026-06-17 15:30:00',
      producing: null,
      completed: null,
      delivered: null
    },
    createdAt: '2026-06-17 11:00:00'
  },
  {
    id: uuidv4(),
    customerName: '王先生',
    category: 'backpack',
    size: '大号 (30x40x12cm)',
    color: '深棕',
    hardware: '黄铜',
    estimatedHours: 24,
    materialCost: 280,
    status: 'pending',
    leatherType: 'shell',
    leatherConsumption: 3.5,
    statusTimestamps: {
      pending: '2026-06-18 09:15:00',
      confirmed: null,
      producing: null,
      completed: null,
      delivered: null
    },
    createdAt: '2026-06-18 09:15:00'
  }
]

export const useWorkshopStore = create<WorkshopState>((set, get) => ({
  orders: initialOrders,
  inventory: initialInventory,
  statusFilter: 'all',
  categoryFilter: 'all',
  leatherTypeFilter: 'all',

  addOrder: (orderData) => {
    const { inventory } = get()
    const leatherMaterial = inventory.find(m => m.type === orderData.leatherType)
    const unitPrice = leatherMaterial?.unitPrice || 100
    const estimatedHours = calculateEstimatedHours(orderData.category)
    const materialCost = calculateMaterialCost(orderData.category, unitPrice)
    const leatherConsumption = getLeatherConsumption(orderData.category)

    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    const newOrder: Order = {
      id: uuidv4(),
      ...orderData,
      estimatedHours,
      materialCost,
      leatherConsumption,
      status: 'pending',
      statusTimestamps: {
        pending: now,
        confirmed: null,
        producing: null,
        completed: null,
        delivered: null
      },
      createdAt: now
    }
    set((state) => ({ orders: [...state.orders, newOrder] }))
  },

  updateOrderStatus: (orderId, newStatus) => {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    set((state) => {
      const order = state.orders.find(o => o.id === orderId)
      if (!order) return state

      const wasConfirmed = order.status !== 'pending' && newStatus === 'producing'
      if (wasConfirmed || (order.status === 'confirmed' && newStatus === 'producing')) {
        const inventoryItem = state.inventory.find(m => m.type === order.leatherType)
        if (inventoryItem && inventoryItem.area >= order.leatherConsumption) {
          const updatedInventory = state.inventory.map(m =>
            m.type === order.leatherType
              ? { ...m, area: Math.max(0, m.area - order.leatherConsumption), lastUpdated: now }
              : m
          )
          return {
            orders: state.orders.map(o =>
              o.id === orderId
                ? {
                    ...o,
                    status: newStatus,
                    statusTimestamps: { ...o.statusTimestamps, [newStatus]: now }
                  }
                : o
            ),
            inventory: updatedInventory
          }
        }
      }

      return {
        orders: state.orders.map(o =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                statusTimestamps: { ...o.statusTimestamps, [newStatus]: now }
              }
            : o
        )
      }
    })
  },

  consumeMaterial: (leatherType, amount) => {
    const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    set((state) => ({
      inventory: state.inventory.map(m =>
        m.type === leatherType
          ? { ...m, area: Math.max(0, m.area - amount), lastUpdated: now }
          : m
      )
    }))
  },

  setStatusFilter: (status) => set({ statusFilter: status }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setLeatherTypeFilter: (type) => set({ leatherTypeFilter: type }),

  getFilteredOrders: () => {
    const { orders, statusFilter, categoryFilter } = get()
    return orders.filter(order => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter
      const categoryMatch = categoryFilter === 'all' || order.category === categoryFilter
      return statusMatch && categoryMatch
    })
  },

  getFilteredInventory: () => {
    const { inventory, leatherTypeFilter } = get()
    if (leatherTypeFilter === 'all') return inventory
    return inventory.filter(m => m.type === leatherTypeFilter)
  }
}))

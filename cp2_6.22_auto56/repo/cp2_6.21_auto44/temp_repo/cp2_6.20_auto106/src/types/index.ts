export interface Consumable {
  id: string
  code: string
  name: string
  currentStock: number
  safetyThreshold: number
  unit: string
  category: string
  lastCheckTime: string
  purchaseCycle: number
  dailyConsumption: number
}

export interface StockRecord {
  id: string
  consumableId: string
  consumableName: string
  type: 'in' | 'out'
  quantity: number
  timestamp: string
  operator: string
  remark: string
}

export interface Alert {
  id: string
  consumableId: string
  consumableName: string
  currentStock: number
  safetyThreshold: number
  timestamp: string
  read: boolean
}

export interface TrendData {
  date: string
  inCount: number
  outCount: number
}

export type StockStatus = 'normal' | 'low' | 'critical'

export interface InventoryStoreState {
  consumables: Consumable[]
  records: StockRecord[]
  alerts: Alert[]
  searchKeyword: string
  statusFilter: StockStatus | 'all'
  loading: boolean
  alertCount: number
  selectedConsumableId: string | null
  fetchInventory: () => Promise<void>
  fetchRecords: () => Promise<void>
  fetchTrends: (consumableId?: string) => Promise<TrendData[]>
  updateStock: (id: string, type: 'in' | 'out', quantity: number, remark?: string) => Promise<void>
  triggerCheck: (id: string) => Promise<void>
  setSearchKeyword: (keyword: string) => void
  setStatusFilter: (status: StockStatus | 'all') => void
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void
  markAlertAsRead: (alertId: string) => void
  setAlertCount: (count: number) => void
  setSelectedConsumableId: (id: string | null) => void
  getStockStatus: (current: number, threshold: number) => StockStatus
  getFilteredConsumables: () => Consumable[]
  getRecentConsumables: (limit?: number) => Consumable[]
  quickUpdateStock: (id: string, type: 'in' | 'out', quantity: number) => Promise<any>
}

export interface DashboardStats {
  totalStock: number
  lowAlertCount: number
  todayInCount: number
  todayOutCount: number
}

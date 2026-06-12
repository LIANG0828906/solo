import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ================= 类型定义 =================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'concept'
  | 'materials'
  | 'skeleton'
  | 'painting'
  | 'aging'
  | 'lighting'
  | 'composition'
  | 'qc'
  | 'completed'

export type SceneStyle = 'fantasy_forest' | 'british_corner' | 'japanese_garden' | 'steampunk' | 'underwater'
export type DetailLevel = 'normal' | 'high' | 'ultra'

export interface StatusHistoryItem {
  status: OrderStatus
  timestamp: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  sceneStyle: SceneStyle
  width: number
  height: number
  depth: number
  detailLevel: DetailLevel
  hasLighting: boolean
  referenceImages: string[]
  status: OrderStatus
  statusHistory: StatusHistoryItem[]
  inspirationIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  customerName: string
  customerEmail: string
  sceneStyle: SceneStyle
  width: number
  height: number
  depth: number
  detailLevel: DetailLevel
  hasLighting: boolean
  referenceImages: string[]
}

// 工具相关
export type ToolType = 'brush' | 'carving_knife' | 'tweezer' | 'airbrush' | 'magnifier' | 'other'
export type ToolStatus = 'idle' | 'borrowed' | 'maintenance'

export interface BorrowRecord {
  id: string
  borrower: string
  borrowedAt: string
  returnedAt: string | null
}

export interface Tool {
  id: string
  name: string
  type: ToolType
  status: ToolStatus
  lastMaintenanceDate: string | null
  borrowRecords: BorrowRecord[]
  createdAt: string
}

export interface CreateToolPayload {
  name: string
  type: ToolType
  status?: ToolStatus
  lastMaintenanceDate?: string | null
}

export interface BorrowToolPayload {
  borrower: string
}

// 灵感图
export interface Inspiration {
  id: string
  url: string
  label: SceneStyle
  createdAt: string
}

export interface CreateInspirationPayload {
  url: string
  label: SceneStyle
}

// 材料相关
export type MaterialCategory =
  | 'resin'
  | 'clay'
  | 'paint'
  | 'wood'
  | 'metal'
  | 'lighting_electronics'
  | 'vegetation'
  | 'other'

export interface Material {
  id: string
  name: string
  category: MaterialCategory
  stock: number
  safeStock: number
  unit: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialPayload {
  name: string
  category: MaterialCategory
  stock: number
  safeStock: number
  unit?: string
}

export interface UpdateMaterialPayload {
  name?: string
  category?: MaterialCategory
  stock?: number
  safeStock?: number
  unit?: string
}

// 统计数据
export interface DashboardStats {
  pendingOrders: number
  activeOrders: number
  borrowedTools: number
  lowStockMaterials: number
}

// ================= 常量映射 =================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  concept: '概念设计',
  materials: '材料准备',
  skeleton: '骨架制作',
  painting: '涂装上色',
  aging: '旧化做旧',
  lighting: '灯光安装',
  composition: '场景合成',
  qc: '最终质检',
  completed: '已完成',
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'concept',
  'materials',
  'skeleton',
  'painting',
  'aging',
  'lighting',
  'composition',
  'qc',
  'completed',
]

export const SCENE_STYLE_LABELS: Record<SceneStyle, string> = {
  fantasy_forest: '奇幻森林',
  british_corner: '英伦街角',
  japanese_garden: '日式庭院',
  steampunk: '蒸汽朋克',
  underwater: '海底世界',
}

export const DETAIL_LEVEL_LABELS: Record<DetailLevel, string> = {
  normal: '普通',
  high: '高精',
  ultra: '极致',
}

export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  brush: '画笔',
  carving_knife: '雕刻刀',
  tweezer: '镊子',
  airbrush: '喷笔',
  magnifier: '放大镜',
  other: '其他',
}

export const TOOL_STATUS_LABELS: Record<ToolStatus, string> = {
  idle: '空闲',
  borrowed: '已借用',
  maintenance: '维护中',
}

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  resin: '树脂',
  clay: '黏土',
  paint: '涂料',
  wood: '木材',
  metal: '金属配件',
  lighting_electronics: '灯光电子件',
  vegetation: '植被材料',
  other: '其他',
}

// ================= API 方法 =================

// 订单
export const ordersApi = {
  list: (params?: { status?: OrderStatus }) =>
    api.get<Order[]>('/orders', { params }).then((r) => r.data),
  get: (id: string) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  create: (payload: CreateOrderPayload) => api.post<Order>('/orders', payload).then((r) => r.data),
  updateStatus: (id: string, status: OrderStatus) =>
    api.post<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
  linkInspiration: (orderId: string, inspirationId: string) =>
    api.post<Order>(`/orders/${orderId}/inspirations`, { inspirationId }).then((r) => r.data),
  delete: (id: string) => api.delete(`/orders/${id}`).then((r) => r.data),
}

// 工具
export const toolsApi = {
  list: () => api.get<Tool[]>('/tools').then((r) => r.data),
  get: (id: string) => api.get<Tool>(`/tools/${id}`).then((r) => r.data),
  create: (payload: CreateToolPayload) => api.post<Tool>('/tools', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateToolPayload>) =>
    api.put<Tool>(`/tools/${id}`, payload).then((r) => r.data),
  borrow: (id: string, payload: BorrowToolPayload) =>
    api.post<Tool>(`/tools/${id}/borrow`, payload).then((r) => r.data),
  returnTool: (id: string) => api.post<Tool>(`/tools/${id}/return`).then((r) => r.data),
  delete: (id: string) => api.delete(`/tools/${id}`).then((r) => r.data),
}

// 灵感图
export const inspirationsApi = {
  list: () => api.get<Inspiration[]>('/inspirations').then((r) => r.data),
  create: (payload: CreateInspirationPayload) =>
    api.post<Inspiration>('/inspirations', payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/inspirations/${id}`).then((r) => r.data),
}

// 材料
export const materialsApi = {
  list: () => api.get<Material[]>('/materials').then((r) => r.data),
  lowStock: () => api.get<Material[]>('/materials/low-stock').then((r) => r.data),
  create: (payload: CreateMaterialPayload) =>
    api.post<Material>('/materials', payload).then((r) => r.data),
  update: (id: string, payload: UpdateMaterialPayload) =>
    api.put<Material>(`/materials/${id}`, payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/materials/${id}`).then((r) => r.data),
}

// 仪表盘统计
export const statsApi = {
  get: () => api.get<DashboardStats>('/stats').then((r) => r.data),
}

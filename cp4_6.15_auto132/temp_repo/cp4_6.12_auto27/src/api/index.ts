import axios from 'axios'
import type { Product, Order, Material, FiringRecord, Stats, ProcessStep } from '@/store'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API请求失败:', err.config?.url, err.message)
    return Promise.reject(err)
  }
)

export const productsApi = {
  async getList(): Promise<Product[]> {
    const { data } = await api.get('/products')
    return data
  },

  async getDetail(id: number): Promise<Product> {
    const { data } = await api.get(`/products/${id}`)
    return data
  },
}

export interface CreateOrderPayload {
  product_id: number
  product_name: string
  quantity: number
  clay_type: string
  glaze_color: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  reference_images?: string[]
  special_notes?: string
  total_price: number
}

export const ordersApi = {
  async getList(page = 1, pageSize = 20): Promise<{ total: number; page: number; pageSize: number; data: Order[] }> {
    const { data } = await api.get('/orders', { params: { page, pageSize } })
    return data
  },

  async getDetail(id: number): Promise<Order & { firings: FiringRecord[] }> {
    const { data } = await api.get(`/orders/${id}`)
    return data
  },

  async create(payload: CreateOrderPayload): Promise<{ id: number; success: boolean }> {
    const { data } = await api.post('/orders', payload)
    return data
  },

  async updateStatus(id: number, status: Order['status']): Promise<{ success: boolean }> {
    const { data } = await api.patch(`/orders/${id}/status`, { status })
    return data
  },

  async updateStep(
    orderId: number,
    stepId: number,
    payload: { status?: ProcessStep['status']; assignee?: string }
  ): Promise<{ success: boolean; steps: ProcessStep[] }> {
    const { data } = await api.patch(`/orders/${orderId}/steps/${stepId}`, payload)
    return data
  },
}

export const materialsApi = {
  async getList(): Promise<{ materials: Material[]; warnings: Material[]; warningCount: number }> {
    const { data } = await api.get('/materials')
    return data
  },

  async exportCSV(ids?: number[]): Promise<void> {
    const params = ids?.length ? { ids: ids.join(',') } : {}
    const res = await api.get('/materials/export-csv', { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `采购单_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  async restock(id: number, amount: number): Promise<{ success: boolean }> {
    const { data } = await api.post(`/materials/${id}/restock`, { amount })
    return data
  },
}

export const firingsApi = {
  async getList(): Promise<FiringRecord[]> {
    const { data } = await api.get('/firings')
    return data
  },

  async create(payload: {
    order_id?: number
    firing_type: string
    start_time?: string
    end_time?: string
    temp_curve?: Array<{ time: number; temp: number }>
    notes?: string
  }): Promise<{ id: number; success: boolean }> {
    const { data } = await api.post('/firings', payload)
    return data
  },
}

export const statsApi = {
  async get(): Promise<Stats> {
    const { data } = await api.get('/stats')
    return data
  },
}

export default api

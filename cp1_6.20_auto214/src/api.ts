import { Activity, Coupon, PurchaseRecord, User } from './types'

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }
  
  return response.json()
}

export const api = {
  getUsers: () => request<User[]>('/users'),
  
  getActivities: () => request<Activity[]>('/activities'),
  
  createActivity: (data: Omit<Activity, 'id'>) => 
    request<Activity>('/activities', { method: 'POST', body: JSON.stringify(data) }),
  
  updateActivity: (id: string, data: Partial<Activity>) =>
    request<Activity>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  deleteActivity: (id: string) =>
    request<{ success: boolean }>(`/activities/${id}`, { method: 'DELETE' }),
  
  getUserPurchases: (userId: string, days: number = 30) =>
    request<PurchaseRecord[]>(`/users/${userId}/purchases?days=${days}`),
  
  createPurchase: (userId: string, data: { amount: number; category: string }) =>
    request<{ purchase: PurchaseRecord; coupon: Coupon | null }>(
      `/users/${userId}/purchases`,
      { method: 'POST', body: JSON.stringify(data) }
    ),
  
  getUserCoupons: (userId: string) =>
    request<Coupon[]>(`/users/${userId}/coupons`),
  
  useCoupon: (couponId: string) =>
    request<{ success: boolean; coupon: Coupon }>(`/coupons/${couponId}/use`, { method: 'POST' })
}

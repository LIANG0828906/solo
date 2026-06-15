import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface User {
  id: string
  email: string
  nickname: string
  city: string
  creditScore: number
  createdAt: string
  avatar?: string
}

export interface Item {
  id: string
  title: string
  description: string
  category: string
  condition: string
  images: string[]
  ownerId: string
  owner?: Omit<User, 'email' | 'createdAt'>
  status: 'available' | 'exchanging' | 'exchanged'
  createdAt: string
  city: string
}

export interface Exchange {
  id: string
  itemId: string
  item?: { id: string; title: string; images: string[] }
  requesterId: string
  requester?: User
  ownerId: string
  owner?: User
  message: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: string
  updatedAt: string
  requesterRating?: number
  requesterComment?: string
  ownerRating?: number
  ownerComment?: string
}

export interface Notification {
  id: string
  userId: string
  type: 'new_request' | 'request_accepted' | 'request_rejected' | 'exchange_completed'
  title: string
  content: string
  relatedId: string
  read: boolean
  createdAt: string
}

export const authAPI = {
  register: (data: { email: string; password: string; nickname: string; city: string }) =>
    api.post<{ user: User; token: string }>('/users/register', data).then((res) => res.data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/users/login', data).then((res) => res.data),
  getMe: () =>
    api.get<User>('/users/me').then((res) => res.data),
  getCities: () =>
    api.get<string[]>('/users/cities').then((res) => res.data),
  getUser: (id: string) =>
    api.get<User>(`/users/${id}`).then((res) => res.data),
}

export const itemsAPI = {
  getItems: (params?: { keyword?: string; category?: string; page?: number; limit?: number }) =>
    api.get<{ items: Item[]; total: number }>('/items', { params }).then((res) => res.data),
  getItem: (id: string) =>
    api.get<Item>(`/items/${id}`).then((res) => res.data),
  createItem: (formData: FormData) =>
    api.post<Item>('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data),
  getItemsByOwner: (ownerId: string) =>
    api.get<Item[]>(`/items/owner/${ownerId}`).then((res) => res.data),
}

export const exchangesAPI = {
  createExchange: (data: { itemId: string; message: string }) =>
    api.post<Exchange>('/exchanges', data).then((res) => res.data),
  getMyExchanges: () =>
    api.get<Exchange[]>('/exchanges/mine').then((res) => res.data),
  getExchange: (id: string) =>
    api.get<Exchange>(`/exchanges/${id}`).then((res) => res.data),
  acceptExchange: (id: string) =>
    api.post<Exchange>(`/exchanges/${id}/accept`).then((res) => res.data),
  rejectExchange: (id: string) =>
    api.post<Exchange>(`/exchanges/${id}/reject`).then((res) => res.data),
  rateExchange: (id: string, data: { rating: number; comment: string }) =>
    api.post<Exchange>(`/exchanges/${id}/rate`, data).then((res) => res.data),
}

export const notificationsAPI = {
  getNotifications: () =>
    api.get<Notification[]>('/notifications').then((res) => res.data),
  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((res) => res.data),
  markAsRead: (id: string) =>
    api.post(`/notifications/${id}/read`).then((res) => res.data),
  markAllAsRead: () =>
    api.post('/notifications/read-all').then((res) => res.data),
}

export default api

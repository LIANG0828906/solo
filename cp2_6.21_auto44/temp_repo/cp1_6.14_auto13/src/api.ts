import axios from 'axios'

export interface User {
  id: string
  username: string
  nickname: string
  avatar?: string
  createdAt: string
}

export interface Item {
  id: string
  userId: string
  name: string
  category: string
  condition: string
  city: string
  photos: string[]
  story: string
  likes: number
  createdAt: string
  status: 'available' | 'exchanged'
  author?: { id: string; nickname: string; avatar?: string }
  isFavorited?: boolean
}

export interface Exchange {
  id: string
  fromUserId: string
  toUserId: string
  fromItemId: string
  toItemId: string
  status: 'pending' | 'exchanging' | 'completed' | 'rejected'
  createdAt: string
  updatedAt: string
  fromItem?: Item | null
  toItem?: Item | null
  fromUser?: { id: string; nickname: string } | null
  toUser?: { id: string; nickname: string } | null
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { username: string; password: string; nickname: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data)
}

export const itemApi = {
  create: (formData: FormData) =>
    api.post('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
  update: (id: string, formData: FormData) =>
    api.put(`/items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
  delete: (id: string) => api.delete(`/items/${id}`).then(r => r.data),
  list: () => api.get('/items').then(r => r.data),
  get: (id: string) => api.get(`/items/${id}`).then(r => r.data),
  getUserItems: (userId: string) => api.get(`/users/${userId}/items`).then(r => r.data),
  like: (id: string) => api.post(`/items/${id}/like`).then(r => r.data)
}

export const favoriteApi = {
  list: () => api.get('/favorites').then(r => r.data),
  add: (itemId: string) => api.post(`/favorites/${itemId}`).then(r => r.data),
  remove: (itemId: string) => api.delete(`/favorites/${itemId}`).then(r => r.data)
}

export const exchangeApi = {
  create: (data: { fromItemId: string; toItemId: string }) =>
    api.post('/exchanges', data).then(r => r.data),
  list: () => api.get('/exchanges').then(r => r.data),
  update: (id: string, status: 'exchanging' | 'completed' | 'rejected') =>
    api.put(`/exchanges/${id}`, { status }).then(r => r.data)
}

export default api

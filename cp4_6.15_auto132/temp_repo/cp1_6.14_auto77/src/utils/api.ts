import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 500,
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.message)
    return Promise.reject(error)
  }
)

export default api

export const weddingApi = {
  get: () => api.get('/wedding'),
  update: (data: any) => api.put('/wedding', data),
  create: (data: any) => api.post('/wedding', data),
}

export const todoApi = {
  list: () => api.get('/todos'),
  create: (data: any) => api.post('/todos', data),
  update: (id: string, data: any) => api.put(`/todos/${id}`, data),
  delete: (id: string) => api.delete(`/todos/${id}`),
}

export const timelineApi = {
  list: () => api.get('/timeline'),
  create: (data: any) => api.post('/timeline', data),
  update: (id: string, data: any) => api.put(`/timeline/${id}`, data),
  delete: (id: string) => api.delete(`/timeline/${id}`),
  reorder: (items: any[]) => api.put('/timeline/reorder', { items }),
}

export const guestApi = {
  list: () => api.get('/guests'),
  create: (data: any) => api.post('/guests', data),
  update: (id: string, data: any) => api.put(`/guests/${id}`, data),
  delete: (id: string) => api.delete(`/guests/${id}`),
}

export const activityApi = {
  list: () => api.get('/activities'),
  create: (data: any) => api.post('/activities', data),
}

export const invitationApi = {
  get: () => api.get('/invitation'),
  update: (data: any) => api.put('/invitation', data),
  generate: () => api.post('/invitation/generate'),
}

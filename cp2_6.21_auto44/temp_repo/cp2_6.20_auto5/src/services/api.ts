import axios from 'axios'
import type { ColorScheme } from '../types'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000
})

export const schemeApi = {
  getSchemes: (params?: { search?: string; tag?: string; sort?: 'date' | 'name' }) =>
    api.get<ColorScheme[]>('/schemes', { params }),

  getScheme: (id: string) => api.get<ColorScheme>(`/schemes/${id}`),

  createScheme: (scheme: ColorScheme) => api.post<ColorScheme>('/schemes', scheme),

  updateScheme: (id: string, scheme: ColorScheme) =>
    api.put<ColorScheme>(`/schemes/${id}`, scheme),

  deleteScheme: (id: string) => api.delete(`/schemes/${id}`),

  getTags: () => api.get<string[]>('/tags')
}

export default api

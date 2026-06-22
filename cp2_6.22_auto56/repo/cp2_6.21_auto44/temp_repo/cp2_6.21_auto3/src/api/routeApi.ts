import axios from 'axios'
import type { RouteData, RoutePoint } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

export const routeApi = {
  async getRoutes(): Promise<RouteData[]> {
    const { data } = await api.get('/routes')
    return data
  },

  async getRoute(id: string): Promise<RouteData> {
    const { data } = await api.get(`/routes/${id}`)
    return data
  },

  async getRouteByCode(code: string): Promise<RouteData> {
    const { data } = await api.get(`/routes/code/${code}`)
    return data
  },

  async createRoute(payload: {
    name: string
    description?: string
    points: Omit<RoutePoint, 'id'>[]
  }): Promise<RouteData> {
    const { data } = await api.post('/routes', payload)
    return data
  },

  async updateRoute(id: string, payload: Partial<RouteData>): Promise<RouteData> {
    const { data } = await api.put(`/routes/${id}`, payload)
    return data
  },

  async addPoint(routeId: string, point: Omit<RoutePoint, 'id'>): Promise<RoutePoint> {
    const { data } = await api.post(`/routes/${routeId}/points`, point)
    return data
  },

  async updatePoint(
    routeId: string,
    pointId: string,
    updates: Partial<RoutePoint>,
  ): Promise<RoutePoint> {
    const { data } = await api.put(`/routes/${routeId}/points/${pointId}`, updates)
    return data
  },

  async deletePoint(routeId: string, pointId: string): Promise<void> {
    await api.delete(`/routes/${routeId}/points/${pointId}`)
  },
}

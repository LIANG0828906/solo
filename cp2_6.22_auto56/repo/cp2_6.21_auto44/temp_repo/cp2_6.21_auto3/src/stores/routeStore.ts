import { create } from 'zustand'
import { routeApi } from '../api/routeApi'
import type { RouteData, RoutePoint } from '../types'

interface RouteStore {
  currentRoute: RouteData | null
  loading: boolean
  error: string | null
  fetchRoute: (id: string) => Promise<void>
  fetchRouteByCode: (code: string) => Promise<void>
  createRoute: (payload: {
    name: string
    description?: string
    points: Omit<RoutePoint, 'id'>[]
  }) => Promise<RouteData>
  updateRoute: (id: string, payload: Partial<RouteData>) => Promise<void>
  addPoint: (routeId: string, point: Omit<RoutePoint, 'id'>) => Promise<void>
  updatePoint: (
    routeId: string,
    pointId: string,
    updates: Partial<RoutePoint>,
  ) => Promise<void>
  deletePoint: (routeId: string, pointId: string) => Promise<void>
  setCurrentRoute: (route: RouteData | null) => void
}

const calculateDistance = (p1: RoutePoint, p2: RoutePoint): number => {
  const R = 6371
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  currentRoute: null,
  loading: false,
  error: null,

  setCurrentRoute: (route) => set({ currentRoute: route }),

  fetchRoute: async (id) => {
    set({ loading: true, error: null })
    try {
      const route = await routeApi.getRoute(id)
      set({ currentRoute: route, loading: false })
    } catch (e) {
      set({ error: '加载路线失败', loading: false })
    }
  },

  fetchRouteByCode: async (code) => {
    set({ loading: true, error: null })
    try {
      const route = await routeApi.getRouteByCode(code)
      set({ currentRoute: route, loading: false })
    } catch (e) {
      set({ error: '加载路线失败', loading: false })
    }
  },

  createRoute: async (payload) => {
    set({ loading: true, error: null })
    try {
      const route = await routeApi.createRoute(payload)
      set({ currentRoute: route, loading: false })
      return route
    } catch (e) {
      set({ error: '创建路线失败', loading: false })
      throw e
    }
  },

  updateRoute: async (id, payload) => {
    set({ loading: true, error: null })
    try {
      const route = await routeApi.updateRoute(id, payload)
      set({ currentRoute: route, loading: false })
    } catch (e) {
      set({ error: '更新路线失败', loading: false })
    }
  },

  addPoint: async (routeId, point) => {
    try {
      const newPoint = await routeApi.addPoint(routeId, point)
      const { currentRoute } = get()
      if (currentRoute) {
        const points = [...currentRoute.points, newPoint].sort(
          (a, b) => a.order - b.order,
        )
        const totalDistance = points.reduce((acc, p, i) => {
          if (i === 0) return 0
          return acc + calculateDistance(points[i - 1], p)
        }, 0)
        set({
          currentRoute: {
            ...currentRoute,
            points,
            totalDistance: parseFloat(totalDistance.toFixed(2)),
          },
        })
      }
    } catch (e) {
      set({ error: '添加点失败' })
    }
  },

  updatePoint: async (routeId, pointId, updates) => {
    try {
      const updated = await routeApi.updatePoint(routeId, pointId, updates)
      const { currentRoute } = get()
      if (currentRoute) {
        const points = currentRoute.points
          .map((p) => (p.id === pointId ? updated : p))
          .sort((a, b) => a.order - b.order)
        const totalDistance = points.reduce((acc, p, i) => {
          if (i === 0) return 0
          return acc + calculateDistance(points[i - 1], p)
        }, 0)
        set({
          currentRoute: {
            ...currentRoute,
            points,
            totalDistance: parseFloat(totalDistance.toFixed(2)),
          },
        })
      }
    } catch (e) {
      set({ error: '更新点失败' })
    }
  },

  deletePoint: async (routeId, pointId) => {
    try {
      await routeApi.deletePoint(routeId, pointId)
      const { currentRoute } = get()
      if (currentRoute) {
        const points = currentRoute.points
          .filter((p) => p.id !== pointId)
          .map((p, idx) => ({ ...p, order: idx }))
          .sort((a, b) => a.order - b.order)
        const totalDistance = points.reduce((acc, p, i) => {
          if (i === 0) return 0
          return acc + calculateDistance(points[i - 1], p)
        }, 0)
        set({
          currentRoute: {
            ...currentRoute,
            points,
            totalDistance: parseFloat(totalDistance.toFixed(2)),
          },
        })
      }
    } catch (e) {
      set({ error: '删除点失败' })
    }
  },
}))

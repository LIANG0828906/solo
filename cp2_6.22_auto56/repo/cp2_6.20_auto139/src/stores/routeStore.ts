import { create } from 'zustand';
import { routeApi } from '../api/routeApi';
import type { RouteData, Point } from '../types';

interface RouteState {
  currentRoute: RouteData | null;
  routes: RouteData[];
  selectedPoint: Point | null;
  loading: boolean;
  error: string | null;

  fetchRoutes: () => Promise<void>;
  fetchRoute: (routeId: string) => Promise<void>;
  fetchRouteByCode: (code: string) => Promise<void>;
  createRoute: (route: Omit<RouteData, 'id' | 'code' | 'createdAt'>) => Promise<RouteData>;
  updateRoute: (routeId: string, data: Partial<RouteData>) => Promise<void>;
  setCurrentRoute: (route: RouteData | null) => void;
  setSelectedPoint: (point: Point | null) => void;

  addPoint: (routeId: string, point: Omit<Point, 'id'>) => Promise<void>;
  updatePoint: (routeId: string, pointId: string, point: Partial<Point>) => Promise<void>;
  deletePoint: (routeId: string, pointId: string) => Promise<void>;

  calculateRouteStats: (points: Point[]) => { distance: number; duration: number };
}

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const useRouteStore = create<RouteState>((set, get) => ({
  currentRoute: null,
  routes: [],
  selectedPoint: null,
  loading: false,
  error: null,

  fetchRoutes: async () => {
    set({ loading: true, error: null });
    try {
      const routes = await routeApi.getRoutes();
      set({ routes, loading: false });
    } catch (error) {
      set({ error: '加载路线失败', loading: false });
    }
  },

  fetchRoute: async (routeId: string) => {
    set({ loading: true, error: null });
    try {
      const route = await routeApi.getRoute(routeId);
      set({ currentRoute: route, loading: false });
    } catch (error) {
      set({ error: '加载路线失败', loading: false });
    }
  },

  fetchRouteByCode: async (code: string) => {
    set({ loading: true, error: null });
    try {
      const route = await routeApi.getRouteByCode(code);
      set({ currentRoute: route, loading: false });
    } catch (error) {
      set({ error: '未找到该路线', loading: false });
    }
  },

  createRoute: async (route) => {
    set({ loading: true, error: null });
    try {
      const newRoute = await routeApi.createRoute(route);
      set((state) => ({
        routes: [...state.routes, newRoute],
        currentRoute: newRoute,
        loading: false
      }));
      return newRoute;
    } catch (error) {
      set({ error: '创建路线失败', loading: false });
      throw error;
    }
  },

  updateRoute: async (routeId, data) => {
    set({ loading: true, error: null });
    try {
      const updatedRoute = await routeApi.updateRoute(routeId, data);
      set((state) => ({
        routes: state.routes.map((r) => (r.id === routeId ? updatedRoute : r)),
        currentRoute: state.currentRoute?.id === routeId ? updatedRoute : state.currentRoute,
        loading: false
      }));
    } catch (error) {
      set({ error: '更新路线失败', loading: false });
    }
  },

  setCurrentRoute: (route) => set({ currentRoute: route }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),

  addPoint: async (routeId, point) => {
    set({ loading: true, error: null });
    try {
      const newPoint = await routeApi.addPoint(routeId, point);
      set((state) => {
        if (!state.currentRoute || state.currentRoute.id !== routeId) return state;
        const points = [...state.currentRoute.points, newPoint];
        const { distance, duration } = get().calculateRouteStats(points);
        return {
          currentRoute: {
            ...state.currentRoute,
            points,
            totalDistance: distance,
            estimatedDuration: duration
          },
          loading: false
        };
      });
    } catch (error) {
      set({ error: '添加点失败', loading: false });
    }
  },

  updatePoint: async (routeId, pointId, point) => {
    set({ loading: true, error: null });
    try {
      const updatedPoint = await routeApi.updatePoint(routeId, pointId, point);
      set((state) => {
        if (!state.currentRoute || state.currentRoute.id !== routeId) return state;
        const points = state.currentRoute.points.map((p) =>
          p.id === pointId ? { ...p, ...updatedPoint } : p
        );
        const { distance, duration } = get().calculateRouteStats(points);
        return {
          currentRoute: {
            ...state.currentRoute,
            points,
            totalDistance: distance,
            estimatedDuration: duration
          },
          selectedPoint: state.selectedPoint?.id === pointId ? { ...state.selectedPoint, ...updatedPoint } : state.selectedPoint,
          loading: false
        };
      });
    } catch (error) {
      set({ error: '更新点失败', loading: false });
    }
  },

  deletePoint: async (routeId, pointId) => {
    set({ loading: true, error: null });
    try {
      await routeApi.deletePoint(routeId, pointId);
      set((state) => {
        if (!state.currentRoute || state.currentRoute.id !== routeId) return state;
        const points = state.currentRoute.points.filter((p) => p.id !== pointId);
        const { distance, duration } = get().calculateRouteStats(points);
        return {
          currentRoute: {
            ...state.currentRoute,
            points,
            totalDistance: distance,
            estimatedDuration: duration
          },
          selectedPoint: state.selectedPoint?.id === pointId ? null : state.selectedPoint,
          loading: false
        };
      });
    } catch (error) {
      set({ error: '删除点失败', loading: false });
    }
  },

  calculateRouteStats: (points) => {
    if (points.length < 2) return { distance: 0, duration: 0 };

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += calculateDistance(
        points[i].lat, points[i].lng,
        points[i + 1].lat, points[i + 1].lng
      );
    }

    const sortedPoints = [...points].sort(
      (a, b) => parseTimeToMinutes(a.estimatedArrival) - parseTimeToMinutes(b.estimatedArrival)
    );
    const firstTime = parseTimeToMinutes(sortedPoints[0].estimatedArrival);
    const lastTime = parseTimeToMinutes(sortedPoints[sortedPoints.length - 1].estimatedArrival);
    const duration = Math.max(0, lastTime - firstTime);

    return { distance: parseFloat(totalDistance.toFixed(2)), duration };
  }
}));

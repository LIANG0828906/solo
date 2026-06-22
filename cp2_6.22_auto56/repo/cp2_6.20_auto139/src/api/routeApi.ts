import axios from 'axios';
import type { RouteData, Point } from '../types';

const API_BASE = '/api/routes';

export const routeApi = {
  async getRoutes(): Promise<RouteData[]> {
    const response = await axios.get(API_BASE);
    return response.data;
  },

  async getRoute(routeId: string): Promise<RouteData> {
    const response = await axios.get(`${API_BASE}/${routeId}`);
    return response.data;
  },

  async getRouteByCode(code: string): Promise<RouteData> {
    const response = await axios.get(`${API_BASE}/code/${code}`);
    return response.data;
  },

  async createRoute(route: Omit<RouteData, 'id' | 'code' | 'createdAt'>): Promise<RouteData> {
    const response = await axios.post(API_BASE, route);
    return response.data;
  },

  async updateRoute(routeId: string, data: Partial<RouteData>): Promise<RouteData> {
    const response = await axios.put(`${API_BASE}/${routeId}`, data);
    return response.data;
  },

  async addPoint(routeId: string, point: Omit<Point, 'id'>): Promise<Point> {
    const response = await axios.post(`${API_BASE}/${routeId}/points`, point);
    return response.data;
  },

  async updatePoint(routeId: string, pointId: string, point: Partial<Point>): Promise<Point> {
    const response = await axios.put(`${API_BASE}/${routeId}/points/${pointId}`, point);
    return response.data;
  },

  async deletePoint(routeId: string, pointId: string): Promise<void> {
    await axios.delete(`${API_BASE}/${routeId}/points/${pointId}`);
  }
};

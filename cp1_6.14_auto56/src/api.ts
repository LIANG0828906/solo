import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Flower {
  id: string;
  name: 'rose' | 'lily' | 'sunflower' | 'baby_breath';
  nameCn: string;
  emoji: string;
  color: string;
  price: number;
  shelfLife: number;
  remainingDays: number;
  purchaseCost: number;
}

export interface Bouquet {
  id: string;
  flowers: Flower[];
  name: string;
  price: number;
  color: string;
  remainingDays: number;
  shelfPosition?: { row: number; col: number };
}

export interface Customer {
  id: string;
  name: string;
  avatar: string;
  requirements: {
    colors?: string[];
    flowerTypes?: string[];
    maxPrice?: number;
    minPrice?: number;
  };
  satisfaction: number;
}

export interface Order {
  id: string;
  customerId: string;
  bouquetId?: string;
  status: 'pending' | 'success' | 'failed';
  price: number;
  timestamp: string;
  satisfactionDelta: number;
}

export interface DailyReportType {
  date: string;
  revenue: { hour: string; amount: number }[];
  costs: { category: string; value: number }[];
  satisfactionTrend: { time: string; value: number }[];
  totalRevenue: number;
  totalCost: number;
  profit: number;
  reputation: number;
  suggestions: string[];
  spoiledFlowers: number;
  completedOrders: number;
  failedOrders: number;
}

export interface ShopStatus {
  reputation: number;
  revenue: number;
  dayNumber: number;
}

export const flowerApi = {
  getAll: () => api.get<Flower[]>('/flowers').then(r => r.data),
  create: (name: string, quantity: number) => 
    api.post<Flower[]>('/flowers', { name, quantity }).then(r => r.data),
  update: (id: string, remainingDays: number) =>
    api.put<Flower>(`/flowers/${id}`, { remainingDays }).then(r => r.data),
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/flowers/${id}`).then(r => r.data),
};

export const bouquetApi = {
  getAll: () => api.get<Bouquet[]>('/bouquets').then(r => r.data),
  create: (flowerIds: string[]) =>
    api.post<Bouquet>('/bouquets', { flowerIds }).then(r => r.data),
};

export const customerApi = {
  getAll: () => api.get<Customer[]>('/customers').then(r => r.data),
  create: () => api.post<Customer>('/customers').then(r => r.data),
  delete: (id: string) =>
    api.delete<{ reputationDelta: number }>(`/customers/${id}`).then(r => r.data),
};

export const orderApi = {
  getAll: () => api.get<Order[]>('/orders').then(r => r.data),
  match: (customerId: string, bouquetId: string) =>
    api.post<{ match: boolean; order: Order }>('/orders/match', { customerId, bouquetId }).then(r => r.data),
};

export const reportApi = {
  getDaily: () => api.get<DailyReportType>('/report/daily').then(r => r.data),
};

export const statusApi = {
  get: () => api.get<ShopStatus>('/status').then(r => r.data),
  updateReputation: (delta: number) =>
    api.post<{ reputation: number }>('/reputation', { delta }).then(r => r.data),
};

export default api;

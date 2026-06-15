import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export interface Wood {
  id: number;
  name: string;
  origin: string;
  color: string;
  category: 'top' | 'back' | 'side' | 'fingerboard' | 'neck';
  stock: number;
  threshold: number;
  description: string;
  stockStatus?: 'sufficient' | 'low' | 'out';
  selectable?: boolean;
}

export interface Instrument {
  id: number;
  name: string;
  type: 'classical_guitar' | 'acoustic_guitar' | 'violin' | 'ukulele';
  description: string;
  basePrice: number;
  image: string;
}

export interface Order {
  id: number;
  instrumentType: string;
  instrumentName: string;
  topWoodId: number;
  backWoodId: number;
  sideWoodId: number;
  fingerboardWoodId: number;
  neckWoodId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface TuningRecord {
  id: number;
  orderId: number;
  tuningDate: string;
  pitch: number;
  notes: string;
  createdAt: string;
}

export interface ProgressHistoryEntry {
  id: number;
  orderId: number;
  status: number;
  timestamp: string;
}

export interface CreateOrderInput {
  instrumentType: string;
  instrumentName: string;
  topWoodId: number;
  backWoodId: number;
  sideWoodId: number;
  fingerboardWoodId: number;
  neckWoodId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

export interface AvailabilityResult {
  id: number;
  available: boolean;
  stock: number;
}

export const instrumentsApi = {
  getInstruments: () => api.get<Instrument[]>('/instruments').then(r => r.data),
  getInstrumentByType: (type: string) =>
    api.get<Instrument>(`/instruments/${type}`).then(r => r.data),
};

export const woodsApi = {
  getWoods: (category?: string) =>
    api.get<Wood[]>('/woods', { params: category ? { category } : undefined }).then(r => r.data),
  getWoodById: (id: number) => api.get<Wood>(`/woods/${id}`).then(r => r.data),
  getLowStockWoods: () => api.get<Wood[]>('/woods/low-stock').then(r => r.data),
  updateWoodStock: (id: number, stock: number) =>
    api.put<Wood>(`/woods/${id}/stock`, { stock }).then(r => r.data),
  checkAvailability: (woodIds: number[]) =>
    api.post<AvailabilityResult[]>('/woods/check-availability', { woodIds }).then(r => r.data),
};

export const ordersApi = {
  createOrder: (input: CreateOrderInput) =>
    api.post<{ id: number }>('/orders', input).then(r => r.data),
  getOrders: () => api.get<Order[]>('/orders').then(r => r.data),
  getOrderById: (id: number) => api.get<Order>(`/orders/${id}`).then(r => r.data),
  getProgressHistory: (id: number) =>
    api.get<ProgressHistoryEntry[]>(`/orders/${id}/progress`).then(r => r.data),
  updateOrderStatus: (id: number, status: number) =>
    api.put<Order>(`/orders/${id}/status`, { status }).then(r => r.data),
  addTuningRecord: (id: number, tuningDate: string, pitch: number, notes: string) =>
    api.post<{ id: number }>(`/orders/${id}/tuning`, { tuningDate, pitch, notes }).then(r => r.data),
  getTuningRecords: (id: number) =>
    api.get<TuningRecord[]>(`/orders/${id}/tuning`).then(r => r.data),
};

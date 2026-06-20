import type {
  PickingRecord,
  ProcessingRecord,
  TastingRecord,
  Order,
  GlobalStats,
  Inventory,
  TeaVariety,
  AromaType,
  OrderStatus,
} from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  picking: {
    getAll: () => request<PickingRecord[]>('/picking'),
    getRecent: () => request<PickingRecord[]>('/picking/recent'),
    create: (data: Omit<PickingRecord, 'id' | 'createdAt'>) =>
      request<PickingRecord>('/picking', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<PickingRecord>) =>
      request<PickingRecord>(`/picking/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/picking/${id}`, {
        method: 'DELETE',
      }),
  },

  processing: {
    getAll: () => request<ProcessingRecord[]>('/processing'),
    getQueue: () => request<ProcessingRecord[]>('/processing/queue'),
    create: (data: Omit<ProcessingRecord, 'id' | 'stirCount' | 'status' | 'startTime'>) =>
      request<ProcessingRecord>('/processing', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ProcessingRecord>) =>
      request<ProcessingRecord>(`/processing/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    stir: (id: string) =>
      request<ProcessingRecord>(`/processing/${id}/stir`, {
        method: 'PUT',
      }),
    complete: (id: string, color: string, aroma: AromaType) =>
      request<ProcessingRecord>(`/processing/${id}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ color, aroma }),
      }),
  },

  tasting: {
    getAll: () => request<TastingRecord[]>('/tasting'),
    create: (data: Omit<TastingRecord, 'id' | 'totalScore' | 'grade' | 'createdAt'>) =>
      request<TastingRecord>('/tasting', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<TastingRecord>) =>
      request<TastingRecord>(`/tasting/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  orders: {
    getAll: () => request<Order[]>('/orders'),
    create: (data: Omit<Order, 'id' | 'status' | 'createdAt' | 'deadline'>) =>
      request<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: OrderStatus) =>
      request<Order>(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  stats: {
    getGlobal: () => request<GlobalStats>('/stats'),
  },

  inventory: {
    getAll: () => request<Inventory[]>('/inventory'),
    getByVariety: (variety: TeaVariety) =>
      request<{ variety: TeaVariety; quantity: number }>(`/inventory/${variety}`),
  },
};

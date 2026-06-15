import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export interface OrderData {
  jewelry_type: string;
  material: string;
  engraving?: string;
  size: string;
  deadline: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  sketch?: File;
}

export interface Order {
  id: number;
  order_number: string;
  jewelry_type: string;
  material: string;
  engraving: string;
  size: string;
  deadline: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  sketch_image: string | null;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  history?: StatusHistory[];
  designs?: Design[];
}

export interface StatusHistory {
  id: number;
  order_id: number;
  status: string;
  note: string;
  created_at: string;
}

export interface Design {
  id: number;
  order_id: number;
  image_url: string;
  is_final: number;
  description: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  threshold: number;
}

export interface InventoryData {
  items: InventoryItem[];
  lowStock: InventoryItem[];
}

export interface StatusInfo {
  key: string;
  label: string;
  color: string;
}

export interface DashboardStats {
  todayNew: number;
  pending: number;
  upcomingDeadlines: number;
  ordersByStatus: Array<{ status: string; count: number }>;
}

export const orderApi = {
  create: (data: OrderData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as any);
      }
    });
    return api.post<any, { id: number; order_number: string }>('/orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  list: (params?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    orderNumber?: string;
    customer_phone?: string;
  }) => api.get<any, Order[]>('/orders', { params }),

  get: (id: number) => api.get<any, Order>(`/orders/${id}`),

  updateStatus: (id: number, status: string, note?: string) =>
    api.put<any, { success: boolean }>(`/orders/${id}/status`, { status, note }),

  uploadDesign: (orderId: number, file: File, description?: string, isFinal?: boolean) => {
    const formData = new FormData();
    formData.append('design', file);
    if (description) formData.append('description', description);
    if (isFinal) formData.append('is_final', '1');
    return api.post<any, { id: number; image_url: string }>(`/orders/${orderId}/designs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  setFinalDesign: (designId: number) =>
    api.put<any, { success: boolean }>(`/designs/${designId}/final`, {}),

  deleteDesign: (designId: number) =>
    api.delete<any, { success: boolean }>(`/designs/${designId}`)
};

export const inventoryApi = {
  list: () => api.get<any, InventoryData>('/inventory'),
  create: (data: Partial<InventoryItem>) => api.post<any, { id: number }>('/inventory', data),
  update: (id: number, data: Partial<InventoryItem>) =>
    api.put<any, { success: boolean }>(`/inventory/${id}`, data),
  remove: (id: number) => api.delete<any, { success: boolean }>(`/inventory/${id}`)
};

export const dashboardApi = {
  stats: () => api.get<any, DashboardStats>('/dashboard/stats')
};

export const commonApi = {
  getStatuses: () => api.get<any, StatusInfo[]>('/statuses')
};

export default api;

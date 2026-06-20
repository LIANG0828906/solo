import axios from 'axios';

export interface MenuItem {
  id: string;
  name: string;
  category: '主菜' | '小食' | '甜品' | '饮品';
  price: number;
  description: string;
  isRecommended: boolean;
  icon: string;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: '待确认' | '制作中' | '配送中' | '已完成' | '已取消';
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  startDate: string;
  endDate: string;
  applicableItems: string[];
  isActive: boolean;
}

export interface Stats {
  todayOrders: number;
  totalSales: number;
  popularItemClicks: number;
  pendingOrders: number;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const menuApi = {
  getAll: () => api.get<MenuItem[]>('/menu'),
  create: (data: Omit<MenuItem, 'id'>) => api.post<MenuItem>('/menu', data),
  update: (id: string, data: Partial<MenuItem>) => api.put<MenuItem>(`/menu/${id}`, data),
  delete: (id: string) => api.delete(`/menu/delete/${id}`),
};

export const orderApi = {
  getAll: () => api.get<Order[]>('/orders'),
  updateStatus: (id: string, status: Order['status']) =>
    api.put<Order>(`/orders/${id}/status`, { status }),
};

export const promotionApi = {
  getAll: () => api.get<Promotion[]>('/promotions'),
  create: (data: Omit<Promotion, 'id' | 'isActive'> & { isActive?: boolean }) => api.post<Promotion>('/promotions', data),
  toggle: (id: string) => api.put<Promotion>(`/promotions/${id}/toggle`),
};

export const statsApi = {
  get: () => api.get<Stats>('/stats'),
};

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  name: string;
  category: '陶瓷' | '木雕' | '布艺' | '其他';
  dimensions: ProductDimensions;
  stock: number;
  price: number;
  image: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed';

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardData {
  todayOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  monthlySales: number;
  salesTrend: { date: string; amount: number }[];
}

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  getProducts: (): Promise<Product[]> => request<Product[]>('/products'),
  createProduct: (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>): Promise<Product> =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string): Promise<void> =>
    request<void>(`/products/${id}`, { method: 'DELETE' }),

  getOrders: (): Promise<Order[]> => request<Order[]>('/orders'),
  createOrder: (data: { customerName: string; items: OrderItem[] }): Promise<Order> =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: OrderStatus): Promise<Order> =>
    request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getDashboard: (): Promise<DashboardData> => request<DashboardData>('/dashboard'),
};

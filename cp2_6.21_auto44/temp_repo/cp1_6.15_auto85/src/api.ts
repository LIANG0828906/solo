import type { Product, Order, OrderItem } from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `请求失败(${res.status})`);
  }
  return body as T;
}

export const api = {
  getProducts: () => request<Product[]>('/products'),
  createProduct: (data: Omit<Product, 'id' | 'createdAt'>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  getOrders: () => request<Order[]>('/orders'),
  createOrder: (items: OrderItem[]) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify({ items }) }),
  getCategories: () => request<string[]>('/categories')
};

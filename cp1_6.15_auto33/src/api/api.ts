import type { Flower, ApiResponse, Order, DeliveryInfo, BouquetItem } from '@/types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    const data: ApiResponse<T> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `请求失败 (${response.status})`);
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查服务器是否运行');
    }
    throw error;
  }
}

export async function fetchFlowers(filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Flower[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters?.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  const query = params.toString();
  return request<Flower[]>(`/flowers${query ? `?${query}` : ''}`);
}

export async function validateBouquet(items: BouquetItem[]): Promise<{ valid: boolean; message?: string }> {
  return request('/bouquet/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function createOrder(
  bouquetItems: BouquetItem[],
  totalPrice: number,
  deliveryInfo: DeliveryInfo
): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      bouquet: { items: bouquetItems, totalPrice },
      deliveryInfo,
    }),
  });
}

export async function fetchOrder(orderId: string): Promise<Order> {
  return request<Order>(`/orders/${orderId}`);
}

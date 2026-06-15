import type { MenuItem, Order, CreateOrderRequest } from '@/types';

const API_BASE = '/api';

export async function fetchMenu(): Promise<MenuItem[]> {
  const response = await fetch(`${API_BASE}/menu`);
  if (!response.ok) {
    throw new Error('获取菜单失败');
  }
  return response.json();
}

export async function createOrder(
  orderData: CreateOrderRequest
): Promise<Order> {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || '创建订单失败');
  }

  return response.json();
}

export async function getOrder(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE}/orders/${orderId}`);
  if (!response.ok) {
    throw new Error('订单不存在');
  }
  return response.json();
}

import { Order, CreateOrderRequest, OrderStatus, LogEntry } from '../types';

const API_BASE = '/api';

export const getOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_BASE}/orders`);
  if (!response.ok) throw new Error('获取订单列表失败');
  return response.json();
};

export const getOrder = async (id: string): Promise<Order> => {
  const response = await fetch(`${API_BASE}/orders/${id}`);
  if (!response.ok) throw new Error('获取订单详情失败');
  return response.json();
};

export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('创建订单失败');
  return response.json();
};

export const updateOrderStatus = async (id: string, status: OrderStatus): Promise<Order> => {
  const response = await fetch(`${API_BASE}/orders/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('更新订单状态失败');
  return response.json();
};

export const addLog = async (
  orderId: string,
  data: { author: string; avatar: string; content: string }
): Promise<LogEntry> => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('添加日志失败');
  return response.json();
};

export const uploadDesignImage = async (orderId: string, image: string): Promise<Order> => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/design-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image })
  });
  if (!response.ok) throw new Error('上传设计图失败');
  return response.json();
};

export const uploadFinalImage = async (orderId: string, image: string): Promise<Order> => {
  const response = await fetch(`${API_BASE}/orders/${orderId}/final-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image })
  });
  if (!response.ok) throw new Error('上传成品图失败');
  return response.json();
};

export const deleteOrder = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/orders/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('删除订单失败');
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

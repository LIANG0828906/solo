import axios from 'axios';
import type { Order, CartItem, DeliveryOrder } from '../types';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOrders = async (status?: string): Promise<Order[]> => {
  const params = status ? { status } : {};
  const response = await api.get<Order[]>('/orders', { params });
  return response.data;
};

export const createOrder = async (data: {
  user: string;
  items: CartItem[];
  total: number;
  address: string;
}): Promise<Order> => {
  const response = await api.post<Order>('/orders', data);
  return response.data;
};

export const mergeOrders = async (orderIds: number[]): Promise<DeliveryOrder> => {
  const response = await api.post<DeliveryOrder>('/delivery/merge', { orderIds });
  return response.data;
};

export const optimizeRoute = async (deliveryId: number): Promise<DeliveryOrder> => {
  const response = await api.post<DeliveryOrder>(`/delivery/${deliveryId}/optimize`);
  return response.data;
};

export const getDeliveryOrders = async (): Promise<DeliveryOrder[]> => {
  const response = await api.get<DeliveryOrder[]>('/delivery');
  return response.data;
};

export default api;

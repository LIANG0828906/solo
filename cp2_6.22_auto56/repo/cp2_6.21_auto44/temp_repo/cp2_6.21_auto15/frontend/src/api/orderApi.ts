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
  const transformedItems = data.items.map((item) => ({
    product_id: item.product.id,
    product_name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));
  const response = await api.post<Order>('/orders', {
    user: data.user,
    items: transformedItems,
    total: data.total,
    address: data.address,
  });
  return response.data;
};

export const mergeOrders = async (orderIds: number[]): Promise<DeliveryOrder> => {
  const response = await api.put<DeliveryOrder>('/orders/merge', { order_ids: orderIds });
  return response.data;
};

export const optimizeRoute = async (deliveryId: number): Promise<DeliveryOrder> => {
  const response = await api.post<DeliveryOrder>('/delivery/optimize', { delivery_id: deliveryId });
  return response.data;
};

export const getDeliveryOrders = async (): Promise<DeliveryOrder[]> => {
  const response = await api.get<DeliveryOrder[]>('/delivery/list');
  return response.data;
};

export default api;

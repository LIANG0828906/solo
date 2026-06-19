import axios from 'axios';
import { Photo, FilterType, Order, OrderStatus, PrintSize } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

export interface ApiResponse {
  success: boolean;
  photos?: Photo[];
  photo?: Photo;
  orders?: Order[];
  order?: Order;
  error?: string;
}

export const photoApi = {
  async getAll(): Promise<Photo[]> {
    const res = await api.get<ApiResponse>('/photos');
    return res.data.photos || [];
  },

  async upload(files: File[]): Promise<Photo[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    const res = await api.post<ApiResponse>('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.photos || [];
  },

  async applyFilter(
    photoId: string,
    filter: FilterType,
    brightness: number,
    contrast: number
  ): Promise<Photo | null> {
    const res = await api.post<ApiResponse>('/photos/apply-filter', {
      photoId,
      filter,
      brightness,
      contrast
    });
    return res.data.photo || null;
  }
};

export interface CreateOrderPayload {
  items: Array<{
    photoId: string;
    photoUrl: string;
    size: PrintSize;
    quantity: number;
  }>;
  customerName: string;
  customerPhone: string;
}

export const orderApi = {
  async getAll(): Promise<Order[]> {
    const res = await api.get<ApiResponse>('/orders');
    return res.data.orders || [];
  },

  async create(payload: CreateOrderPayload): Promise<Order | null> {
    const res = await api.post<ApiResponse>('/orders', payload);
    return res.data.order || null;
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const res = await api.put<ApiResponse>(`/orders/${orderId}/status`, { status });
    return res.data.order || null;
  }
};

export default api;

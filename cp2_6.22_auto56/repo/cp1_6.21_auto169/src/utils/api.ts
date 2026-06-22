
import axios from 'axios';
import type { Card } from '../types/card';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const cardApi = {
  async getAll(): Promise<Card[]> {
    const response = await api.get<ApiResponse<Card[]>>('/cards');
    return response.data.data || [];
  },

  async create(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<Card> {
    const response = await api.post<ApiResponse<Card>>('/cards', card);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '创建卡片失败');
    }
    return response.data.data;
  },

  async update(id: string, data: Partial<Card>): Promise<Card> {
    const response = await api.put<ApiResponse<Card>>(`/cards/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '更新卡片失败');
    }
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/cards/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || '删除卡片失败');
    }
  },
};

export default api;

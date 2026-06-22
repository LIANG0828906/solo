import axios from 'axios';
import type { ProductionBatch } from '../MillCore';

export interface StatisticsResponse {
  totalWeight: number;
  countByType: Record<'fine' | 'medium' | 'bran', number>;
  countByGrade: Record<'S' | 'A' | 'B' | 'C', number>;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  async getBatches(): Promise<ProductionBatch[]> {
    const response = await api.get<ProductionBatch[]>('/batches');
    return response.data;
  },

  async createBatch(
    batch: Omit<ProductionBatch, 'id' | 'timestamp'>
  ): Promise<ProductionBatch> {
    const response = await api.post<ProductionBatch>('/batches', batch);
    return response.data;
  },

  async deleteBatch(id: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(`/batches/${id}`);
    return response.data;
  },

  async getStatistics(): Promise<StatisticsResponse> {
    const response = await api.get<StatisticsResponse>('/statistics');
    return response.data;
  },
};

export default api;

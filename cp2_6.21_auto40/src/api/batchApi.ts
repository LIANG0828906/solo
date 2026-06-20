import apiClient from './client';
import type { Batch, BatchCreate } from '@/types';

export async function createBatch(data: BatchCreate): Promise<Batch> {
  const res = await apiClient.post<Batch>('/api/batches', data);
  return res.data;
}

export async function getBatchById(id: number): Promise<Batch> {
  const res = await apiClient.get<Batch>(`/api/batches/${id}`);
  return res.data;
}

export async function listBatches(skip = 0, limit = 20): Promise<Batch[]> {
  const res = await apiClient.get<Batch[]>('/api/batches', {
    params: { skip, limit },
  });
  return res.data;
}

export async function cloneBatch(id: number): Promise<Batch> {
  const res = await apiClient.post<Batch>(`/api/batches/${id}/clone`);
  return res.data;
}

import axios from 'axios';
import type { Goal, StudyRecord } from './types';

const api = axios.create({ baseURL: '/api' });

export const goalsApi = {
  getAll: () => api.get<Goal[]>('/goals').then((r) => r.data),
  create: (data: Partial<Goal>) => api.post<Goal>('/goals', data).then((r) => r.data),
  update: (id: string, data: Partial<Goal>) =>
    api.put<Goal>(`/goals/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/goals/${id}`).then((r) => r.data),
  reorder: (id: string, newOrder: number) =>
    api.post('/goals/reorder', { id, newOrder }).then((r) => r.data),
};

export const recordsApi = {
  getAll: (goalId?: string) =>
    api
      .get<StudyRecord[]>('/records', goalId ? { params: { goalId } } : undefined)
      .then((r) => r.data),
  create: (data: Partial<StudyRecord>) =>
    api.post<StudyRecord>('/records', data).then((r) => r.data),
  update: (id: string, data: Partial<StudyRecord>) =>
    api.put<StudyRecord>(`/records/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/records/${id}`).then((r) => r.data),
};

import axios from 'axios';
import { Material, Draft } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const materialApi = {
  getAll: () => api.get<Material[]>('/materials'),
  getById: (id: string) => api.get<Material>(`/materials/${id}`),
  create: (data: Omit<Material, 'id' | 'createdAt'>) => api.post<Material>('/materials', data),
  createWithImage: (formData: FormData) =>
    api.post<Material>('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id: string, data: Partial<Material>) => api.put<Material>(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

export const draftApi = {
  get: () => api.get<Draft>('/drafts/current'),
  save: (content: string) => api.put<Draft>('/drafts/current', { content }),
};

export default api;

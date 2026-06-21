import axios from 'axios';
import type { User, TrainingPlan, TrainingRecord } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (username: string, password: string) =>
    api.post<{ token: string; user: User }>('/register', { username, password }).then((r) => r.data),
  login: (username: string, password: string) =>
    api.post<{ token: string; user: User }>('/login', { username, password }).then((r) => r.data),
};

export const plansApi = {
  list: () => api.get<TrainingPlan[]>('/plans').then((r) => r.data),
  create: (data: { name: string; exercises: any[] }) =>
    api.post<TrainingPlan>('/plans', data).then((r) => r.data),
  update: (id: string, data: Partial<TrainingPlan>) =>
    api.put<TrainingPlan>(`/plans/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/plans/${id}`).then((r) => r.data),
};

export const recordsApi = {
  list: (params?: { planId?: string; date?: string }) =>
    api.get<TrainingRecord[]>('/records', { params }).then((r) => r.data),
  create: (data: { planId: string; date: string; exerciseRecords: any[] }) =>
    api.post<TrainingRecord>('/records', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/records/${id}`).then((r) => r.data),
};

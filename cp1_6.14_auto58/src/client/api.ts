import axios, { AxiosInstance } from 'axios';
import type { User, Objective, KeyResult, LoginResponse, CreateObjectiveData } from './types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('okr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('okr_token');
      localStorage.removeItem('okr_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { username, password });
    return data;
  },
  getMe: async (): Promise<{ user: User }> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

export const userApi = {
  getAll: async (): Promise<{ users: User[] }> => {
    const { data } = await api.get('/users');
    return data;
  },
};

export const okrApi = {
  getAll: async (): Promise<{ objectives: Objective[] }> => {
    const { data } = await api.get('/objectives');
    return data;
  },
  getById: async (id: string): Promise<{ objective: Objective }> => {
    const { data } = await api.get(`/objectives/${id}`);
    return data;
  },
  create: async (data: CreateObjectiveData): Promise<{ objective: Objective }> => {
    const { data: res } = await api.post('/objectives', data);
    return res;
  },
  update: async (id: string, data: Partial<Objective>): Promise<{ objective: Objective }> => {
    const { data: res } = await api.put(`/objectives/${id}`, data);
    return res;
  },
  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/objectives/${id}`);
    return data;
  },
  reorderKeyResults: async (objId: string, order: string[]): Promise<{ keyResults: KeyResult[] }> => {
    const { data } = await api.put(`/objectives/${objId}/keyresults/reorder`, { order });
    return data;
  },
  addKeyResult: async (
    objId: string,
    kr: { title: string; ownerId: string; deadline: string; description?: string }
  ): Promise<{ keyResult: KeyResult }> => {
    const { data } = await api.post(`/objectives/${objId}/keyresults`, kr);
    return data;
  },
  updateKeyResult: async (
    objId: string,
    krId: string,
    data: Partial<KeyResult>
  ): Promise<{ keyResult: KeyResult }> => {
    const { data: res } = await api.put(`/objectives/${objId}/keyresults/${krId}`, data);
    return res;
  },
  scoreKeyResult: async (
    objId: string,
    krId: string,
    score: number,
    feedback?: string
  ): Promise<{ keyResult: KeyResult }> => {
    const { data } = await api.put(`/objectives/${objId}/keyresults/${krId}/score`, { score, feedback });
    return data;
  },
  deleteKeyResult: async (objId: string, krId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/objectives/${objId}/keyresults/${krId}`);
    return data;
  },
};

export default api;

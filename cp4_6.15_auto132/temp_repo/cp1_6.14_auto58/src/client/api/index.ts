import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { User, Objective, CreateObjectiveInput, LoginResponse } from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }).then((r) => r.data),
  getMe: () => api.get<{ user: User }>('/auth/me').then((r) => r.data),
};

export const userApi = {
  getAll: () => api.get<{ users: User[] }>('/users').then((r) => r.data),
};

export const okrApi = {
  getAll: () => api.get<{ objectives: Objective[] }>('/objectives').then((r) => r.data),
  getById: (id: string) => api.get<{ objective: Objective }>(`/objectives/${id}`).then((r) => r.data),
  create: (data: CreateObjectiveInput) =>
    api.post<{ objective: Objective }>('/objectives', data).then((r) => r.data),
  update: (id: string, data: Partial<Objective>) =>
    api.put<{ objective: Objective }>(`/objectives/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/objectives/${id}`).then((r) => r.data),
};

export default api;

import { getToken } from './auth';
import type { User, Item, Task, Activity } from '../types';

const BASE_URL = '/api';

interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
}

const request = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options: RequestOptions = {}
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    config.body =
      options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }
  }

  const response = await fetch(`${BASE_URL}${url}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: '请求失败',
    }));
    throw new Error(error.message || '请求失败');
  }

  return response.json() as Promise<T>;
};

export const api = {
  get: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, 'GET', options),
  post: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, 'POST', { ...options, body }),
  put: <T>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, 'PUT', { ...options, body }),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>(url, 'DELETE', options),
};

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),
  register: (username: string, password: string, nickname: string) =>
    api.post<RegisterResponse>('/auth/register', {
      username,
      password,
      nickname,
    }),
  logout: () => api.post<void>('/auth/logout'),
  getCurrentUser: () => api.get<User>('/auth/me'),
};

export const itemsApi = {
  getItems: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
    status?: string;
  }) =>
    api.get<{ items: Item[]; total: number }>(
      `/items${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),
  getItem: (id: string) => api.get<Item>(`/items/${id}`),
  createItem: (data: Partial<Item>) => api.post<Item>('/items', data),
  updateItem: (id: string, data: Partial<Item>) =>
    api.put<Item>(`/items/${id}`, data),
  deleteItem: (id: string) => api.delete<void>(`/items/${id}`),
  exchangeItem: (id: string) => api.post<Item>(`/items/${id}/exchange`),
};

export const tasksApi = {
  getTasks: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) =>
    api.get<{ tasks: Task[]; total: number }>(
      `/tasks${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),
  getTask: (id: string) => api.get<Task>(`/tasks/${id}`),
  createTask: (data: Partial<Task>) => api.post<Task>('/tasks', data),
  updateTask: (id: string, data: Partial<Task>) =>
    api.put<Task>(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete<void>(`/tasks/${id}`),
  acceptTask: (id: string) => api.post<Task>(`/tasks/${id}/accept`),
  completeTask: (id: string) => api.post<Task>(`/tasks/${id}/complete`),
  cancelTask: (id: string) => api.post<Task>(`/tasks/${id}/cancel`),
  rateTask: (
    id: string,
    data: { rating: number; type: 'publisher' | 'accepter' }
  ) => api.post<Task>(`/tasks/${id}/rate`, data),
};

export const usersApi = {
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
  getUserItems: (id: string) => api.get<Item[]>(`/users/${id}/items`),
  getUserTasks: (id: string) => api.get<Task[]>(`/users/${id}/tasks`),
  getUserActivities: (id: string) => api.get<Activity[]>(`/users/${id}/activities`),
};

export const activitiesApi = {
  getActivities: (params?: { page?: number; pageSize?: number }) =>
    api.get<{ activities: Activity[]; total: number }>(
      `/activities${params ? '?' + new URLSearchParams(params as any).toString() : ''}`
    ),
  getActivity: (id: string) => api.get<Activity>(`/activities/${id}`),
};

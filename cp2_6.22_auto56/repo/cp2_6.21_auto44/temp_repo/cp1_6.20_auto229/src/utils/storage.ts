import type { CoffeeBean, BrewRecord } from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const beanApi = {
  getAll: () => request<CoffeeBean[]>('/beans'),
  getOne: (id: string) => request<CoffeeBean>(`/beans/${id}`),
  create: (data: Partial<CoffeeBean>) =>
    request<CoffeeBean>('/beans', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CoffeeBean>) =>
    request<CoffeeBean>(`/beans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/beans/${id}`, { method: 'DELETE' }),
};

export const brewApi = {
  getAll: (beanId?: string) =>
    request<BrewRecord[]>(`/brews${beanId ? `?beanId=${beanId}` : ''}`),
  getOne: (id: string) => request<BrewRecord>(`/brews/${id}`),
  create: (data: Partial<BrewRecord>) =>
    request<BrewRecord>('/brews', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<BrewRecord>) =>
    request<BrewRecord>(`/brews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/brews/${id}`, { method: 'DELETE' }),
  like: (id: string) =>
    request<{ likes: number }>(`/brews/${id}/like`, { method: 'POST' }),
};

export const communityApi = {
  getBrews: (page = 1, limit = 20, sortBy = 'likes') =>
    request<{ data: BrewRecord[]; total: number; page: number; limit: number }>(
      `/community/brews?page=${page}&limit=${limit}&sortBy=${sortBy}`
    ),
};

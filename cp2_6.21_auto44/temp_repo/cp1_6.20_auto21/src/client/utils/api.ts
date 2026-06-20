import { Repair, Stats, FormData } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const api = {
  getRepairs: (status?: string, sortBy?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (sortBy) params.set('sortBy', sortBy);
    const query = params.toString();
    return request<Repair[]>(`/repairs${query ? `?${query}` : ''}`);
  },

  getRepair: (id: string) => request<Repair>(`/repairs/${id}`),

  createRepair: (data: FormData) => 
    request<Repair>('/repairs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  acceptRepair: (id: string, repairer: string) =>
    request<Repair>(`/repairs/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ repairer }),
    }),

  updateStatus: (id: string, status: string, note: string, repairer: string) =>
    request<Repair>(`/repairs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, repairer }),
    }),

  getStats: () => request<Stats>('/stats'),
};

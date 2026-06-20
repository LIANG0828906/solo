import type { Log, Route } from '../types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getLogs: (): Promise<Log[]> => request<Log[]>('/logs'),

  getLog: (id: string): Promise<Log> => request<Log>(`/logs/${id}`),

  createLog: (log: Omit<Log, 'id' | 'createdAt' | 'updatedAt'>): Promise<Log> =>
    request<Log>('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),

  updateLog: (id: string, log: Partial<Log>): Promise<Log> =>
    request<Log>(`/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(log),
    }),

  deleteLog: (id: string): Promise<void> =>
    request<void>(`/logs/${id}`, {
      method: 'DELETE',
    }),

  searchLogs: (query: string): Promise<Log[]> =>
    request<Log[]>(`/logs/search?q=${encodeURIComponent(query)}`),

  createRoute: (data: { name: string; logIds: string[] }): Promise<Route> =>
    request<Route>('/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRoute: (id: string): Promise<Route> => request<Route>(`/routes/${id}`),

  getRoutes: (): Promise<Route[]> => request<Route[]>('/routes'),
};

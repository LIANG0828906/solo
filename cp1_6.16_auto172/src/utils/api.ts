import type {
  User,
  Task,
  Coffee,
  RankData,
  TimeRange,
  CompleteTaskResponse,
  ExchangeResponse,
  ExchangeRecordsResponse,
} from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  return response.json();
}

export const api = {
  getUser: () => request<User>('/user'),
  getTasks: () => request<Task[]>('/tasks'),
  completeTask: (taskId: string) =>
    request<CompleteTaskResponse>('/completeTask', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),
  getCoffees: () => request<Coffee[]>('/coffees'),
  exchange: (coffeeId: string) =>
    request<ExchangeResponse>('/exchange', {
      method: 'POST',
      body: JSON.stringify({ coffeeId }),
    }),
  getRank: (timeRange: TimeRange) =>
    request<RankData>(`/rank?timeRange=${timeRange}`),
  getExchangeRecords: (page: number, pageSize: number) =>
    request<ExchangeRecordsResponse>(
      `/exchangeRecords?page=${page}&pageSize=${pageSize}`
    ),
};

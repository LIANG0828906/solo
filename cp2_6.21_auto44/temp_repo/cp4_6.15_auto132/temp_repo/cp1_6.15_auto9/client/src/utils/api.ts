import type { Transaction, MonthlyStats, SavingsGoal, GoalProgress } from '@/types';

const BASE_URL = '';

interface FetchTransactionsParams {
  month?: string;
  category?: string;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function fetchTransactions(params?: FetchTransactionsParams): Promise<Transaction[]> {
  const query = new URLSearchParams();
  if (params?.month) query.set('month', params.month);
  if (params?.category) query.set('category', params.category);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request<Transaction[]>(`/api/transactions${queryString}`);
}

export function deleteTransaction(id: string): Promise<void> {
  return request<void>(`/api/transactions/delete`, {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export function fetchMonthlyStats(month?: string): Promise<MonthlyStats> {
  const query = month ? `?month=${month}` : '';
  return request<MonthlyStats>(`/api/statistics/monthly${query}`);
}

export function fetchGoals(): Promise<SavingsGoal[]> {
  return request<SavingsGoal[]>('/api/goals');
}

export function createGoal(data: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<SavingsGoal> {
  return request<SavingsGoal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function fetchGoalProgress(id: string): Promise<GoalProgress> {
  return request<GoalProgress>(`/api/goals/${id}/progress`);
}

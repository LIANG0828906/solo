export interface Project {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  client_name: string;
  rate_type: 'hourly' | 'fixed';
  rate_amount: number;
  progress: number;
  status: 'in_progress' | 'completed' | 'paused';
  created_at?: string;
}

export interface Income {
  id: number;
  project_id: number;
  income_date: string;
  amount: number;
  invoice_number: string;
  payment_status: 'received' | 'pending' | 'overdue';
  project_name?: string;
  created_at?: string;
}

export interface ProjectDetail extends Project {
  income: Income[];
}

export interface OverviewSummary {
  totalIncome: number;
  monthlyIncome: number;
  prevMonthlyIncome: number;
  prev2MonthlyIncome: number;
}

export interface OverviewPrediction {
  historical: { month: string; total: number }[];
  predictions: { month: string; total: number }[];
}

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const fetchProjects = () => request<Project[]>(`${BASE}/projects`);

export const addProject = (data: Omit<Project, 'id' | 'created_at'>) =>
  request<Project>(`${BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const fetchProjectDetail = (id: number) =>
  request<ProjectDetail>(`${BASE}/projects/${id}`);

export const fetchIncome = () => request<Income[]>(`${BASE}/income`);

export const addIncome = (data: Omit<Income, 'id' | 'created_at'>) =>
  request<Income>(`${BASE}/income`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deleteIncome = (id: number) =>
  request<{ success: boolean }>(`${BASE}/income/${id}`, { method: 'DELETE' });

export const fetchOverviewSummary = () =>
  request<OverviewSummary>(`${BASE}/overview/summary`);

export const fetchOverviewPrediction = () =>
  request<OverviewPrediction>(`${BASE}/overview/prediction`);

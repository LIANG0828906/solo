import axios from 'axios';
import type { User, Transaction, Budget, MonthlySummary, TrendData } from './types';

const api = axios.create({
  baseURL: '/api',
});

export interface SummaryResponse {
  balance: number;
  monthlySummary: MonthlySummary;
  trendData: TrendData[];
  budgets: Budget[];
  transactions: Transaction[];
}

export interface TransactionResponse {
  transaction: Transaction;
  balance: number;
  monthlySummary: MonthlySummary;
  budgets: Budget[];
}

export const fetchUsers = (): Promise<User[]> =>
  api.get('/users').then((r) => r.data);

export const fetchSummary = (userId: string): Promise<SummaryResponse> =>
  api.get(`/summary?userId=${userId}`).then((r) => r.data);

export const fetchTransactions = (userId: string): Promise<Transaction[]> =>
  api.get(`/transactions?userId=${userId}`).then((r) => r.data);

export const fetchBudgets = (userId: string): Promise<Budget[]> =>
  api.get(`/budgets?userId=${userId}`).then((r) => r.data);

export const createTransaction = (
  data: Omit<Transaction, 'id'>
): Promise<TransactionResponse> =>
  api.post('/transactions', data).then((r) => r.data);

export const updateTransaction = (
  id: string,
  data: Partial<Transaction>
): Promise<TransactionResponse> =>
  api.put(`/transactions/${id}`, data).then((r) => r.data);

export const deleteTransaction = (id: string): Promise<TransactionResponse> =>
  api.delete(`/transactions/${id}`).then((r) => r.data);

export const updateBudget = (
  id: string,
  data: Partial<Budget>
): Promise<Budget> => api.put(`/budgets/${id}`, data).then((r) => r.data);

export const createBudget = (
  data: Omit<Budget, 'id'>
): Promise<Budget> => api.post('/budgets', data).then((r) => r.data);

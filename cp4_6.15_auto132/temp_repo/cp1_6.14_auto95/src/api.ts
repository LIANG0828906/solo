import axios from 'axios';
import type { Book, Loan, Notification, Reader, LibraryConfig, ApiResponse, User } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export async function getBooks(params?: Record<string, string>): Promise<Book[]> {
  const { data } = await api.get<ApiResponse<Book[]>>('/books', { params });
  return data.data || [];
}

export async function getBookDetail(id: string): Promise<Book & { loanHistory?: Loan[] }> {
  const { data } = await api.get<ApiResponse<Book & { loanHistory?: Loan[] }>>(`/books/${id}`);
  return data.data as Book & { loanHistory?: Loan[] };
}

export async function borrowBook(bookId: string): Promise<ApiResponse<Loan>> {
  const { data } = await api.post<ApiResponse<Loan>>('/loans', { bookId });
  return data;
}

export async function returnBook(loanId: string): Promise<ApiResponse<Loan>> {
  const { data } = await api.post<ApiResponse<Loan>>('/loans/return', { loanId });
  return data;
}

export async function getReaderLoans(readerId: string): Promise<Loan[]> {
  const { data } = await api.get<ApiResponse<Loan[]>>(`/loans/reader/${readerId}/loans`);
  return data.data || [];
}

export async function getReaderHistory(readerId: string): Promise<Loan[]> {
  const { data } = await api.get<ApiResponse<Loan[]>>(`/loans/reader/${readerId}/history`);
  return data.data || [];
}

export async function login(email: string, password: string): Promise<ApiResponse<{ token: string; reader: User }>> {
  const { data } = await api.post<ApiResponse<{ token: string; reader: User }>>('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<ApiResponse<{ token: string; reader: User }>> {
  const { data } = await api.post<ApiResponse<{ token: string; reader: User }>>('/auth/register', { name, email, password });
  return data;
}

export async function getNotifications(params?: Record<string, string>): Promise<{ items: Notification[]; total: number; page: number; pageSize: number }> {
  const { data } = await api.get<ApiResponse<{ items: Notification[]; total: number; page: number; pageSize: number }>>('/admin/notifications', { params });
  return data.data || { items: [], total: 0, page: 1, pageSize: 20 };
}

export async function markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
  const { data } = await api.put<ApiResponse<Notification>>(`/admin/notifications/${id}/read`);
  return data;
}

export async function getReports(): Promise<ApiResponse<{
  totalLoans: number;
  activeLoans: number;
  overdueLoans: number;
  monthlyStats: { month: string; count: number }[];
  categoryStats: { category: string; count: number }[];
}>> {
  const { data } = await api.get<ApiResponse<{
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    monthlyStats: { month: string; count: number }[];
    categoryStats: { category: string; count: number }[];
  }>>('/admin/reports');
  return data;
}

export async function createBook(bookData: Partial<Book>): Promise<ApiResponse<Book>> {
  const { data } = await api.post<ApiResponse<Book>>('/books', bookData);
  return data;
}

export async function updateBook(id: string, bookData: Partial<Book>): Promise<ApiResponse<Book>> {
  const { data } = await api.put<ApiResponse<Book>>(`/books/${id}`, bookData);
  return data;
}

export async function deleteBook(id: string): Promise<ApiResponse<void>> {
  const { data } = await api.delete<ApiResponse<void>>(`/books/${id}`);
  return data;
}

export async function getReaders(): Promise<Reader[]> {
  const { data } = await api.get<ApiResponse<Reader[]>>('/admin/readers');
  return data.data || [];
}

export async function addLateFee(loanId: string, fee: number): Promise<ApiResponse<Loan>> {
  const { data } = await api.put<ApiResponse<Loan>>(`/admin/loans/${loanId}/fee`, { fee });
  return data;
}

export async function getAllLoans(): Promise<Loan[]> {
  const { data } = await api.get<ApiResponse<Loan[]>>('/admin/loans');
  return data.data || [];
}

export async function updateConfig(config: Partial<LibraryConfig>): Promise<ApiResponse<LibraryConfig>> {
  const { data } = await api.put<ApiResponse<LibraryConfig>>('/admin/config', config);
  return data;
}

export async function getConfig(): Promise<LibraryConfig> {
  const { data } = await api.get<ApiResponse<LibraryConfig>>('/admin/config');
  return data.data as LibraryConfig;
}

export default api;

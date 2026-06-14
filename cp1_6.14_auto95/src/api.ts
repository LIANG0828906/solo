import axios from 'axios';
import type { Book, Loan, Notification, Reader } from './types';

const api = axios.create({
  baseURL: '/api',
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

export async function getBooks(params?: Record<string, string>) {
  const { data } = await api.get('/books', { params });
  return data.data as Book[];
}

export async function getBookDetail(id: string) {
  const { data } = await api.get(`/books/${id}`);
  return data.data as Book & { loans?: Loan[] };
}

export async function borrowBook(bookId: string) {
  const { data } = await api.post('/loans/borrow', { bookId });
  return data;
}

export async function returnBook(loanId: string) {
  const { data } = await api.post(`/loans/${loanId}/return`);
  return data;
}

export async function getReaderLoans(readerId: string) {
  const { data } = await api.get(`/loans/reader/${readerId}`);
  return data.data as Loan[];
}

export async function getReaderHistory(readerId: string) {
  const { data } = await api.get(`/loans/reader/${readerId}/history`);
  return data.data as Loan[];
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function getNotifications(params?: Record<string, string>) {
  const { data } = await api.get('/notifications', { params });
  return data.data as Notification[];
}

export async function markNotificationRead(id: string) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function getReports() {
  const { data } = await api.get('/reports');
  return data.data;
}

export async function createBook(formData: FormData) {
  const { data } = await api.post('/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function updateBook(id: string, formData: FormData) {
  const { data } = await api.put(`/books/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteBook(id: string) {
  const { data } = await api.delete(`/books/${id}`);
  return data;
}

export async function getReaders() {
  const { data } = await api.get('/readers');
  return data.data as Reader[];
}

export async function addLateFee(loanId: string, amount: number) {
  const { data } = await api.post(`/loans/${loanId}/late-fee`, { amount });
  return data;
}

export async function getAllLoans() {
  const { data } = await api.get('/loans');
  return data.data as Loan[];
}

export async function updateConfig(config: { maxBorrowCount?: number; loanDays?: number; lateFeePerDay?: number }) {
  const { data } = await api.put('/config', config);
  return data;
}

export async function getConfig() {
  const { data } = await api.get('/config');
  return data.data as { maxBorrowCount: number; loanDays: number; lateFeePerDay: number };
}

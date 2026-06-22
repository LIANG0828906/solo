import axios from 'axios';
import type { ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '请求失败，请稍后重试';
    return Promise.reject({ ...error, message });
  }
);

export async function fetchBooks(params?: {
  page?: number;
  limit?: number;
  category?: string;
}) {
  const response = await api.get<ApiResponse<any[]>>('/books', { params });
  return response.data;
}

export async function searchBooks(params: {
  q: string;
  category?: string;
}) {
  const response = await api.get<ApiResponse<any[]>>('/books/search', { params });
  return response.data;
}

export async function fetchBookById(id: string) {
  const response = await api.get<ApiResponse<any>>(`/books/${id}`);
  return response.data;
}

export async function fetchCategories() {
  const response = await api.get<ApiResponse<string[]>>('/books/categories');
  return response.data;
}

export async function createBook(data: any) {
  const response = await api.post<ApiResponse<any>>('/books', data);
  return response.data;
}

export async function updateBook(id: string, data: any) {
  const response = await api.put<ApiResponse<any>>(`/books/${id}`, data);
  return response.data;
}

export async function deleteBook(id: string) {
  const response = await api.delete<ApiResponse<any>>(`/books/${id}`);
  return response.data;
}

export async function login(userId: string) {
  const response = await api.post<ApiResponse<any>>('/login', { userId });
  return response.data;
}

export async function fetchUserRecords(userId: string, status?: string) {
  const response = await api.get<ApiResponse<any[]>>(`/users/${userId}/records`, {
    params: { status },
  });
  return response.data;
}

export async function reserveBook(userId: string, bookId: string) {
  const response = await api.post<ApiResponse<any>>('/reserve', { userId, bookId });
  return response.data;
}

export async function borrowBook(recordId: string) {
  const response = await api.put<ApiResponse<any>>(`/borrow/${recordId}`);
  return response.data;
}

export async function returnBook(recordId: string) {
  const response = await api.put<ApiResponse<any>>(`/return/${recordId}`);
  return response.data;
}

export async function renewBook(recordId: string) {
  const response = await api.put<ApiResponse<any>>(`/renew/${recordId}`);
  return response.data;
}

export async function cancelReservation(recordId: string) {
  const response = await api.delete<ApiResponse<any>>(`/reserve/${recordId}`);
  return response.data;
}

export async function fetchAllRecords(params?: {
  status?: string;
  userId?: string;
  bookId?: string;
}) {
  const response = await api.get<ApiResponse<any[]>>('/records', { params });
  return response.data;
}

export default api;

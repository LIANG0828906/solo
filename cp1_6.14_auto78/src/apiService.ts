import axios, { AxiosInstance } from 'axios';
import type { Book, ReadingRecord, Goal, WeeklyAnalytics, MonthlyAnalytics, BookProgressPayload } from './types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const getBooks = (): Promise<any> => {
  return api.get('/books');
};

export const getBook = (id: string): Promise<any> => {
  return api.get(`/books/${id}`);
};

export const createBook = (data: Omit<Book, 'id' | 'createdAt'>): Promise<any> => {
  return api.post('/books', data);
};

export const updateBook = (id: string, data: Partial<Omit<Book, 'id'>>): Promise<any> => {
  return api.put(`/books/${id}`, data);
};

export const deleteBook = (id: string): Promise<any> => {
  return api.delete(`/books/${id}`);
};

export const updateProgress = (id: string, data: BookProgressPayload): Promise<any> => {
  return api.patch(`/books/${id}/progress`, data);
};

export const getRecords = (): Promise<any> => {
  return api.get('/records');
};

export const createRecord = (data: Omit<ReadingRecord, 'id'>): Promise<any> => {
  return api.post('/records', data);
};

export const updateRecord = (id: string, data: Partial<Omit<ReadingRecord, 'id'>>): Promise<any> => {
  return api.put(`/records/${id}`, data);
};

export const deleteRecord = (id: string): Promise<any> => {
  return api.delete(`/records/${id}`);
};

export const getGoals = (): Promise<any> => {
  return api.get('/goals');
};

export const updateGoals = (data: Goal): Promise<any> => {
  return api.put('/goals', data);
};

export const getWeeklyAnalytics = (): Promise<any> => {
  return api.get('/analytics/weekly');
};

export const getMonthlyAnalytics = (): Promise<any> => {
  return api.get('/analytics/monthly');
};

export default api;

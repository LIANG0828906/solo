import axios from 'axios';
import type { Station, Book, DriftRecord, PagedBooks, ISBNInfo } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const stationApi = {
  getAll: () => api.get<Station[]>('/stations').then((r) => r.data),
  create: (data: Omit<Station, 'id' | 'createdAt' | 'bookCount'>) =>
    api.post<Station>('/stations', data).then((r) => r.data),
  getById: (id: string) => api.get<Station>(`/stations/${id}`).then((r) => r.data),
};

export const bookApi = {
  getAll: (page = 1, pageSize = 10, stationId?: string) =>
    api
      .get<PagedBooks>('/books', { params: { page, pageSize, stationId } })
      .then((r) => r.data),
  create: (data: any) => api.post<Book>('/books', data).then((r) => r.data),
  getById: (id: string) => api.get<Book>(`/books/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string, stationId?: string, readingMinutes?: number) =>
    api
      .put<Book>(`/books/${id}/status`, { status, stationId, readingMinutes })
      .then((r) => r.data),
};

export const recordApi = {
  get: (bookId?: string, stationId?: string) =>
    api.get<DriftRecord[]>('/records', { params: { bookId, stationId } }).then((r) => r.data),
};

export const isbnApi = {
  lookup: (isbn: string) =>
    api.get<ISBNInfo>(`/isbn/${isbn}`).then((r) => r.data).catch(() => null),
};

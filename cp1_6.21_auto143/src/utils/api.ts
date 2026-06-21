import axios from 'axios';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
}

export interface Excerpt {
  id: string;
  bookId: string;
  content: string;
  insight: string;
  tags: string[];
  order: number;
  createdAt: string;
}

export interface TagFrequency {
  tag: string;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const bookApi = {
  getAll: () => api.get<ApiResponse<Book[]>>('/books').then(res => res.data),
};

export const excerptApi = {
  getByBookId: (bookId: string) =>
    api.get<ApiResponse<Excerpt[]>>(`/books/${bookId}/excerpts`).then(res => res.data),
  
  create: (bookId: string, data: { content: string; insight: string; tags: string[]; order: number }) =>
    api.post<ApiResponse<Excerpt>>(`/books/${bookId}/excerpts`, data).then(res => res.data),
  
  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/excerpts/${id}`).then(res => res.data),
  
  reorder: (id: string, order: number) =>
    api.put<ApiResponse<void>>(`/excerpts/${id}/reorder`, { order }).then(res => res.data),
};

export const tagApi = {
  getByBookId: (bookId: string) =>
    api.get<ApiResponse<TagFrequency[]>>(`/books/${bookId}/tags`).then(res => res.data),
};

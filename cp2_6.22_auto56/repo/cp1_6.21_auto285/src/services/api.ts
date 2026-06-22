import axios from 'axios';
import type { Book, User, Loan, SearchFilter } from '@shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const bookApi = {
  getBooks: (filter?: Partial<SearchFilter>) =>
    api.get<Book[]>('/books', { params: filter }),

  getBook: (id: string) =>
    api.get<Book>(`/books/${id}`),

  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'status'>) =>
    api.post<Book>('/books', book),

  updateBook: (id: string, book: Partial<Book>) =>
    api.put<Book>(`/books/${id}`, book),

  deleteBook: (id: string) =>
    api.delete(`/books/${id}`),
};

export const userApi = {
  getUsers: () =>
    api.get<User[]>('/users'),

  getUser: (id: string) =>
    api.get<User>(`/users/${id}`),

  rateUser: (userId: string, rating: number) =>
    api.post<User>(`/users/${userId}/rate`, { rating }),
};

export const loanApi = {
  getLoans: (userId?: string) =>
    api.get<Loan[]>('/loans', { params: userId ? { userId } : undefined }),

  getLoan: (id: string) =>
    api.get<Loan>(`/loans/${id}`),

  createLoan: (loan: Omit<Loan, 'id' | 'status' | 'borrowDate'>) =>
    api.post<Loan>('/loans', loan),

  updateLoan: (id: string, loan: Partial<Loan>) =>
    api.put<Loan>(`/loans/${id}`, loan),
};

export default api;

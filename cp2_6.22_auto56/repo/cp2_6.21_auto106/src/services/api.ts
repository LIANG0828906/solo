import axios from 'axios';
import { Book, StatisticsData } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GetBooksParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
}

export const bookApi = {
  getBooks: async (params: GetBooksParams = {}): Promise<{ books: Book[]; total: number }> => {
    const { page = 1, pageSize = 20, search, tag } = params;
    const queryParams: Record<string, string | number> = { page, page_size: pageSize };
    if (search) queryParams.search = search;
    if (tag) queryParams.tag = tag;
    const response = await api.get('/books', { params: queryParams });
    return response.data;
  },

  getBookById: async (bookId: number): Promise<Book> => {
    const response = await api.get(`/books/${bookId}`);
    return response.data;
  },

  getTags: async (): Promise<string[]> => {
    const response = await api.get('/tags');
    return response.data.tags;
  },

  addBook: async (book: Omit<Book, 'id' | 'created_at'>): Promise<Book> => {
    const response = await api.post('/books', book);
    return response.data;
  },

  updateStatus: async (
    bookId: number,
    status: 'available' | 'borrowed',
    borrower?: string
  ): Promise<Book> => {
    const response = await api.put(`/books/${bookId}/status`, { status, borrower });
    return response.data;
  },

  getStatistics: async (): Promise<StatisticsData> => {
    const response = await api.get('/statistics');
    return response.data;
  },
};

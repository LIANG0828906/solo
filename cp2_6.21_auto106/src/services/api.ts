import axios from 'axios';
import { Book, StatisticsData } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const bookApi = {
  getBooks: async (page = 1, pageSize = 20): Promise<{ books: Book[]; total: number }> => {
    const response = await api.get('/books', { params: { page, page_size: pageSize } });
    return response.data;
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

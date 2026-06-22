import { create } from 'zustand';
import axios from 'axios';

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  cover?: string;
  description?: string;
  owner: string;
  createdAt: string;
}

export interface ExchangeRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  fromUser: string;
  toUser: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Recommendation {
  book: Book;
  similarity: number;
}

interface BookStore {
  books: Book[];
  recommendations: Recommendation[];
  exchanges: ExchangeRequest[];
  loading: boolean;
  error: string | null;
  requestedExchanges: Set<string>;
  
  fetchBooks: () => Promise<void>;
  fetchBook: (id: string) => Promise<Book | null>;
  addBook: (book: Omit<Book, 'id' | 'owner' | 'createdAt'>) => Promise<void>;
  fetchRecommendations: (bookId: string) => Promise<void>;
  fetchExchanges: () => Promise<void>;
  requestExchange: (bookId: string, toUser: string) => Promise<boolean>;
  clearRecommendations: () => void;
  hasRequested: (bookId: string) => boolean;
}

const API_BASE = '/api';

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  recommendations: [],
  exchanges: [],
  loading: false,
  error: null,
  requestedExchanges: new Set(),

  fetchBooks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<Book[]>(`${API_BASE}/books`);
      set({ books: response.data, loading: false });
    } catch (error) {
      set({ error: '获取书籍列表失败', loading: false });
    }
  },

  fetchBook: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<Book>(`${API_BASE}/books/${id}`);
      set({ loading: false });
      return response.data;
    } catch (error) {
      set({ error: '获取书籍详情失败', loading: false });
      return null;
    }
  },

  addBook: async (bookData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post<Book>(`${API_BASE}/books`, bookData);
      set((state) => ({
        books: [response.data, ...state.books],
        loading: false
      }));
    } catch (error) {
      set({ error: '发布书籍失败', loading: false });
    }
  },

  fetchRecommendations: async (bookId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<Recommendation[]>(
        `${API_BASE}/recommend/${bookId}`
      );
      set({ recommendations: response.data, loading: false });
    } catch (error) {
      set({ error: '获取推荐失败', loading: false });
    }
  },

  fetchExchanges: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<ExchangeRequest[]>(`${API_BASE}/exchanges`);
      set({ exchanges: response.data, loading: false });
    } catch (error) {
      set({ error: '获取交换记录失败', loading: false });
    }
  },

  requestExchange: async (bookId: string, toUser: string) => {
    try {
      const response = await axios.post<ExchangeRequest>(`${API_BASE}/exchanges`, {
        bookId,
        fromUser: '当前用户',
        toUser
      });
      
      set((state) => {
        const newRequested = new Set(state.requestedExchanges);
        newRequested.add(bookId);
        return {
          requestedExchanges: newRequested,
          exchanges: [response.data, ...state.exchanges]
        };
      });
      
      return true;
    } catch (error) {
      set({ error: '发起交换请求失败' });
      return false;
    }
  },

  clearRecommendations: () => {
    set({ recommendations: [] });
  },

  hasRequested: (bookId: string) => {
    return get().requestedExchanges.has(bookId);
  }
}));

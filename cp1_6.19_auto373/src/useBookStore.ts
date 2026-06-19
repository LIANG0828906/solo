import { create } from 'zustand';
import axios from 'axios';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  stock: number;
  weeklySales: number;
  price: number;
  createdAt: string;
  inventoryHistory: { date: string; stock: number }[];
}

export interface Store {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stock: number;
  distance: number;
}

export interface PrintSuggestion {
  type: 'print';
  predictedDemand: number;
  recommendedQty: number;
  reason: string;
  estimatedCost: number;
}

export interface TransferSuggestion {
  type: 'transfer';
  stores: Store[];
  totalAvailable: number;
  recommendedQty: number;
  reason: string;
  estimatedCost: number;
}

export interface SuggestionResponse {
  print: PrintSuggestion;
  transfer: TransferSuggestion;
}

export interface ActionLog {
  id: string;
  bookId: string;
  bookTitle: string;
  type: 'print' | 'transfer';
  quantity: number;
  timestamp: string;
  details: string;
}

interface BookState {
  books: Book[];
  selectedBook: Book | null;
  suggestion: SuggestionResponse | null;
  logs: ActionLog[];
  loading: boolean;
  fetchBooks: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'inventoryHistory'>) => Promise<void>;
  selectBook: (book: Book | null) => void;
  fetchSuggestion: (bookId: string) => Promise<void>;
  executeAction: (bookId: string, type: 'print' | 'transfer', quantity: number, details: string) => Promise<void>;
  fetchLogs: () => Promise<void>;
}

export const useBookStore = create<BookState>((set) => ({
  books: [],
  selectedBook: null,
  suggestion: null,
  logs: [],
  loading: false,

  fetchBooks: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get<Book[]>('/api/books');
      set({ books: data });
    } finally {
      set({ loading: false });
    }
  },

  addBook: async (book) => {
    set({ loading: true });
    try {
      const { data } = await axios.post<Book>('/api/books', book);
      set((state) => ({ books: [...state.books, data] }));
    } finally {
      set({ loading: false });
    }
  },

  selectBook: (book) => {
    set({ selectedBook: book, suggestion: null });
  },

  fetchSuggestion: async (bookId) => {
    set({ loading: true });
    try {
      const { data } = await axios.get<SuggestionResponse>(`/api/suggestion/${bookId}`);
      set({ suggestion: data });
    } finally {
      set({ loading: false });
    }
  },

  executeAction: async (bookId, type, quantity, details) => {
    set({ loading: true });
    try {
      const { data } = await axios.post<{ success: boolean; book: Book; log: ActionLog }>('/api/action', {
        bookId,
        type,
        quantity,
        details,
      });
      set((state) => ({
        books: state.books.map((b) => (b.id === data.book.id ? data.book : b)),
        selectedBook: data.book,
        logs: [data.log, ...state.logs],
      }));
    } finally {
      set({ loading: false });
    }
  },

  fetchLogs: async () => {
    try {
      const { data } = await axios.get<ActionLog[]>('/api/logs');
      set({ logs: data });
    } catch {
      // noop
    }
  },
}));

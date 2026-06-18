import { create } from 'zustand';
import type { Book } from '@/types';
import {
  fetchBooks as fetchBooksApi,
  createBook as createBookApi,
  updateBook as updateBookApi,
  deleteBook as deleteBookApi,
} from '@/api/bookApi';

interface BookState {
  books: Book[];
  loading: boolean;
  error: string | null;
  lowStockWarnings: string[];
  fetchBooks: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'dailySales'>) => Promise<void>;
  updateBook: (id: string, data: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  updateLowStockWarnings: () => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  error: null,
  lowStockWarnings: [],

  fetchBooks: async () => {
    set({ loading: true, error: null });
    try {
      const books = await fetchBooksApi();
      set({ books });
      get().updateLowStockWarnings();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取图书列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  addBook: async (book) => {
    set({ loading: true, error: null });
    try {
      const newBook = await createBookApi(book);
      set((state) => ({ books: [...state.books, newBook] }));
      get().updateLowStockWarnings();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '添加图书失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateBook: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedBook = await updateBookApi(id, data);
      set((state) => ({
        books: state.books.map((book) =>
          book.id === id ? updatedBook : book
        ),
      }));
      get().updateLowStockWarnings();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新图书失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteBook: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteBookApi(id);
      set((state) => ({
        books: state.books.filter((book) => book.id !== id),
      }));
      get().updateLowStockWarnings();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除图书失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateLowStockWarnings: () => {
    const { books } = get();
    const lowStockIds = books
      .filter((book) => book.stock < 5)
      .map((book) => book.id);
    set({ lowStockWarnings: lowStockIds });
  },
}));

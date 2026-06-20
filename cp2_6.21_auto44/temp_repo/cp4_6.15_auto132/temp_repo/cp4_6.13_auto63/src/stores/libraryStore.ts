import { create } from 'zustand';
import apiClient from '../apiClient';

export interface Book {
  id: string;
  owner_id: string;
  title: string;
  author?: string;
  cover_url?: string;
  status: string;
  max_borrow_days: number;
  max_borrow_count: number;
  drift_count: number;
  avg_rating: number;
  created_at: string;
}

export interface BorrowRequest {
  id: string;
  book_id: string;
  borrower_id: string;
  owner_id: string;
  duration_days: number;
  reason?: string;
  status: string;
  borrow_date?: string;
  return_date?: string;
  rating: number;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  related_id?: string;
}

interface LibraryState {
  books: Book[];
  borrowRequests: BorrowRequest[];
  notifications: Notification[];
  notificationsVisible: boolean;

  fetchBooks: () => Promise<void>;
  fetchBorrowRequests: () => Promise<void>;
  addBook: (data: Partial<Book>) => Promise<void>;
  approveBorrow: (id: string) => Promise<void>;
  rejectBorrow: (id: string) => Promise<void>;
  toggleNotifications: () => void;
}

const useLibraryStore = create<LibraryState>((set, get) => ({
  books: [],
  borrowRequests: [],
  notifications: [],
  notificationsVisible: false,

  fetchBooks: async () => {
    try {
      const data = await apiClient.get('/books');
      set({ books: data || [] });
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  },

  fetchBorrowRequests: async () => {
    try {
      const data = await apiClient.get('/borrows');
      set({ borrowRequests: data || [] });
    } catch (error) {
      console.error('Failed to fetch borrow requests:', error);
    }
  },

  addBook: async (data: Partial<Book>) => {
    try {
      const newBook = await apiClient.post('/books', data);
      set((state) => ({
        books: [...state.books, newBook],
      }));
    } catch (error) {
      console.error('Failed to add book:', error);
      throw error;
    }
  },

  approveBorrow: async (id: string) => {
    try {
      const updated = await apiClient.patch(`/borrows/${id}/approve`);
      set((state) => ({
        borrowRequests: state.borrowRequests.map((req) =>
          req.id === id ? { ...req, ...updated } : req
        ),
      }));
      await get().fetchBooks();
    } catch (error) {
      console.error('Failed to approve borrow:', error);
      throw error;
    }
  },

  rejectBorrow: async (id: string) => {
    try {
      const updated = await apiClient.patch(`/borrows/${id}/reject`);
      set((state) => ({
        borrowRequests: state.borrowRequests.map((req) =>
          req.id === id ? { ...req, ...updated } : req
        ),
      }));
    } catch (error) {
      console.error('Failed to reject borrow:', error);
      throw error;
    }
  },

  toggleNotifications: () => {
    set((state) => ({
      notificationsVisible: !state.notificationsVisible,
    }));
  },
}));

export default useLibraryStore;

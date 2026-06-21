import { create } from 'zustand';
import { Book, User, StatisticsData, ToastMessage } from '../types';

interface AppState {
  user: User;
  books: Book[];
  totalBooks: number;
  allTags: string[];
  statistics: StatisticsData | null;
  toasts: ToastMessage[];
  isLoading: boolean;

  setUser: (user: User) => void;
  setBooks: (books: Book[], total: number) => void;
  updateBookStatus: (bookId: number, status: 'available' | 'borrowed', borrower?: string) => void;
  setAllTags: (tags: string[]) => void;
  setStatistics: (stats: StatisticsData) => void;
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppState>((set) => ({
  user: { id: 1, username: 'currentUser' },
  books: [],
  totalBooks: 0,
  allTags: [],
  statistics: null,
  toasts: [],
  isLoading: false,

  setUser: (user) => set({ user }),

  setBooks: (books, total) => set({ books, totalBooks: total }),

  updateBookStatus: (bookId, status, borrower) =>
    set((state) => ({
      books: state.books.map((book) =>
        book.id === bookId
          ? { ...book, status, borrower: status === 'borrowed' ? borrower : undefined }
          : book
      ),
    })),

  setAllTags: (tags) => set({ allTags: tags }),

  setStatistics: (stats) => set({ statistics: stats }),

  addToast: (message, type = 'info') => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      useAppStore.getState().removeToast(id);
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));

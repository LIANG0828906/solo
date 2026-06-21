import { create } from 'zustand';
import { Book, User, StatisticsData, ToastMessage } from '../types';

interface AppState {
  user: User;
  books: Book[];
  filteredBooks: Book[];
  searchQuery: string;
  selectedTag: string;
  statistics: StatisticsData | null;
  toasts: ToastMessage[];
  isLoading: boolean;

  setUser: (user: User) => void;
  setBooks: (books: Book[]) => void;
  updateBookStatus: (bookId: number, status: 'available' | 'borrowed', borrower?: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string) => void;
  setStatistics: (stats: StatisticsData) => void;
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const applyFilters = (books: Book[], query: string, tag: string): Book[] => {
  let result = books;
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    result = result.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery)
    );
  }
  if (tag) {
    result = result.filter((book) => book.tags.includes(tag));
  }
  return result;
};

export const useAppStore = create<AppState>((set, get) => ({
  user: { id: 1, username: 'currentUser' },
  books: [],
  filteredBooks: [],
  searchQuery: '',
  selectedTag: '',
  statistics: null,
  toasts: [],
  isLoading: false,

  setUser: (user) => set({ user }),

  setBooks: (books) => set({ books, filteredBooks: books }),

  updateBookStatus: (bookId, status, borrower) =>
    set((state) => {
      const updatedBooks = state.books.map((book) =>
        book.id === bookId
          ? { ...book, status, borrower: status === 'borrowed' ? borrower : undefined }
          : book
      );
      return {
        books: updatedBooks,
        filteredBooks: applyFilters(updatedBooks, state.searchQuery, state.selectedTag),
      };
    }),

  setSearchQuery: (query) =>
    set((state) => ({
      searchQuery: query,
      filteredBooks: applyFilters(state.books, query, state.selectedTag),
    })),

  setSelectedTag: (tag) =>
    set((state) => ({
      selectedTag: tag,
      filteredBooks: applyFilters(state.books, state.searchQuery, tag),
    })),

  setStatistics: (stats) => set({ statistics: stats }),

  addToast: (message, type = 'info') => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));

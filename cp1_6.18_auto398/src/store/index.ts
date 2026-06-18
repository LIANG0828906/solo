import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Book, BookShelf, User, ReadingStats, Comment, BookMetadata } from '@/types';
import { apiFetch, clearToken, setToken, setStoredUser, getStoredUser, getToken, decodeShareId } from '@/utils/api';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  books: Book[];
  currentBook: Book | null;
  isLoadingBooks: boolean;
  shelves: BookShelf[];
  currentShelf: (BookShelf & { books?: Book[]; owner?: string }) | null;
  stats: ReadingStats | null;
  sharedShelf: (BookShelf & { books?: Book[]; owner?: string }) | null;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  fetchBooks: () => Promise<void>;
  fetchBookMetadata: (isbn: string) => Promise<BookMetadata>;
  addBook: (data: Partial<Book> & { title: string; authors: string[] }) => Promise<Book>;
  updateBook: (id: string, data: Partial<Book>) => Promise<Book>;
  deleteBook: (id: string) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;
  fetchShelves: () => Promise<void>;
  createShelf: (data: { name: string; description?: string; theme?: string; bookIds: string[]; isPublic: boolean }) => Promise<BookShelf>;
  updateShelf: (id: string, data: any) => Promise<BookShelf>;
  deleteShelf: (id: string) => Promise<void>;
  fetchShelfDetail: (id: string) => Promise<void>;
  likeShelf: (shelfId: string, fromShare?: boolean) => Promise<void>;
  addComment: (shelfId: string, username: string, content: string, fromShare?: boolean) => Promise<Comment>;
  generateShareLink: (shelfId: string) => string;
  fetchSharedShelf: (encodedId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setError: (err: string | null) => void;
}

const mockUser = getStoredUser();
const mockToken = getToken();

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: mockUser || null,
      isAuthenticated: !!mockToken && !!mockUser,
      books: [],
      currentBook: null,
      isLoadingBooks: false,
      shelves: [],
      currentShelf: null,
      stats: null,
      sharedShelf: null,
      error: null,

      login: async (username, password) => {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          auth: false,
        });
        setToken(res.token);
        setStoredUser(res.user);
        set({ user: res.user, isAuthenticated: true, error: null });
      },

      register: async (username, password, email) => {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, password, email }),
          auth: false,
        });
        setToken(res.token);
        setStoredUser(res.user);
        set({ user: res.user, isAuthenticated: true, error: null });
      },

      logout: () => {
        clearToken();
        set({
          user: null,
          isAuthenticated: false,
          books: [],
          shelves: [],
          stats: null,
          currentBook: null,
          currentShelf: null,
        });
      },

      fetchBooks: async () => {
        set({ isLoadingBooks: true });
        try {
          const data = await apiFetch<Book[]>('/api/books');
          set({ books: data, isLoadingBooks: false });
        } catch (err: any) {
          set({ isLoadingBooks: false, error: err.message });
          throw err;
        }
      },

      fetchBookMetadata: async (isbn: string) => {
        const data = await apiFetch<BookMetadata>(`/api/books?isbn=${encodeURIComponent(isbn)}`, {
          auth: false,
        });
        return data;
      },

      addBook: async (data) => {
        const result = await apiFetch<Book>('/api/books', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        set((state) => ({ books: [result, ...state.books] }));
        return result;
      },

      updateBook: async (id, data) => {
        const result = await apiFetch<Book>(`/api/books/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        set((state) => ({
          books: state.books.map((b) => (b.id === id ? result : b)),
          currentBook: state.currentBook?.id === id ? result : state.currentBook,
        }));
        return result;
      },

      deleteBook: async (id) => {
        await apiFetch(`/api/books/${id}`, { method: 'DELETE' });
        set((state) => ({
          books: state.books.filter((b) => b.id !== id),
          currentBook: state.currentBook?.id === id ? null : state.currentBook,
        }));
      },

      setCurrentBook: (book) => set({ currentBook: book }),

      fetchShelves: async () => {
        const data = await apiFetch<BookShelf[]>('/api/shelves');
        set({ shelves: data });
      },

      createShelf: async (data) => {
        const result = await apiFetch<BookShelf>('/api/shelves', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        set((state) => ({ shelves: [result, ...state.shelves] }));
        return result;
      },

      updateShelf: async (id, data) => {
        const result = await apiFetch<BookShelf>(`/api/shelves/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        set((state) => ({
          shelves: state.shelves.map((s) => (s.id === id ? result : s)),
        }));
        return result;
      },

      deleteShelf: async (id) => {
        await apiFetch(`/api/shelves/${id}`, { method: 'DELETE' });
        set((state) => ({
          shelves: state.shelves.filter((s) => s.id !== id),
          currentShelf: state.currentShelf?.id === id ? null : state.currentShelf,
        }));
      },

      fetchShelfDetail: async (id) => {
        const data: any = await apiFetch(`/api/shelves/${id}`);
        set({ currentShelf: data });
      },

      likeShelf: async (shelfId, fromShare = false) => {
        const res: any = await apiFetch(`/api/shelves/${shelfId}/like`, {
          method: 'POST',
          auth: false,
        });
        if (fromShare) {
          set((state) => ({
            sharedShelf: state.sharedShelf ? { ...state.sharedShelf, likes: res.likes } : null,
          }));
        } else {
          set((state) => ({
            shelves: state.shelves.map((s) => (s.id === shelfId ? { ...s, likes: res.likes } : s)),
            currentShelf: state.currentShelf?.id === shelfId ? { ...state.currentShelf, likes: res.likes } : state.currentShelf,
          }));
        }
      },

      addComment: async (shelfId, username, content, fromShare = false) => {
        const result = await apiFetch<Comment>(`/api/shelves/${shelfId}/comment`, {
          method: 'POST',
          body: JSON.stringify({ username, content }),
          auth: false,
        });
        if (fromShare) {
          set((state) => ({
            sharedShelf: state.sharedShelf
              ? { ...state.sharedShelf, comments: [...state.sharedShelf.comments, result] }
              : null,
          }));
        } else {
          set((state) => ({
            currentShelf: state.currentShelf
              ? { ...state.currentShelf, comments: [...state.currentShelf.comments, result] }
              : state.currentShelf,
          }));
        }
        return result;
      },

      generateShareLink: (shelfId) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(shelfId);
        let binary = '';
        data.forEach((b) => { binary += String.fromCharCode(b); });
        const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return `${window.location.origin}/share/${encoded}`;
      },

      fetchSharedShelf: async (encodedId) => {
        let shelfId = encodedId;
        try {
          shelfId = decodeShareId(encodedId);
        } catch (e) {}
        const data: any = await apiFetch(`/api/shelves/shared/${encodedId}`, {
          auth: false,
        });
        set({ sharedShelf: data });
      },

      fetchStats: async () => {
        const data = await apiFetch<ReadingStats>('/api/stats/reading');
        set({ stats: data });
      },

      setError: (err) => set({ error: err }),
    }),
    {
      name: 'yundong-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

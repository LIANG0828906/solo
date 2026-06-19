import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const updateAuthHeader = (token: string) => {
  api.defaults.headers.Authorization = `Bearer ${token}`;
};

export interface Book {
  id: number;
  title: string;
  author: string;
  subject: string;
  price: number;
  cover_url: string | null;
  user_id: number;
  status: 'available' | 'exchanging' | 'completed';
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  subject: string;
  target_amount: number;
  current_amount: number;
  creator_id: number;
  created_at: string;
  avg_rating?: number;
  rating_count?: number;
  pledged?: boolean;
  user_amount?: number;
  sections?: NoteSection[];
}

export interface NoteSection {
  id: number;
  note_id: number;
  section_title: string;
  content: string;
  position: number;
}

export interface ExchangeRecord {
  id: number;
  book_id: number;
  requester_id: number;
  owner_id: number;
  status: string;
  created_at: string;
  book_title: string;
  requester_name: string;
  owner_name: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
}

interface AppState {
  user: User | null;
  books: Book[];
  myBooks: Book[];
  notes: Note[];
  myNotes: Note[];
  exchanges: ExchangeRecord[];
  setUser: (user: User | null) => void;
  fetchBooks: () => Promise<void>;
  fetchMyBooks: () => Promise<void>;
  fetchNotes: () => Promise<void>;
  fetchMyNotes: () => Promise<void>;
  fetchExchanges: () => Promise<void>;
  addBook: (book: Book) => void;
  updateBook: (book: Book) => void;
  updateNote: (note: Note) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  books: [],
  myBooks: [],
  notes: [],
  myNotes: [],
  exchanges: [],
  setUser: (user) => set({ user }),
  fetchBooks: async () => {
    const res = await api.get('/books');
    set({ books: res.data });
  },
  fetchMyBooks: async () => {
    const res = await api.get('/books/mine');
    set({ myBooks: res.data });
  },
  fetchNotes: async () => {
    const res = await api.get('/notes');
    set({ notes: res.data });
  },
  fetchMyNotes: async () => {
    const res = await api.get('/notes/mine');
    set({ myNotes: res.data });
  },
  fetchExchanges: async () => {
    const res = await api.get('/users/exchanges');
    set({ exchanges: res.data });
  },
  addBook: (book) => set((s) => ({ books: [book, ...s.books], myBooks: [book, ...s.myBooks] })),
  updateBook: (book) =>
    set((s) => ({
      books: s.books.map((b) => (b.id === book.id ? book : b)),
      myBooks: s.myBooks.map((b) => (b.id === book.id ? book : b)),
    })),
  updateNote: (note) =>
    set((s) => ({
      notes: s.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
      myNotes: s.myNotes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
    })),
}));

export { api };

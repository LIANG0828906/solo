import { create } from 'zustand';
import type { User, Book, BookWithDetails, Notification, Review } from '../types';
import { authApi, booksApi, borrowsApi, notificationsApi, reviewsApi, usersApi } from '../api/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  register: async (username: string, email: string, password: string) => {
    const res = await authApi.register(username, email, password);
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    set({ user: res.user, token: res.token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const user = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

interface BooksState {
  books: Book[];
  userBooks: Book[];
  selectedBook: BookWithDetails | null;
  loading: boolean;
  fetchBooks: (params?: Parameters<typeof booksApi.getBooks>[0]) => Promise<void>;
  fetchUserBooks: (userId: string) => Promise<void>;
  fetchBookDetails: (id: string) => Promise<void>;
  addBook: (data: Parameters<typeof booksApi.createBook>[0]) => Promise<Book>;
  clearSelectedBook: () => void;
}

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  userBooks: [],
  selectedBook: null,
  loading: false,

  fetchBooks: async (params) => {
    set({ loading: true });
    try {
      const res = await booksApi.getBooks(params);
      set({ books: res.books });
    } finally {
      set({ loading: false });
    }
  },

  fetchUserBooks: async (userId: string) => {
    set({ loading: true });
    try {
      const books = await booksApi.getUserBooks(userId);
      set({ userBooks: books });
    } finally {
      set({ loading: false });
    }
  },

  fetchBookDetails: async (id: string) => {
    set({ loading: true });
    try {
      const book = await booksApi.getBook(id);
      set({ selectedBook: book });
    } finally {
      set({ loading: false });
    }
  },

  addBook: async (data) => {
    const book = await booksApi.createBook(data);
    set((state) => ({ userBooks: [...state.userBooks, book] }));
    return book;
  },

  clearSelectedBook: () => set({ selectedBook: null }),
}));

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  approveBorrow: (id: string) => Promise<void>;
  rejectBorrow: (id: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const notifications = await notificationsApi.getNotifications();
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      });
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id: string) => {
    await notificationsApi.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.unreadCount > 0 ? state.unreadCount - 1 : 0,
    }));
  },

  markAllAsRead: async () => {
    await notificationsApi.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  approveBorrow: async (borrowId: string) => {
    await borrowsApi.updateBorrow(borrowId, { status: 'approved' });
    const notification = get().notifications.find(
      (n) => n.borrow_id === borrowId
    );
    if (notification) {
      await get().markAsRead(notification.id);
    }
  },

  rejectBorrow: async (borrowId: string) => {
    await borrowsApi.updateBorrow(borrowId, { status: 'rejected' });
    const notification = get().notifications.find(
      (n) => n.borrow_id === borrowId
    );
    if (notification) {
      await get().markAsRead(notification.id);
    }
  },
}));

interface UserProfileState {
  profileUser: User | null;
  userBooks: Book[];
  userReviews: Review[];
  loading: boolean;
  fetchUserProfile: (userId: string) => Promise<void>;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  profileUser: null,
  userBooks: [],
  userReviews: [],
  loading: false,

  fetchUserProfile: async (userId: string) => {
    set({ loading: true });
    try {
      const [user, books, reviews] = await Promise.all([
        usersApi.getUser(userId),
        booksApi.getUserBooks(userId),
        reviewsApi.getUserReviews(userId),
      ]);
      set({ profileUser: user, userBooks: books, userReviews: reviews });
    } finally {
      set({ loading: false });
    }
  },
}));

import { create } from 'zustand';
import type { Book, User, Loan, SearchFilter } from '@shared/types';
import { bookApi, userApi, loanApi } from '@/services/api';
import type { Notification } from '@/services/websocket';
import { websocketService } from '@/services/websocket';

interface StoreState {
  currentUser: User | null;
  books: Book[];
  users: User[];
  loans: Loan[];
  notifications: Notification[];
  searchFilter: SearchFilter;
  loading: {
    books: boolean;
    users: boolean;
    loans: boolean;
    addBook: boolean;
    createLoan: boolean;
    updateLoan: boolean;
    rateUser: boolean;
  };
  error: string | null;
}

interface StoreActions {
  fetchBooks: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchLoans: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'status'>) => Promise<Book | null>;
  createLoan: (loan: Omit<Loan, 'id' | 'status' | 'borrowDate'>) => Promise<Loan | null>;
  updateLoan: (id: string, loan: Partial<Loan>) => Promise<Loan | null>;
  rateUser: (userId: string, rating: number) => Promise<User | null>;
  setSearchFilter: (filter: Partial<SearchFilter>) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearError: () => void;
  initWebSocket: () => void;
}

const defaultSearchFilter: SearchFilter = {
  keyword: '',
  searchBy: 'all',
  status: 'all',
};

const initialLoading: StoreState['loading'] = {
  books: false,
  users: false,
  loans: false,
  addBook: false,
  createLoan: false,
  updateLoan: false,
  rateUser: false,
};

const defaultUser: User = {
  id: 'user-1',
  name: '张三',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
  reputation: 4.5,
  ratingCount: 12,
  ratings: [5, 4, 5, 4, 5, 4, 5, 4, 5, 4, 5, 4],
};

export const useStore = create<StoreState & StoreActions>((set, get) => ({
  currentUser: defaultUser,
  books: [],
  users: [],
  loans: [],
  notifications: [],
  searchFilter: defaultSearchFilter,
  loading: initialLoading,
  error: null,

  fetchBooks: async () => {
    set({ loading: { ...get().loading, books: true }, error: null });
    try {
      const { searchFilter } = get();
      const response = await bookApi.getBooks(searchFilter);
      set({ books: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取图书列表失败' });
    } finally {
      set({ loading: { ...get().loading, books: false } });
    }
  },

  fetchUsers: async () => {
    set({ loading: { ...get().loading, users: true }, error: null });
    try {
      const response = await userApi.getUsers();
      set({ users: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取用户列表失败' });
    } finally {
      set({ loading: { ...get().loading, users: false } });
    }
  },

  fetchLoans: async () => {
    set({ loading: { ...get().loading, loans: true }, error: null });
    try {
      const { currentUser } = get();
      const response = await loanApi.getLoans(currentUser?.id);
      set({ loans: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取借阅记录失败' });
    } finally {
      set({ loading: { ...get().loading, loans: false } });
    }
  },

  addBook: async (book) => {
    set({ loading: { ...get().loading, addBook: true }, error: null });
    try {
      const { currentUser } = get();
      const response = await bookApi.addBook({
        ...book,
        ownerId: currentUser?.id || 'user-1',
      });
      set((state) => ({ books: [...state.books, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '添加图书失败' });
      return null;
    } finally {
      set({ loading: { ...get().loading, addBook: false } });
    }
  },

  createLoan: async (loan) => {
    set({ loading: { ...get().loading, createLoan: true }, error: null });
    try {
      const response = await loanApi.createLoan(loan);
      set((state) => ({ loans: [...state.loans, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建借阅记录失败' });
      return null;
    } finally {
      set({ loading: { ...get().loading, createLoan: false } });
    }
  },

  updateLoan: async (id, loan) => {
    set({ loading: { ...get().loading, updateLoan: true }, error: null });
    try {
      const response = await loanApi.updateLoan(id, loan);
      set((state) => ({
        loans: state.loans.map((l) => (l.id === id ? response.data : l)),
      }));
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新借阅记录失败' });
      return null;
    } finally {
      set({ loading: { ...get().loading, updateLoan: false } });
    }
  },

  rateUser: async (userId, rating) => {
    set({ loading: { ...get().loading, rateUser: true }, error: null });
    try {
      const response = await userApi.rateUser(userId, rating);
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? response.data : u)),
      }));
      return response.data;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '用户评分失败' });
      return null;
    } finally {
      set({ loading: { ...get().loading, rateUser: false } });
    }
  },

  setSearchFilter: (filter) => {
    set((state) => ({
      searchFilter: { ...state.searchFilter, ...filter },
    }));
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  initWebSocket: () => {
    websocketService.connect();
    websocketService.subscribe((notification) => {
      get().addNotification(notification);

      if (notification.type === 'book_added' && notification.data?.book) {
        set((state) => ({
          books: [...state.books, notification.data!.book!],
        }));
      }

      if (notification.type === 'book_updated' && notification.data?.book) {
        set((state) => ({
          books: state.books.map((b) =>
            b.id === notification.data!.book!.id ? notification.data!.book! : b
          ),
        }));
      }

      if (notification.type === 'loan_created' && notification.data?.loan) {
        set((state) => ({
          loans: [...state.loans, notification.data!.loan!],
        }));
      }

      if (notification.type === 'loan_updated' && notification.data?.loan) {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === notification.data!.loan!.id ? notification.data!.loan! : l
          ),
        }));
      }
    });
  },
}));

export default useStore;

import { create } from 'zustand';
import type { User, BoxSeries, Auction, Notification } from '../../shared/types';
import { apiService, DEFAULT_USER_ID } from '../services/api';

interface ToastMsg {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppState {
  user: User | null;
  series: BoxSeries[];
  auctions: Auction[];
  notifications: Notification[];
  toasts: ToastMsg[];
  loading: boolean;

  loadAll: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadSeries: () => Promise<void>;
  loadAuctions: () => Promise<void>;
  loadNotifications: () => Promise<void>;

  addToast: (type: ToastMsg['type'], message: string) => void;
  removeToast: (id: number) => void;
  setBalance: (balance: number) => void;
}

let toastId = 0;

export const useStore = create<AppState>((set, get) => ({
  user: null,
  series: [],
  auctions: [],
  notifications: [],
  toasts: [],
  loading: false,

  loadAll: async () => {
    set({ loading: true });
    try {
      const [user, series, auctions, notifs] = await Promise.all([
        apiService.getUser(),
        apiService.getSeries(),
        apiService.getAuctions(),
        apiService.getNotifications()
      ]);
      set({ user, series, auctions, notifications: notifs, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  loadUser: async () => {
    const u = await apiService.getUser();
    set({ user: u });
  },

  loadSeries: async () => {
    const s = await apiService.getSeries();
    set({ series: s });
  },

  loadAuctions: async () => {
    const a = await apiService.getAuctions();
    set({ auctions: a });
  },

  loadNotifications: async () => {
    const n = await apiService.getNotifications();
    set({ notifications: n });
  },

  addToast: (type, message) => {
    const id = ++toastId;
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().removeToast(id), 3500);
  },

  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },

  setBalance: (balance) => {
    set(s => s.user ? ({ user: { ...s.user, balance } }) : s);
  }
}));

export { DEFAULT_USER_ID };

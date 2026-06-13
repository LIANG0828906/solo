import { create } from 'zustand';
import type { SessionUser, Instrument } from '../types';
import {
  getMe,
  logout as apiLogout,
  getInstruments,
  createInstrument,
  deleteInstrument,
} from '../api/client';

interface StoreState {
  user: SessionUser | null;
  instruments: Instrument[];
  loading: boolean;
  error: string | null;
  setUser: (user: SessionUser | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  fetchInstruments: (params?: Parameters<typeof getInstruments>[0]) => Promise<void>;
  addInstrument: (formData: FormData) => Promise<Instrument>;
  removeInstrument: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  instruments: [],
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getMe();
      set({ user: response.user || null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取用户信息失败' });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await apiLogout();
      set({ user: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '退出登录失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchInstruments: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await getInstruments(params);
      set({ instruments: response.instruments });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取乐器列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  addInstrument: async (formData) => {
    set({ loading: true, error: null });
    try {
      const response = await createInstrument(formData);
      set((state) => ({ instruments: [response.instrument, ...state.instruments] }));
      return response.instrument;
    } catch (err) {
      const message = err instanceof Error ? err.message : '发布乐器失败';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },

  removeInstrument: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteInstrument(id);
      set((state) => ({
        instruments: state.instruments.filter((inst) => inst.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除乐器失败' });
    } finally {
      set({ loading: false });
    }
  },

  setError: (error) => set({ error }),
}));

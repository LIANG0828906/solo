import { create } from 'zustand';
import type { SessionUser, Instrument, InstrumentCategory, GetInstrumentsParams } from '../types';
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
  filterCategory: InstrumentCategory | undefined;
  sortOrder: 'price-asc' | 'price-desc' | undefined;
  searchQuery: string;
  setUser: (user: SessionUser | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  fetchInstruments: (params?: GetInstrumentsParams) => Promise<void>;
  setFilterAndFetch: (filters: { category?: InstrumentCategory; sort?: 'price-asc' | 'price-desc'; search?: string }) => Promise<void>;
  addInstrument: (formData: FormData) => Promise<Instrument>;
  removeInstrument: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  instruments: [],
  loading: false,
  error: null,
  filterCategory: undefined,
  sortOrder: undefined,
  searchQuery: '',

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
      const state = get();
      const requestParams: GetInstrumentsParams = {
        category: params?.category ?? state.filterCategory,
        sort: params?.sort ?? state.sortOrder,
        search: params?.search ?? state.searchQuery,
      };
      const response = await getInstruments(requestParams);
      set({ instruments: response.instruments });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取乐器列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  setFilterAndFetch: async (filters) => {
    const state = get();
    const newCategory = filters.category !== undefined ? filters.category : state.filterCategory;
    const newSort = filters.sort !== undefined ? filters.sort : state.sortOrder;
    const newSearch = filters.search !== undefined ? filters.search : state.searchQuery;

    set({
      filterCategory: newCategory,
      sortOrder: newSort,
      searchQuery: newSearch,
    });

    set({ loading: true, error: null });
    try {
      const response = await getInstruments({
        category: newCategory,
        sort: newSort,
        search: newSearch,
      });
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

import { create } from 'zustand';
import * as T from '@shared/types';
import * as API from '../lib/api';
import { useUIStore } from './uiStore';

interface DishState {
  dishes: T.Dish[];
  currentDish: T.Dish | null;
  tags: { tag: string; count: number }[];
  loading: boolean;
  selectedTag: string | null;
  searchQuery: string;
  loadDishes: (params?: { tag?: string; userId?: string; q?: string }) => Promise<void>;
  loadTags: () => Promise<void>;
  selectDish: (id: string) => Promise<void>;
  createDish: (payload: Omit<T.Dish, 'id' | 'likes' | 'commentCount' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDish: (id: string, payload: Partial<Omit<T.Dish, 'id'>>) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  currentDish: null,
  tags: [],
  loading: false,
  selectedTag: null,
  searchQuery: '',

  loadDishes: async (params) => {
    set({ loading: true });
    try {
      const dishes = await API.listDishes(params);
      set({ dishes });
    } finally {
      set({ loading: false });
    }
  },

  loadTags: async () => {
    try {
      const tags = await API.listTags();
      set({ tags });
    } catch {}
  },

  selectDish: async (id: string) => {
    set({ loading: true });
    try {
      const dish = await API.getDish(id);
      set({ currentDish: dish });
    } finally {
      set({ loading: false });
    }
  },

  createDish: async (payload) => {
    const created = await API.createDish(payload);
    set((state) => ({ dishes: [created, ...state.dishes] }));
    useUIStore.getState().pushToast('发布成功', 'info');
  },

  updateDish: async (id: string, payload) => {
    const updated = await API.updateDish(id, payload);
    set((state) => ({
      dishes: state.dishes.map((d) => (d.id === id ? updated : d)),
      currentDish: state.currentDish && state.currentDish.id === id ? updated : state.currentDish,
    }));
  },

  deleteDish: async (id: string) => {
    await API.deleteDish(id);
    set((state) => ({
      dishes: state.dishes.filter((d) => d.id !== id),
      currentDish: state.currentDish && state.currentDish.id === id ? null : state.currentDish,
    }));
  },

  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
  },
}));

import { create } from 'zustand';
import type { Toast, ToastType } from '../types';

const FAVORITES_KEY = 'recipe_favorites';

interface StoreState {
  favorites: string[];
  toasts: Toast[];
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  favoriteCount: number;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const loadFavorites = (): string[] => {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites: string[]) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    console.error('Failed to save favorites');
  }
};

export const useStore = create<StoreState>((set, get) => ({
  favorites: loadFavorites(),
  toasts: [],

  addFavorite: (id: string) => {
    const { favorites } = get();
    if (!favorites.includes(id)) {
      const newFavorites = [...favorites, id];
      set({ favorites: newFavorites });
      saveFavorites(newFavorites);
    }
  },

  removeFavorite: (id: string) => {
    const { favorites } = get();
    const newFavorites = favorites.filter((fid) => fid !== id);
    set({ favorites: newFavorites });
    saveFavorites(newFavorites);
  },

  isFavorite: (id: string) => {
    return get().favorites.includes(id);
  },

  get favoriteCount() {
    return get().favorites.length;
  },

  showToast: (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const toast: Toast = { id, type, message };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => {
      get().hideToast(id);
    }, 3000);
  },

  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

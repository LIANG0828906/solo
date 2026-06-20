import { create } from 'zustand';

export interface StarParams {
  mass: number;
  age: number;
  metallicity: number;
}

export interface FavoriteItem {
  id: string;
  name: string;
  timestamp: number;
  params: StarParams;
  starColor: string;
}

interface StarStore {
  params: StarParams;
  favorites: FavoriteItem[];
  isLoading: boolean;
  setParams: (p: Partial<StarParams>) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  loadFavorite: (id: string) => void;
}

const STORAGE_KEY = 'stardust_favorites';
const MAX_FAVORITES = 12;

const loadFavorites = (): FavoriteItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
};

const saveFavorites = (favorites: FavoriteItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    // ignore
  }
};

export const useStore = create<StarStore>((set, get) => ({
  params: {
    mass: 1.0,
    age: 4600000000,
    metallicity: 0.02
  },
  favorites: loadFavorites(),
  isLoading: false,

  setParams: (p) => set({ params: { ...get().params, ...p } }),

  addFavorite: (item) => {
    const current = get().favorites;
    let next: FavoriteItem[];
    if (current.length >= MAX_FAVORITES) {
      next = [...current.slice(1), item];
    } else {
      next = [...current, item];
    }
    saveFavorites(next);
    set({ favorites: next });
  },

  removeFavorite: (id) => {
    const next = get().favorites.filter((f) => f.id !== id);
    saveFavorites(next);
    set({ favorites: next });
  },

  loadFavorite: (id) => {
    const item = get().favorites.find((f) => f.id === id);
    if (item) {
      set({ params: { ...item.params } });
    }
  }
}));

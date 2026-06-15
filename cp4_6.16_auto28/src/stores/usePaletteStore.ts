import { create } from 'zustand';
import {
  loadFavorites as loadFavoritesFromDB,
  saveFavorites as saveFavoritesToDB,
  updatePaletteFavoriteCount,
} from '@/utils/indexedDB';
import type { PaletteStore } from '@/types';

const DEFAULT_COLORS = ['#6c63ff', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

export const usePaletteStore = create<PaletteStore>((set, get) => ({
  currentColors: DEFAULT_COLORS,
  favorites: [],
  sortBy: 'popular',

  setCurrentColors: (colors: string[]) => {
    set({ currentColors: colors });
  },

  setColor: (index: number, color: string) => {
    const { currentColors } = get();
    const newColors = [...currentColors];
    newColors[index] = color;
    set({ currentColors: newColors });
  },

  toggleFavorite: async (id: string) => {
    const { favorites } = get();
    const isFavorited = favorites.includes(id);
    const newFavorites = isFavorited
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];

    set({ favorites: newFavorites });
    await saveFavoritesToDB(newFavorites);
    await updatePaletteFavoriteCount(id, !isFavorited);
  },

  setSortBy: (sort: 'popular' | 'latest') => {
    set({ sortBy: sort });
  },

  loadFavorites: async () => {
    const favorites = await loadFavoritesFromDB();
    set({ favorites });
  },
}));

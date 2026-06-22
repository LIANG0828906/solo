import { create } from 'zustand';
import {
  loadFavorites as loadFavoritesFromDB,
  saveFavorites as saveFavoritesToDB,
  updatePaletteFavoriteCount,
} from '@/utils/indexedDB';
import type { PaletteStore } from '@/types';

const DEFAULT_COLORS = ['#6c63ff', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delay);
  };
}

export const usePaletteStore = create<PaletteStore>((set, get) => {
  let lastPersistedFavorites: string[] = [];

  const persistFavorites = async () => {
    const currentFavorites = get().favorites;

    const addedIds = currentFavorites.filter(
      (id) => !lastPersistedFavorites.includes(id)
    );
    const removedIds = lastPersistedFavorites.filter(
      (id) => !currentFavorites.includes(id)
    );

    await saveFavoritesToDB(currentFavorites);

    for (const id of addedIds) {
      await updatePaletteFavoriteCount(id, true);
    }
    for (const id of removedIds) {
      await updatePaletteFavoriteCount(id, false);
    }

    lastPersistedFavorites = [...currentFavorites];
  };

  const debouncedPersist = debounce(persistFavorites, 300);

  return {
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
      debouncedPersist();
    },

    setSortBy: (sort: 'popular' | 'latest') => {
      set({ sortBy: sort });
    },

    loadFavorites: async () => {
      const favorites = await loadFavoritesFromDB();
      set({ favorites });
      lastPersistedFavorites = [...favorites];
    },
  };
});

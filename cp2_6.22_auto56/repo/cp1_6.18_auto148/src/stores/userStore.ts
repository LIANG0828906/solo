import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GradientScheme } from '@/types';

interface UserState {
  favorites: GradientScheme[];
  addFavorite: (scheme: GradientScheme) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (scheme: GradientScheme) => {
        const { favorites } = get();
        const exists = favorites.some(f => f.id === scheme.id);
        if (!exists) {
          set({ favorites: [...favorites, scheme] });
        }
      },
      removeFavorite: (id: string) => {
        set(state => ({
          favorites: state.favorites.filter(f => f.id !== id),
        }));
      },
      isFavorite: (id: string) => {
        return get().favorites.some(f => f.id === id);
      },
    }),
    {
      name: 'gradient-echo-favorites',
    }
  )
);

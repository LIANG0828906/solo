import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HSL } from '../utils/colorEngine';

export interface FavoriteColor {
  id: string;
  primary: HSL;
  secondary: HSL;
  createdAt: number;
}

interface AuraState {
  auraColor: { primary: HSL; secondary: HSL } | null;
  favorites: FavoriteColor[];
  locked: boolean;
  setAuraColor: (color: { primary: HSL; secondary: HSL }) => void;
  addFavorite: (color: { primary: HSL; secondary: HSL }) => void;
  removeFavorite: (id: string) => void;
  applyFavorite: (color: { primary: HSL; secondary: HSL }) => void;
  unlockAura: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const useAuraStore = create<AuraState>()(
  persist(
    (set, get) => ({
      auraColor: null,
      favorites: [],
      locked: false,
      setAuraColor: (color) => {
        if (!get().locked) {
          set({ auraColor: color });
        }
      },
      addFavorite: (color) => {
        const newFav: FavoriteColor = {
          id: generateId(),
          primary: color.primary,
          secondary: color.secondary,
          createdAt: Date.now(),
        };
        set({ favorites: [newFav, ...get().favorites] });
      },
      removeFavorite: (id) => {
        set({ favorites: get().favorites.filter((f) => f.id !== id) });
      },
      applyFavorite: (color) => {
        set({ auraColor: color, locked: true });
      },
      unlockAura: () => {
        set({ locked: false });
      },
    }),
    {
      name: 'aura-favorites-storage',
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);

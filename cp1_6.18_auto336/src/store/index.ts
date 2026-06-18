import { create } from 'zustand';
import type { Letter } from '@/types';

interface LetterState {
  letters: Letter[];
  tag: string | null;
  favorites: Set<number>;
  loading: boolean;
  nextCursor: number | null;
  hasMore: boolean;

  setLetters: (letters: Letter[], nextCursor: number | null, hasMore: boolean) => void;
  addLetters: (letters: Letter[], nextCursor: number | null, hasMore: boolean) => void;
  toggleFavorite: (letterId: number, newCount: number) => void;
  setTag: (tag: string | null) => void;
  setLoading: (loading: boolean) => void;
  initFavorites: (ids: number[]) => void;
}

export const useLetterStore = create<LetterState>((set) => ({
  letters: [],
  tag: null,
  favorites: new Set(),
  loading: false,
  nextCursor: null,
  hasMore: true,

  setLetters: (letters, nextCursor, hasMore) =>
    set({ letters, nextCursor, hasMore }),

  addLetters: (letters, nextCursor, hasMore) =>
    set((state) => ({
      letters: [...state.letters, ...letters],
      nextCursor,
      hasMore,
    })),

  toggleFavorite: (letterId, newCount) =>
    set((state) => {
      const newFavorites = new Set(state.favorites);
      const isFavorited = newFavorites.has(letterId);
      if (isFavorited) {
        newFavorites.delete(letterId);
      } else {
        newFavorites.add(letterId);
      }
      return {
        favorites: newFavorites,
        letters: state.letters.map((l) =>
          l.id === letterId ? { ...l, favoritesCount: newCount } : l
        ),
      };
    }),

  setTag: (tag) => set({ tag }),

  setLoading: (loading) => set({ loading }),

  initFavorites: (ids) => set({ favorites: new Set(ids) }),
}));

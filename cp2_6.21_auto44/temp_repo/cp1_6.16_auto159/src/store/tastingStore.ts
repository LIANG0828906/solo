import { create } from 'zustand';
import { Tasting, getTastings } from '../api/tea';

interface TastingState {
  tastings: Tasting[];
  loading: boolean;
  error: string | null;
  fetchTastings: () => Promise<void>;
}

export const useTastingStore = create<TastingState>((set) => ({
  tastings: [],
  loading: false,
  error: null,
  fetchTastings: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getTastings();
      set({ tastings: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));

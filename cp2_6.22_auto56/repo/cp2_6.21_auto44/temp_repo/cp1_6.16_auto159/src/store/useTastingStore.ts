import { create } from 'zustand';
import { Tasting, getTastings as fetchTastingsApi, addTasting as addTastingApi } from '../api/tea';

interface TastingState {
  tastings: Tasting[];
  loading: boolean;
  error: string | null;
  fetchTastings: () => Promise<void>;
  addTasting: (tasting: Omit<Tasting, 'id' | 'createTime'>) => Promise<Tasting>;
  getTastingById: (id: string) => Tasting | undefined;
}

export const useTastingStore = create<TastingState>((set, get) => ({
  tastings: [],
  loading: false,
  error: null,

  fetchTastings: async () => {
    set({ loading: true, error: null });
    try {
      const data = await fetchTastingsApi();
      set({ tastings: data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch tastings', loading: false });
    }
  },

  addTasting: async (tasting) => {
    set({ loading: true, error: null });
    try {
      const newTasting = await addTastingApi(tasting);
      set((state) => ({ tastings: [...state.tastings, newTasting], loading: false }));
      return newTasting;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to add tasting', loading: false });
      throw err;
    }
  },

  getTastingById: (id) => {
    return get().tastings.find((t) => t.id === id);
  },
}));

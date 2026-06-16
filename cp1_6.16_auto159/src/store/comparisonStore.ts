import { create } from 'zustand';
import { Tasting } from '../api/tea';

interface ComparisonState {
  comparisonList: Tasting[];
  addToComparison: (tasting: Tasting) => void;
  removeFromComparison: (id: string) => void;
  toggleComparison: (tasting: Tasting) => void;
  isInComparison: (id: string) => boolean;
  clearComparison: () => void;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  comparisonList: [],
  addToComparison: (tasting) => {
    const { comparisonList } = get();
    if (!comparisonList.find((t) => t.id === tasting.id)) {
      set({ comparisonList: [...comparisonList, tasting] });
    }
  },
  removeFromComparison: (id) => {
    const { comparisonList } = get();
    set({ comparisonList: comparisonList.filter((t) => t.id !== id) });
  },
  toggleComparison: (tasting) => {
    const { comparisonList } = get();
    const exists = comparisonList.find((t) => t.id === tasting.id);
    if (exists) {
      set({ comparisonList: comparisonList.filter((t) => t.id !== tasting.id) });
    } else {
      set({ comparisonList: [...comparisonList, tasting] });
    }
  },
  isInComparison: (id) => {
    const { comparisonList } = get();
    return comparisonList.some((t) => t.id === id);
  },
  clearComparison: () => {
    set({ comparisonList: [] });
  },
}));

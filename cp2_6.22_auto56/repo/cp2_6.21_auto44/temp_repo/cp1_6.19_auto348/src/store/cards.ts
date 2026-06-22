import { create } from 'zustand';
import type { Card, ThemeKey } from '@/types';

interface CardStore {
  cards: Card[];
  selectedCardId: string | null;
  isEditorOpen: boolean;
  isExporting: boolean;
  exportProgress: number;
  currentExportIndex: number;
  keyword: string;
  setCards: (cards: Card[]) => void;
  updateCard: (id: string, patch: Partial<Pick<Card, 'text' | 'imageUrl' | 'theme'>>) => void;
  reorderCards: (fromIdx: number, toIdx: number) => void;
  openEditor: (id: string) => void;
  closeEditor: () => void;
  setExporting: (val: boolean) => void;
  setExportProgress: (n: number) => void;
  setCurrentExportIndex: (n: number) => void;
  setKeyword: (k: string) => void;
}

const initialState: Partial<CardStore> = {
  cards: [],
  selectedCardId: null,
  isEditorOpen: false,
  isExporting: false,
  exportProgress: 0,
  currentExportIndex: -1,
  keyword: '',
};

export const useCardStore = create<CardStore>((set, get) => ({
  ...(initialState as CardStore),

  setCards: (cards) => set({ cards }),

  updateCard: (id, patch) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  reorderCards: (fromIdx, toIdx) =>
    set((state) => {
      const list = [...state.cards];
      const [removed] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, removed);
      return { cards: list };
    }),

  openEditor: (id) => set({ selectedCardId: id, isEditorOpen: true }),
  closeEditor: () => set({ selectedCardId: null, isEditorOpen: false }),

  setExporting: (val) => set({ isExporting: val }),
  setExportProgress: (n) => set({ exportProgress: n }),
  setCurrentExportIndex: (n) => set({ currentExportIndex: n }),

  setKeyword: (k) => set({ keyword: k }),
}));

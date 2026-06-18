import { create } from 'zustand';
import type { Card, GraphData, ViewMode, SelectedGroup, TagInfo } from './types';

interface HiveStore {
  cards: Card[];
  graphData: GraphData | null;
  cardRelationCounts: Record<string, number>;
  tags: TagInfo[];
  viewMode: ViewMode;
  selectedCard: Card | null;
  isPanelOpen: boolean;
  editingCard: Card | null;
  selectedNodeIds: string[];
  selectedGroup: SelectedGroup | null;
  loading: boolean;

  setViewMode: (mode: ViewMode) => void;
  openNewPanel: () => void;
  openEditPanel: (card: Card) => void;
  closePanel: () => void;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  setGraphData: (data: GraphData, counts: Record<string, number>) => void;
  setTags: (tags: TagInfo[]) => void;
  toggleNodeSelection: (id: string, ctrl: boolean) => void;
  clearNodeSelection: () => void;
  setSelectedGroup: (group: SelectedGroup | null) => void;
  setLoading: (v: boolean) => void;
}

export const useHiveStore = create<HiveStore>((set, get) => ({
  cards: [],
  graphData: null,
  cardRelationCounts: {},
  tags: [],
  viewMode: 'honeycomb',
  selectedCard: null,
  isPanelOpen: false,
  editingCard: null,
  selectedNodeIds: [],
  selectedGroup: null,
  loading: false,

  setViewMode: (mode) => {
    set({ viewMode: mode });
    if (mode === 'graph') {
      get().clearNodeSelection();
      get().setSelectedGroup(null);
    }
  },
  openNewPanel: () => set({ isPanelOpen: true, editingCard: null }),
  openEditPanel: (card) => set({ isPanelOpen: true, editingCard: card }),
  closePanel: () => set({ isPanelOpen: false, editingCard: null }),
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((s) => ({ cards: [card, ...s.cards] })),
  updateCard: (card) => set((s) => ({
    cards: s.cards.map(c => c.id === card.id ? card : c),
  })),
  deleteCard: (id) => set((s) => ({
    cards: s.cards.filter(c => c.id !== id),
  })),
  setGraphData: (data, counts) => set({ graphData: data, cardRelationCounts: counts }),
  setTags: (tags) => set({ tags }),
  toggleNodeSelection: (id, ctrl) => set((s) => {
    if (ctrl) {
      const exists = s.selectedNodeIds.includes(id);
      return {
        selectedNodeIds: exists
          ? s.selectedNodeIds.filter(i => i !== id)
          : [...s.selectedNodeIds, id],
      };
    }
    return { selectedNodeIds: [id] };
  }),
  clearNodeSelection: () => set({ selectedNodeIds: [] }),
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  setLoading: (v) => set({ loading: v }),
}));

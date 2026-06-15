import { create } from 'zustand';
import {
  Card,
  GraphData,
  fetchCards,
  fetchGraphData,
  fetchTags,
  fetchRecommendations,
  createCard as apiCreateCard,
  updateCard as apiUpdateCard,
  deleteCard as apiDeleteCard,
  createEdge as apiCreateEdge,
} from './api';

interface KnowledgeStore {
  cards: Card[];
  graphData: GraphData | null;
  tags: string[];
  selectedTag: string | null;
  recommendations: Card[];
  loading: boolean;
  loadCards: () => Promise<void>;
  loadGraphData: () => Promise<void>;
  loadTags: () => Promise<void>;
  setSelectedTag: (tag: string | null) => void;
  addCard: (data: Omit<Card, 'id' | 'createdAt'>) => Promise<Card>;
  editCard: (id: string, data: Partial<Omit<Card, 'id' | 'createdAt'>>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  loadRecommendations: (id: string) => Promise<void>;
  addEdge: (source: string, target: string, weight: number) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  cards: [],
  graphData: null,
  tags: [],
  selectedTag: null,
  recommendations: [],
  loading: false,

  loadCards: async () => {
    set({ loading: true });
    try {
      const cards = await fetchCards();
      set({ cards });
    } finally {
      set({ loading: false });
    }
  },

  loadGraphData: async () => {
    const graphData = await fetchGraphData();
    set({ graphData });
  },

  loadTags: async () => {
    const tags = await fetchTags();
    set({ tags });
  },

  setSelectedTag: (tag) => set({ selectedTag: tag }),

  addCard: async (data) => {
    const card = await apiCreateCard(data);
    set((s) => ({ cards: [...s.cards, card] }));
    get().loadGraphData();
    get().loadTags();
    return card;
  },

  editCard: async (id, data) => {
    const updated = await apiUpdateCard(id, data);
    set((s) => ({
      cards: s.cards.map((c) => (c.id === id ? updated : c)),
    }));
    get().loadGraphData();
    get().loadTags();
  },

  removeCard: async (id) => {
    await apiDeleteCard(id);
    set((s) => ({
      cards: s.cards.filter((c) => c.id !== id),
    }));
    get().loadGraphData();
    get().loadTags();
  },

  loadRecommendations: async (id) => {
    const recommendations = await fetchRecommendations(id);
    set({ recommendations });
  },

  addEdge: async (source, target, weight) => {
    await apiCreateEdge(source, target, weight);
    get().loadGraphData();
    get().loadTags();
  },
}));

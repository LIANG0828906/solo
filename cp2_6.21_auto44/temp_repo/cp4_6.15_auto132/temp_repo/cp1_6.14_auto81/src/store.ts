import { create } from 'zustand';
import type { Card, Category } from '@/types';
import * as api from '@/api';

interface AppState {
  cards: Card[];
  dueCards: Card[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: Category | 'all';
  loadCards: () => Promise<void>;
  loadDueCards: () => Promise<void>;
  addCard: (data: Partial<Card>) => Promise<Card>;
  editCard: (id: string, data: Partial<Card>) => Promise<Card>;
  removeCard: (id: string) => Promise<void>;
  reviewCard: (id: string, memoryLevel: 'forgot' | 'hard' | 'normal' | 'easy') => Promise<void>;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: Category | 'all') => void;
}

export const useStore = create<AppState>((set, get) => ({
  cards: [],
  dueCards: [],
  loading: false,
  searchQuery: '',
  selectedCategory: 'all',

  loadCards: async () => {
    set({ loading: true });
    try {
      const { searchQuery, selectedCategory } = get();
      const cards = await api.fetchCards(searchQuery, selectedCategory);
      set({ cards });
    } finally {
      set({ loading: false });
    }
  },

  loadDueCards: async () => {
    try {
      const dueCards = await api.fetchDueCards();
      set({ dueCards });
    } catch {
      set({ dueCards: [] });
    }
  },

  addCard: async (data) => {
    const card = await api.createCard(data);
    await get().loadCards();
    await get().loadDueCards();
    return card;
  },

  editCard: async (id, data) => {
    const card = await api.updateCard(id, data);
    await get().loadCards();
    await get().loadDueCards();
    return card;
  },

  removeCard: async (id) => {
    await api.deleteCard(id);
    await get().loadCards();
    await get().loadDueCards();
  },

  reviewCard: async (id, memoryLevel) => {
    await api.reviewCard(id, memoryLevel);
    await get().loadDueCards();
    await get().loadCards();
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
  },

  setSelectedCategory: (c) => {
    set({ selectedCategory: c });
  },
}));

import { create } from 'zustand';
import type { Card, Stats } from '../types';
import { api } from '../api';

interface CardState {
  cards: Card[];
  stats: Stats | null;
  loading: boolean;
  fetchCards: () => Promise<void>;
  createCard: (data: {
    question: string;
    answer: string;
    category: string;
    difficulty: number;
  }) => Promise<Card>;
  deleteCard: (id: string) => Promise<void>;
  updateCardReview: (id: string, remembered: boolean) => Promise<Card>;
  fetchStats: () => Promise<void>;
  getDueCards: () => Promise<Card[]>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  stats: null,
  loading: false,

  fetchCards: async () => {
    set({ loading: true });
    try {
      const cards = await api.getCards();
      set({ cards, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Failed to fetch cards:', error);
    }
  },

  createCard: async (data) => {
    const newCard = await api.createCard(data);
    set((state) => ({ cards: [newCard, ...state.cards] }));
    return newCard;
  },

  deleteCard: async (id) => {
    await api.deleteCard(id);
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    }));
  },

  updateCardReview: async (id, remembered) => {
    const updatedCard = await api.updateCardReview(id, remembered);
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? updatedCard : c)),
    }));
    return updatedCard;
  },

  fetchStats: async () => {
    try {
      const stats = await api.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  getDueCards: async () => {
    return await api.getDueCards();
  },
}));

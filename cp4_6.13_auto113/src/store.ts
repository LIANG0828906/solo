import { create } from 'zustand';
import { Card, loadCards, saveCard as persistCard, deleteCard as removeCard } from '@/utils/storage';

interface AppState {
  cards: Card[];
  selectedTag: string | null;
  searchQuery: string;

  load: () => void;
  addCard: (card: Card) => void;
  updateCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  getFilteredCards: () => Card[];
}

export const useStore = create<AppState>((set, get) => ({
  cards: [],
  selectedTag: null,
  searchQuery: '',

  load: () => {
    set({ cards: loadCards() });
  },

  addCard: (card) => {
    persistCard(card);
    set({ cards: loadCards() });
  },

  updateCard: (card) => {
    persistCard(card);
    set({ cards: loadCards() });
  },

  deleteCard: (id) => {
    removeCard(id);
    set({ cards: loadCards() });
  },

  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  getFilteredCards: () => {
    const { cards, selectedTag, searchQuery } = get();
    let filtered = cards;

    if (selectedTag) {
      filtered = filtered.filter((c) => c.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q)
      );
    }

    return filtered;
  },
}));

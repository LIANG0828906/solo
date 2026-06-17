import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Card, CardCollection, FilterState } from '../types/card';
import { DEFAULT_COLOR, CARD_WIDTH, CARD_GAP } from '../types/card';

interface CardStore {
  cards: Card[];
  collections: CardCollection[];
  filter: FilterState;
  selectedCardIds: string[];
  editingCardId: string | null;

  addCard: (data: Omit<Card, 'id' | 'x' | 'y' | 'createdAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  updateCardPosition: (id: string, x: number, y: number) => void;
  batchUpdateCardPositions: (updates: { id: string; x: number; y: number }[]) => void;

  filterByKeyword: (keyword: string) => void;
  filterByColor: (color: string | null) => void;
  clearFilters: () => void;
  getFilteredCards: () => Card[];

  toggleCardSelection: (id: string) => void;
  clearSelection: () => void;
  packCards: (name: string, cardIds: string[]) => void;
  deleteCollection: (id: string) => void;
  getCollections: () => CardCollection[];

  setEditingCard: (id: string | null) => void;
  getNextCardPosition: () => { x: number; y: number };
}

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  collections: [],
  filter: {
    keyword: '',
    color: null,
  },
  selectedCardIds: [],
  editingCardId: null,

  addCard: (data) => {
    const { x, y } = get().getNextCardPosition();
    const newCard: Card = {
      ...data,
      id: uuidv4(),
      x,
      y,
      createdAt: Date.now(),
    };
    set((state) => ({
      cards: [...state.cards, newCard],
    }));
  },

  updateCard: (id, updates) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    }));
  },

  deleteCard: (id) => {
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
      selectedCardIds: state.selectedCardIds.filter((sid) => sid !== id),
      editingCardId: state.editingCardId === id ? null : state.editingCardId,
    }));
  },

  updateCardPosition: (id, x, y) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, x, y } : card
      ),
    }));
  },

  batchUpdateCardPositions: (updates) => {
    set((state) => {
      const positionMap = new Map(updates.map((u) => [u.id, { x: u.x, y: u.y }]));
      return {
        cards: state.cards.map((card) => {
          const pos = positionMap.get(card.id);
          return pos ? { ...card, ...pos } : card;
        }),
      };
    });
  },

  filterByKeyword: (keyword) => {
    set((state) => ({
      filter: { ...state.filter, keyword },
    }));
  },

  filterByColor: (color) => {
    set((state) => ({
      filter: { ...state.filter, color },
    }));
  },

  clearFilters: () => {
    set({
      filter: { keyword: '', color: null },
    });
  },

  getFilteredCards: () => {
    const { cards, filter } = get();
    return cards.filter((card) => {
      if (filter.keyword) {
        const keyword = filter.keyword.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(keyword);
        const matchesBody = card.body.toLowerCase().includes(keyword);
        const matchesKeywords = card.keywords.some((k) =>
          k.toLowerCase().includes(keyword)
        );
        if (!matchesTitle && !matchesBody && !matchesKeywords) {
          return false;
        }
      }
      if (filter.color && card.color !== filter.color) {
        return false;
      }
      return true;
    });
  },

  toggleCardSelection: (id) => {
    set((state) => ({
      selectedCardIds: state.selectedCardIds.includes(id)
        ? state.selectedCardIds.filter((sid) => sid !== id)
        : [...state.selectedCardIds, id],
    }));
  },

  clearSelection: () => {
    set({ selectedCardIds: [] });
  },

  packCards: (name, cardIds) => {
    if (cardIds.length === 0) return;
    const newCollection: CardCollection = {
      id: uuidv4(),
      name,
      cardIds,
      createdAt: Date.now(),
    };
    set((state) => ({
      collections: [...state.collections, newCollection],
      selectedCardIds: [],
    }));
  },

  deleteCollection: (id) => {
    set((state) => ({
      collections: state.collections.filter((col) => col.id !== id),
    }));
  },

  getCollections: () => {
    return get().collections;
  },

  setEditingCard: (id) => {
    set({ editingCardId: id });
  },

  getNextCardPosition: () => {
    const { cards } = get();
    if (cards.length === 0) {
      return { x: 100, y: 100 };
    }

    const sortedCards = [...cards].sort(
      (a, b) => b.createdAt - a.createdAt
    );
    const lastCard = sortedCards[0];

    const canvasPadding = 100;
    const maxCardsPerRow = Math.max(
      1,
      Math.floor((window.innerWidth - canvasPadding * 2) / (CARD_WIDTH + CARD_GAP))
    );
    const currentIndex = cards.length;
    const row = Math.floor(currentIndex / maxCardsPerRow);
    const col = currentIndex % maxCardsPerRow;

    return {
      x: canvasPadding + col * (CARD_WIDTH + CARD_GAP),
      y: canvasPadding + row * (200 + CARD_GAP),
    };
  },
}));

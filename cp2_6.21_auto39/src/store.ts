import { create } from 'zustand';
import type { Card, HistoryAction } from './types';
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
} from './api';

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface StoreState {
  cards: Card[];
  selectedColors: string[];
  searchKeyword: string;
  selectedCardId: number | null;
  zoom: number;
  pan: { x: number; y: number };
  history: HistoryAction[];
  historyIndex: number;
  fetchCards: () => Promise<void>;
  addCard: (card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeCard: (id: number) => Promise<void>;
  moveCard: (id: number, x: number, y: number) => void;
  editCard: (id: number, data: Partial<Card>) => Promise<void>;
  toggleColorFilter: (color: string) => void;
  setSearchKeyword: (keyword: string) => void;
  selectCard: (id: number | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  undo: () => void;
  getFilteredCards: () => Card[];
}

const saveToHistory = (
  state: StoreState,
  type: HistoryAction['type']
): { history: HistoryAction[]; historyIndex: number } => {
  const previousState = [...state.cards];
  const newAction: HistoryAction = {
    type,
    previousState,
    timestamp: Date.now(),
  };
  const newHistory = [...state.history.slice(0, state.historyIndex + 1), newAction];
  const trimmedHistory = newHistory.slice(-5);
  return {
    history: trimmedHistory,
    historyIndex: trimmedHistory.length - 1,
  };
};

const debouncedUpdateCard = debounce(
  async (id: number, data: Partial<Card>) => {
    try {
      await updateCard(id, data);
    } catch (error) {
      console.error('Failed to update card position:', error);
    }
  },
  1000
);

export const useStore = create<StoreState>((set, get) => ({
  cards: [],
  selectedColors: [],
  searchKeyword: '',
  selectedCardId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  history: [],
  historyIndex: -1,

  fetchCards: async () => {
    try {
      const cards = await getCards();
      set({ cards });
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  },

  addCard: async (card) => {
    const state = get();
    const historyData = saveToHistory(state, 'add');
    try {
      const newCard = await createCard(card);
      set({
        cards: [...state.cards, newCard],
        ...historyData,
      });
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  },

  removeCard: async (id) => {
    const state = get();
    const historyData = saveToHistory(state, 'delete');
    try {
      await deleteCard(id);
      set({
        cards: state.cards.filter((c) => c.id !== id),
        ...historyData,
      });
    } catch (error) {
      console.error('Failed to remove card:', error);
    }
  },

  moveCard: (id, x, y) => {
    const state = get();
    const historyData = saveToHistory(state, 'move');
    const updatedCards = state.cards.map((card) =>
      card.id === id ? { ...card, x, y } : card
    );
    set({
      cards: updatedCards,
      ...historyData,
    });
    debouncedUpdateCard(id, { x, y });
  },

  editCard: async (id, data) => {
    const state = get();
    const historyData = saveToHistory(state, 'edit');
    try {
      const updatedCard = await updateCard(id, data);
      set({
        cards: state.cards.map((card) =>
          card.id === id ? updatedCard : card
        ),
        ...historyData,
      });
    } catch (error) {
      console.error('Failed to edit card:', error);
    }
  },

  toggleColorFilter: (color) => {
    const state = get();
    const isSelected = state.selectedColors.includes(color);
    set({
      selectedColors: isSelected
        ? state.selectedColors.filter((c) => c !== color)
        : [...state.selectedColors, color],
    });
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  selectCard: (id) => {
    set({ selectedCardId: id });
  },

  setZoom: (zoom) => {
    const clampedZoom = Math.max(0.5, Math.min(2, zoom));
    set({ zoom: clampedZoom });
  },

  setPan: (x, y) => {
    set({ pan: { x, y } });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex >= 0) {
      const action = state.history[state.historyIndex];
      set({
        cards: [...action.previousState],
        historyIndex: state.historyIndex - 1,
      });
    }
  },

  getFilteredCards: () => {
    const state = get();
    return state.cards.filter((card) => {
      if (
        state.selectedColors.length > 0 &&
        !state.selectedColors.includes(card.color)
      ) {
        return false;
      }
      if (state.searchKeyword) {
        const keyword = state.searchKeyword.toLowerCase();
        return (
          card.title.toLowerCase().includes(keyword) ||
          card.content.toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  },
}));

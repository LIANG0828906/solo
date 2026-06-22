import { create } from 'zustand';
import type { Card } from '../types';

interface StoreState {
  cards: Card[];
  currentCard: Card | null;
  isFormOpen: boolean;
  isGraphOpen: boolean;
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (id: number, card: Partial<Card>) => void;
  deleteCard: (id: number) => void;
  setCurrentCard: (card: Card | null) => void;
  setIsFormOpen: (isOpen: boolean) => void;
  setIsGraphOpen: (isOpen: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  cards: [],
  currentCard: null,
  isFormOpen: false,
  isGraphOpen: false,
  setCards: (cards) => set({ cards }),
  addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
  updateCard: (id, card) =>
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...card } : c)),
    })),
  deleteCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== id),
    })),
  setCurrentCard: (card) => set({ currentCard: card }),
  setIsFormOpen: (isOpen) => set({ isFormOpen: isOpen }),
  setIsGraphOpen: (isOpen) => set({ isGraphOpen: isOpen }),
}));

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type CardType = 'text' | 'image' | 'voice' | 'todo';

export interface CardPosition {
  x: number;
  y: number;
}

export interface Card {
  id: string;
  type: CardType;
  content: string;
  position: CardPosition;
  rotation: number;
  imageUrl?: string;
  audioUrl?: string;
  checked?: boolean;
  isNew?: boolean;
}

export interface CardStoreState {
  cards: Card[];
  gridEnabled: boolean;
  zoom: number;
}

export interface CardStoreActions {
  addCard: (card: Omit<Card, 'id' | 'isNew'>) => void;
  removeCard: (id: string) => void;
  moveCard: (id: string, position: CardPosition) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  duplicateCard: (id: string) => void;
  clearCards: () => void;
  toggleGrid: () => void;
  setZoom: (zoom: number) => void;
  markCardAsSeen: (id: string) => void;
}

export type CardStore = CardStoreState & CardStoreActions;

export const GRID_SIZE = 16;

export const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

export const snapPositionToGrid = (position: CardPosition): CardPosition => ({
  x: snapToGrid(position.x),
  y: snapToGrid(position.y),
});

export const useCardStore = create<CardStore>((set, get) => ({
  cards: [],
  gridEnabled: true,
  zoom: 1,

  addCard: (cardData) => {
    const snappedPosition = get().gridEnabled
      ? snapPositionToGrid(cardData.position)
      : cardData.position;

    const newCard: Card = {
      ...cardData,
      id: uuidv4(),
      position: snappedPosition,
      isNew: true,
    };
    set((state) => ({ cards: [...state.cards, newCard] }));
  },

  removeCard: (id) => {
    set((state) => ({ cards: state.cards.filter((card) => card.id !== id) }));
  },

  moveCard: (id, position) => {
    const snappedPosition = get().gridEnabled
      ? snapPositionToGrid(position)
      : position;

    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, position: snappedPosition } : card
      ),
    }));
  },

  toggleGrid: () => {
    set((state) => ({ gridEnabled: !state.gridEnabled }));
  },

  clearCards: () => {
    set({ cards: [] });
  },

  updateCard: (id, updates) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
    }));
  },

  duplicateCard: (id) => {
    const { cards } = get();
    const card = cards.find((c) => c.id === id);
    if (card) {
      const newCard: Card = {
        ...card,
        id: uuidv4(),
        position: { x: card.position.x + 5, y: card.position.y + 5 },
        isNew: true,
      };
      set((state) => ({ cards: [...state.cards, newCard] }));
    }
  },

  setZoom: (zoom) => {
    set({ zoom });
  },

  markCardAsSeen: (id) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, isNew: false } : card
      ),
    }));
  },
}));

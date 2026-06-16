import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, CardStatus } from './types';

interface BoardState {
  cards: Card[];
  selectedCardId: string | null;
  addCard: (card: Omit<Card, 'id' | 'order' | 'createdAt'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (cardId: string, toStatus: CardStatus, toIndex: number) => void;
  selectCard: (id: string | null) => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      cards: [],
      selectedCardId: null,

      addCard: (cardData) => {
        const statusCards = get().cards.filter((c) => c.status === cardData.status);
        const newCard: Card = {
          ...cardData,
          id: crypto.randomUUID(),
          order: statusCards.length,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ cards: [...state.cards, newCard] }));
      },

      updateCard: (id, updates) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, ...updates } : card
          ),
        }));
      },

      deleteCard: (id) => {
        set((state) => {
          const deletedCard = state.cards.find((c) => c.id === id);
          if (!deletedCard) return state;
          const remainingCards = state.cards
            .filter((c) => c.id !== id)
            .map((c) =>
              c.status === deletedCard.status && c.order > deletedCard.order
                ? { ...c, order: c.order - 1 }
                : c
            );
          return { cards: remainingCards, selectedCardId: state.selectedCardId === id ? null : state.selectedCardId };
        });
      },

      moveCard: (cardId, toStatus, toIndex) => {
        set((state) => {
          const card = state.cards.find((c) => c.id === cardId);
          if (!card) return state;

          const fromStatus = card.status;
          const fromIndex = card.order;

          if (fromStatus === toStatus && fromIndex === toIndex) {
            return state;
          }

          const updatedCards = state.cards.map((c) => {
            if (c.id === cardId) {
              return { ...c, status: toStatus, order: toIndex };
            }

            if (c.status === fromStatus && fromStatus === toStatus) {
              if (fromIndex < toIndex) {
                if (c.order > fromIndex && c.order <= toIndex) {
                  return { ...c, order: c.order - 1 };
                }
              } else {
                if (c.order >= toIndex && c.order < fromIndex) {
                  return { ...c, order: c.order + 1 };
                }
              }
            } else {
              if (c.status === fromStatus && c.order > fromIndex) {
                return { ...c, order: c.order - 1 };
              }
              if (c.status === toStatus && c.order >= toIndex) {
                return { ...c, order: c.order + 1 };
              }
            }

            return c;
          });

          return { cards: updatedCards };
        });
      },

      selectCard: (id) => {
        set({ selectedCardId: id });
      },
    }),
    {
      name: 'idea-flow-board',
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Deck, GameState, BattleRecord, Stats } from '../types';
import { PRESET_CARDS } from '../utils/gameEngine';

interface GameStore {
  presetCards: Card[];
  selectedDeck: Deck;
  currentGame: GameState | null;
  battleRecords: BattleRecord[];
  setSelectedDeck: (deck: Deck) => void;
  addCardToDeck: (card: Card) => boolean;
  removeCardFromDeck: (index: number) => void;
  reorderDeck: (fromIndex: number, toIndex: number) => void;
  setCurrentGame: (state: GameState | null) => void;
  updateCurrentGame: (state: GameState) => void;
  saveBattleRecord: (record: BattleRecord) => void;
  getStats: () => Stats;
  resetDeck: () => void;
}

const createEmptyDeck = (): Deck => ({
  id: 'custom-deck-' + Date.now(),
  name: '我的卡组',
  cards: [],
  createdAt: Date.now(),
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      presetCards: PRESET_CARDS,
      selectedDeck: createEmptyDeck(),
      currentGame: null,
      battleRecords: [],

      setSelectedDeck: (deck: Deck) => set({ selectedDeck: deck }),

      addCardToDeck: (card: Card) => {
        const { selectedDeck } = get();
        if (selectedDeck.cards.length >= 30) return false;
        const sameCount = selectedDeck.cards.filter((c) => c.id === card.id).length;
        if (card.rarity === 'legendary' && sameCount >= 1) return false;
        if (sameCount >= 2) return false;
        set({
          selectedDeck: {
            ...selectedDeck,
            cards: [...selectedDeck.cards, card],
          },
        });
        return true;
      },

      removeCardFromDeck: (index: number) => {
        const { selectedDeck } = get();
        const cards = [...selectedDeck.cards];
        cards.splice(index, 1);
        set({
          selectedDeck: {
            ...selectedDeck,
            cards,
          },
        });
      },

      reorderDeck: (fromIndex: number, toIndex: number) => {
        const { selectedDeck } = get();
        const cards = [...selectedDeck.cards];
        const [removed] = cards.splice(fromIndex, 1);
        cards.splice(toIndex, 0, removed);
        set({
          selectedDeck: {
            ...selectedDeck,
            cards,
          },
        });
      },

      setCurrentGame: (state) => set({ currentGame: state }),
      updateCurrentGame: (state) => set({ currentGame: state }),

      saveBattleRecord: (record: BattleRecord) => {
        const { battleRecords } = get();
        set({ battleRecords: [record, ...battleRecords] });
      },

      getStats: () => {
        const { battleRecords } = get();
        const total = battleRecords.length;
        const wins = battleRecords.filter((r) => r.result === 'win').length;
        const losses = total - wins;
        return {
          totalGames: total,
          wins,
          losses,
          winRate: total === 0 ? 0 : Math.round((wins / total) * 100),
        };
      },

      resetDeck: () => set({ selectedDeck: createEmptyDeck() }),
    }),
    {
      name: 'cardbattle_store',
      partialize: (state) => ({
        selectedDeck: state.selectedDeck,
        battleRecords: state.battleRecords,
      }),
    }
  )
);

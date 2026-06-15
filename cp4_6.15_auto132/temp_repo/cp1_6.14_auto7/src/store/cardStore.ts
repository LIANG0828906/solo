import { create } from 'zustand';
import { Card, Deck, PlayerState, BattlePhase, BattleLog, BattleStats } from '@/types';
import {
  generateId,
  validateCard,
  validateDeck,
  MAX_CARD_POOL,
  generatePresetCards,
  shuffleArray,
} from '@/utils/cardUtils';

interface State {
  cards: Card[];
  decks: Deck[];
  currentDeckId: string | null;
  battleState: {
    player: PlayerState;
    ai: PlayerState;
    currentTurn: number;
    phase: BattlePhase;
    logs: BattleLog[];
    stats: BattleStats;
    speed: number;
    winner: 'player' | 'ai' | null;
    isLogCollapsed: boolean;
  } | null;
  lastReport: BattleStats | null;
}

interface Actions {
  initFromStorage: () => void;
  persistCards: () => void;
  persistDecks: () => void;
  addCard: (card: Omit<Card, 'id'>) => { success: boolean; errors?: string[] };
  deleteCard: (id: string) => void;
  createDeck: (name: string) => string;
  deleteDeck: (id: string) => void;
  selectDeck: (id: string) => void;
  addCardToDeck: (deckId: string, cardId: string) => { success: boolean; error?: string };
  removeCardFromDeck: (deckId: string, cardId: string) => void;
  startBattle: (playerDeckId: string) => void;
  setBattleSpeed: (speed: number) => void;
  toggleLogCollapsed: () => void;
  addBattleLog: (log: BattleLog) => void;
  updateBattlePlayer: (player: PlayerState) => void;
  updateBattleAI: (ai: PlayerState) => void;
  advanceTurn: () => void;
  setBattlePhase: (phase: BattlePhase) => void;
  setBattleWinner: (winner: 'player' | 'ai') => void;
  saveReport: (report: BattleStats) => void;
  clearBattle: () => void;
}

export const useCardStore = create<State & Actions>()((set, get) => ({
  cards: [],
  decks: [],
  currentDeckId: null,
  battleState: null,
  lastReport: null,

  initFromStorage: () => {
    const savedCards = localStorage.getItem('cardforge_cards');
    const savedDecks = localStorage.getItem('cardforge_decks');

    const cards = savedCards ? JSON.parse(savedCards) : generatePresetCards();
    const decks = savedDecks ? JSON.parse(savedDecks) : [];

    set({ cards, decks });
  },

  persistCards: () => {
    localStorage.setItem('cardforge_cards', JSON.stringify(get().cards));
  },

  persistDecks: () => {
    localStorage.setItem('cardforge_decks', JSON.stringify(get().decks));
  },

  addCard: (card) => {
    const validation = validateCard(card);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const { cards } = get();
    if (cards.length >= MAX_CARD_POOL) {
      return { success: false, errors: [`卡牌池最多容纳 ${MAX_CARD_POOL} 张卡牌`] };
    }

    const newCard: Card = { ...card, id: generateId() };
    set({ cards: [...cards, newCard] });
    get().persistCards();
    return { success: true };
  },

  deleteCard: (id) => {
    const { cards, decks } = get();
    const newCards = cards.filter((c) => c.id !== id);
    const newDecks = decks.map((d) => ({
      ...d,
      cardIds: d.cardIds.filter((cid) => cid !== id),
    }));
    set({ cards: newCards, decks: newDecks });
    get().persistCards();
    get().persistDecks();
  },

  createDeck: (name) => {
    const id = generateId();
    const newDeck: Deck = { id, name, cardIds: [] };
    set((state) => ({ decks: [...state.decks, newDeck] }));
    get().persistDecks();
    return id;
  },

  deleteDeck: (id) => {
    const { decks, currentDeckId } = get();
    set({
      decks: decks.filter((d) => d.id !== id),
      currentDeckId: currentDeckId === id ? null : currentDeckId,
    });
    get().persistDecks();
  },

  selectDeck: (id) => {
    set({ currentDeckId: id });
  },

  addCardToDeck: (deckId, cardId) => {
    const { decks } = get();
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) {
      return { success: false, error: '卡组不存在' };
    }

    if (deck.cardIds.length >= 30) {
      return { success: false, error: '卡组最多30张卡牌' };
    }

    const count = deck.cardIds.filter((cid) => cid === cardId).length;
    if (count >= 2) {
      return { success: false, error: '每张卡牌最多放入2张' };
    }

    const newDecks = decks.map((d) =>
      d.id ===
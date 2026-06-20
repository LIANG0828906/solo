import { create } from 'zustand';
import { Card, Deck, DeckCard, BattleMap } from '../types';
import { ALL_CARDS, getCardById } from '../data/cards';

const STORAGE_KEY = 'arcane_tactics_decks';
const FAVORITES_KEY = 'arcane_tactics_favorites';
const MAPS_KEY = 'arcane_tactics_maps';

interface DeckStoreState {
  currentDeckCards: DeckCard[];
  deckName: string;
  savedDecks: Deck[];
  favoriteCardIds: string[];
  searchQuery: string;
  costFilter: number | null;
  rarityFilter: Card['rarity'] | null;
  typeFilter: Card['type'] | null;
  savedMaps: BattleMap[];
  init: () => void;
  addCard: (cardId: string) => boolean;
  removeCard: (cardId: string) => void;
  clearDeck: () => void;
  setDeckName: (name: string) => void;
  saveDeck: () => Deck | null;
  loadDeck: (deckId: string) => void;
  deleteDeck: (deckId: string) => void;
  toggleFavorite: (cardId: string) => void;
  setSearchQuery: (q: string) => void;
  setCostFilter: (cost: number | null) => void;
  setRarityFilter: (r: Card['rarity'] | null) => void;
  setTypeFilter: (t: Card['type'] | null) => void;
  getFilteredCards: () => Card[];
  getTotalCards: () => number;
  getManaCurve: () => Record<number, number>;
  bindMapToDeck: (deckId: string, mapId: string | undefined) => void;
  loadMaps: () => void;
}

export const useDeckStore = create<DeckStoreState>((set, get) => ({
  currentDeckCards: [],
  deckName: '新套牌',
  savedDecks: [],
  favoriteCardIds: [],
  searchQuery: '',
  costFilter: null,
  rarityFilter: null,
  typeFilter: null,
  savedMaps: [],

  init: () => {
    try {
      const savedDecksRaw = localStorage.getItem(STORAGE_KEY);
      if (savedDecksRaw) {
        set({ savedDecks: JSON.parse(savedDecksRaw) });
      }
      const favRaw = localStorage.getItem(FAVORITES_KEY);
      if (favRaw) {
        set({ favoriteCardIds: JSON.parse(favRaw) });
      }
    } catch (e) {
      console.error('Failed to load deck data', e);
    }
    get().loadMaps();
  },

  loadMaps: () => {
    try {
      const raw = localStorage.getItem(MAPS_KEY);
      if (raw) {
        set({ savedMaps: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('Failed to load maps', e);
    }
  },

  addCard: (cardId: string) => {
    const { currentDeckCards, getTotalCards } = get();
    if (getTotalCards() >= 30) return false;

    const existing = currentDeckCards.find(d => d.cardId === cardId);
    if (existing && existing.count >= 2) return false;

    if (existing) {
      set({
        currentDeckCards: currentDeckCards.map(d =>
          d.cardId === cardId ? { ...d, count: d.count + 1 } : d
        )
      });
    } else {
      set({
        currentDeckCards: [...currentDeckCards, { cardId, count: 1 }]
      });
    }
    return true;
  },

  removeCard: (cardId: string) => {
    const { currentDeckCards } = get();
    const existing = currentDeckCards.find(d => d.cardId === cardId);
    if (!existing) return;

    if (existing.count > 1) {
      set({
        currentDeckCards: currentDeckCards.map(d =>
          d.cardId === cardId ? { ...d, count: d.count - 1 } : d
        )
      });
    } else {
      set({
        currentDeckCards: currentDeckCards.filter(d => d.cardId !== cardId)
      });
    }
  },

  clearDeck: () => {
    set({ currentDeckCards: [], deckName: '新套牌' });
  },

  setDeckName: (name: string) => set({ deckName: name }),

  saveDeck: () => {
    const { currentDeckCards, deckName, savedDecks, getTotalCards } = get();
    if (getTotalCards() < 10) return null;

    const newDeck: Deck = {
      id: `deck_${Date.now()}`,
      name: deckName || '未命名套牌',
      cards: [...currentDeckCards],
      createdAt: Date.now()
    };

    const newDecks = [...savedDecks, newDeck];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDecks));
    set({ savedDecks: newDecks });
    return newDeck;
  },

  loadDeck: (deckId: string) => {
    const deck = get().savedDecks.find(d => d.id === deckId);
    if (deck) {
      set({
        currentDeckCards: [...deck.cards],
        deckName: deck.name
      });
    }
  },

  deleteDeck: (deckId: string) => {
    const newDecks = get().savedDecks.filter(d => d.id !== deckId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDecks));
    set({ savedDecks: newDecks });
  },

  toggleFavorite: (cardId: string) => {
    const { favoriteCardIds } = get();
    let newFavs: string[];
    if (favoriteCardIds.includes(cardId)) {
      newFavs = favoriteCardIds.filter(id => id !== cardId);
    } else {
      newFavs = [...favoriteCardIds, cardId];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
    set({ favoriteCardIds: newFavs });
  },

  setSearchQuery: (q: string) => set({ searchQuery: q }),
  setCostFilter: (cost: number | null) => set({ costFilter: cost }),
  setRarityFilter: (r: Card['rarity'] | null) => set({ rarityFilter: r }),
  setTypeFilter: (t: Card['type'] | null) => set({ typeFilter: t }),

  getFilteredCards: () => {
    const { searchQuery, costFilter, rarityFilter, typeFilter } = get();
    let cards = ALL_CARDS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      cards = cards.filter(c => c.name.toLowerCase().includes(q));
    }
    if (costFilter !== null) {
      cards = cards.filter(c => c.cost === costFilter);
    }
    if (rarityFilter) {
      cards = cards.filter(c => c.rarity === rarityFilter);
    }
    if (typeFilter) {
      cards = cards.filter(c => c.type === typeFilter);
    }

    return cards;
  },

  getTotalCards: () => {
    return get().currentDeckCards.reduce((sum, d) => sum + d.count, 0);
  },

  getManaCurve: () => {
    const curve: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) curve[i] = 0;

    get().currentDeckCards.forEach(dc => {
      const card = getCardById(dc.cardId);
      if (card && curve[card.cost] !== undefined) {
        curve[card.cost] += dc.count;
      }
    });

    return curve;
  },

  bindMapToDeck: (deckId: string, mapId: string | undefined) => {
    const newDecks = get().savedDecks.map(d => {
      if (d.id === deckId) {
        return { ...d, boundMapId: mapId };
      }
      return d;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDecks));
    set({ savedDecks: newDecks });
  }
}));

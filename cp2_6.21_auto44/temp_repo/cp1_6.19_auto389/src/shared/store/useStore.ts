import { create } from 'zustand';
import type { Instrument, Offer, FilterState } from '../types';

const MAX_FAVORITES = 20;
const MAX_COMPARE = 3;
const NOTIFICATION_DURATION = 3000;

interface AppState {
  instruments: Instrument[];
  loading: boolean;
  selectedInstrument: Instrument | null;
  favorites: string[];
  compareIds: string[];
  offers: Offer[];
  filter: FilterState;
  notification: { type: 'success' | 'error'; message: string } | null;

  setInstruments: (items: Instrument[]) => void;
  setLoading: (v: boolean) => void;
  setSelectedInstrument: (item: Instrument | null) => void;
  addInstrument: (item: Instrument) => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  setFilter: (f: Partial<FilterState>) => void;
  setOffers: (offers: Offer[]) => void;
  addOffer: (offer: Offer) => void;
  updateOfferStatus: (id: string, status: 'accepted' | 'rejected') => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  clearNotification: () => void;
}

let notificationTimer: number | null = null;

export const useStore = create<AppState>((set, get) => ({
  instruments: [],
  loading: false,
  selectedInstrument: null,
  favorites: [],
  compareIds: [],
  offers: [],
  filter: {
    category: 'all',
    priceRange: 'all',
    conditionRange: 'all',
  },
  notification: null,

  setInstruments: (items) => set({ instruments: items }),
  setLoading: (v) => set({ loading: v }),
  setSelectedInstrument: (item) => set({ selectedInstrument: item }),
  addInstrument: (item) =>
    set((state) => ({ instruments: [item, ...state.instruments] })),

  toggleFavorite: (id) =>
    set((state) => {
      const exists = state.favorites.includes(id);
      if (exists) {
        return { favorites: state.favorites.filter((f) => f !== id) };
      }
      if (state.favorites.length >= MAX_FAVORITES) {
        return { favorites: [...state.favorites.slice(1), id] };
      }
      return { favorites: [...state.favorites, id] };
    }),

  toggleCompare: (id) =>
    set((state) => {
      const exists = state.compareIds.includes(id);
      if (exists) {
        return { compareIds: state.compareIds.filter((c) => c !== id) };
      }
      if (state.compareIds.length >= MAX_COMPARE) {
        return { compareIds: [...state.compareIds.slice(1), id] };
      }
      return { compareIds: [...state.compareIds, id] };
    }),

  clearCompare: () => set({ compareIds: [] }),

  setFilter: (f) => set((state) => ({ filter: { ...state.filter, ...f } })),

  setOffers: (offers) => set({ offers }),

  addOffer: (offer) =>
    set((state) => ({ offers: [offer, ...state.offers] })),

  updateOfferStatus: (id, status) =>
    set((state) => ({
      offers: state.offers.map((o) =>
        o.id === id ? { ...o, status } : o
      ),
    })),

  showNotification: (type, message) => {
    if (notificationTimer !== null) {
      window.clearTimeout(notificationTimer);
      notificationTimer = null;
    }
    set({ notification: { type, message } });
    notificationTimer = window.setTimeout(() => {
      get().clearNotification();
      notificationTimer = null;
    }, NOTIFICATION_DURATION);
  },

  clearNotification: () => set({ notification: null }),
}));

export default useStore;

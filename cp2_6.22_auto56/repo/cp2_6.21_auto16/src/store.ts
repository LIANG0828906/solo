import { create } from 'zustand';
import * as api from './api';

export type User = api.User;
export type Artwork = api.Artwork;
export type Bid = api.Bid;

interface StoreState {
  user: User;
  artworks: Artwork[];
  currentArtwork: Artwork | null;
  bids: Bid[];
  loading: boolean;
  newBidId: number | null;

  setUser: (user: User) => void;
  setArtworks: (list: Artwork[]) => void;
  setCurrentArtwork: (art: Artwork | null) => void;
  setBids: (bids: Bid[]) => void;
  updateArtwork: (art: Artwork) => void;
  addBid: (bid: Bid) => void;
  deductWallet: (amount: number) => void;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  artworks: [],
  currentArtwork: null,
  bids: [],
  loading: false,
  newBidId: null,

  setUser: (user) => set({ user }),

  setArtworks: (list) => set({ artworks: list }),

  setCurrentArtwork: (art) => set({ currentArtwork: art }),

  setBids: (bids) => set({ bids }),

  updateArtwork: (art) =>
    set((state) => ({
      artworks: state.artworks.map((a) => (a.id === art.id ? art : a)),
      currentArtwork:
        state.currentArtwork && state.currentArtwork.id === art.id
          ? art
          : state.currentArtwork,
    })),

  addBid: (bid) => {
    set((state) => ({
      bids: [bid, ...state.bids],
      newBidId: bid.id,
    }));
    setTimeout(() => {
      set({ newBidId: null });
    }, 1200);
  },

  deductWallet: (amount) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, wallet: state.user.wallet - amount }
        : state.user,
    })),

  login: async (username: string) => {
    set({ loading: true });
    try {
      const user = await api.login(username);
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => set({ user: null }),
}));

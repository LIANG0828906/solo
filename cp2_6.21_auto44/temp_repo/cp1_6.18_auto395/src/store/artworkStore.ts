import { create } from 'zustand';
import type { Artwork, OrderItem } from '@/api';
import { artworkApi } from '@/api/artwork';

interface ArtworkState {
  artworks: Artwork[];
  currentArtwork: Artwork | null;
  likedIds: number[];
  loading: boolean;
  fetchArtworks: (galleryId: number) => Promise<void>;
  addArtworks: (artworks: Artwork[]) => void;
  removeArtwork: (id: number) => void;
  setArtworksOrder: (order: OrderItem[]) => void;
  setCurrentArtwork: (artwork: Artwork | null) => void;
  likeArtwork: (id: number) => Promise<void>;
  hydrateLiked: () => void;
  persistLiked: () => void;
}

const LIKED_STORAGE_KEY = 'gallery_liked_ids';

export const useArtworkStore = create<ArtworkState>((set, get) => ({
  artworks: [],
  currentArtwork: null,
  likedIds: [],
  loading: false,

  fetchArtworks: async (galleryId) => {
    set({ loading: true });
    try {
      const artworks = await artworkApi.getArtworks(galleryId);
      set({
        artworks: artworks.sort((a, b) => a.order_index - b.order_index),
      });
    } catch {
      set({ artworks: [] });
    } finally {
      set({ loading: false });
    }
  },

  addArtworks: (newArtworks) => {
    set((state) => {
      const existingIds = new Set(state.artworks.map((a) => a.id));
      const unique = newArtworks.filter((a) => !existingIds.has(a.id));
      const merged = [...state.artworks, ...unique].sort(
        (a, b) => a.order_index - b.order_index
      );
      return { artworks: merged };
    });
  },

  removeArtwork: (id) => {
    set((state) => ({
      artworks: state.artworks.filter((a) => a.id !== id),
      currentArtwork:
        state.currentArtwork?.id === id ? null : state.currentArtwork,
    }));
  },

  setArtworksOrder: (order) => {
    set((state) => {
      const orderMap = new Map(order.map((item) => [item.id, item.order_index]));
      const updated = state.artworks
        .map((a) => ({
          ...a,
          order_index: orderMap.has(a.id) ? (orderMap.get(a.id) as number) : a.order_index,
        }))
        .sort((a, b) => a.order_index - b.order_index);
      return { artworks: updated };
    });
  },

  setCurrentArtwork: (artwork) => {
    set({ currentArtwork: artwork });
  },

  likeArtwork: async (id) => {
    try {
      const result = await artworkApi.likeArtwork(id);
      set((state) => {
        const likedIds = state.likedIds.includes(id)
          ? state.likedIds.filter((likedId) => likedId !== id)
          : [...state.likedIds, id];

        const artworks = state.artworks.map((a) =>
          a.id === id ? { ...a, likes: result.likes } : a
        );

        const currentArtwork =
          state.currentArtwork?.id === id
            ? { ...state.currentArtwork, likes: result.likes }
            : state.currentArtwork;

        return { likedIds, artworks, currentArtwork };
      });
      get().persistLiked();
    } catch {
      // ignore
    }
  },

  hydrateLiked: () => {
    try {
      const stored = localStorage.getItem(LIKED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        if (Array.isArray(parsed)) {
          set({ likedIds: parsed });
        }
      }
    } catch {
      // ignore
    }
  },

  persistLiked: () => {
    try {
      localStorage.setItem(
        LIKED_STORAGE_KEY,
        JSON.stringify(get().likedIds)
      );
    } catch {
      // ignore
    }
  },
}));

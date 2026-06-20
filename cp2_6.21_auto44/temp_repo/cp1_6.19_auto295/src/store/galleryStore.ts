import { create } from 'zustand';
import type { Artwork, Light, GalleryStore } from '../types';
import { generateId, getCurrentTimeString } from '../utils/helpers';

const OBJECT_THRESHOLD = 20;

const updatePolygonDetails = (
  artworks: Artwork[],
  totalObjects: number
): Artwork[] => {
  const targetDetail: 64 | 128 = totalObjects > OBJECT_THRESHOLD ? 64 : 128;
  return artworks.map((a) =>
    a.type === 'sculpture' && a.polygonDetail !== targetDetail
      ? { ...a, polygonDetail: targetDetail }
      : a
  );
};

export const useGalleryStore = create<GalleryStore>((set, get) => ({
  artworks: [],
  lights: [],
  lastOperationTime: getCurrentTimeString(),
  shadowQuality: 'high',

  getTotalObjects: () => {
    const { artworks, lights } = get();
    return artworks.length + lights.length;
  },

  addArtwork: (artwork) => {
    const state = get();
    const totalBefore = state.artworks.length + state.lights.length;
    const totalAfter = totalBefore + 1;
    const newArtwork: Artwork = {
      ...artwork,
      id: generateId(),
      polygonDetail: totalAfter > OBJECT_THRESHOLD ? 64 : 128,
    };
    const updatedArtworks = updatePolygonDetails(
      [...state.artworks, newArtwork],
      totalAfter
    );
    set({
      artworks: updatedArtworks,
      lastOperationTime: getCurrentTimeString(),
    });
  },

  removeArtwork: (id) => {
    const state = get();
    const filtered = state.artworks.filter((a) => a.id !== id);
    const totalAfter = filtered.length + state.lights.length;
    const updatedArtworks = updatePolygonDetails(filtered, totalAfter);
    set({
      artworks: updatedArtworks,
      lastOperationTime: getCurrentTimeString(),
    });
  },

  updateArtwork: (id, updates) => {
    set((state) => ({
      artworks: state.artworks.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
      lastOperationTime: getCurrentTimeString(),
    }));
  },

  addLight: (light) => {
    const state = get();
    const newLight: Light = { ...light, id: generateId() };
    const totalAfter = state.artworks.length + state.lights.length + 1;
    const updatedArtworks = updatePolygonDetails(state.artworks, totalAfter);
    set({
      lights: [...state.lights, newLight],
      artworks: updatedArtworks,
      shadowQuality: 'low',
      lastOperationTime: getCurrentTimeString(),
    });
    setTimeout(() => {
      set({ shadowQuality: 'high' });
    }, 200);
  },

  removeLight: (id) => {
    const state = get();
    const filtered = state.lights.filter((l) => l.id !== id);
    const totalAfter = state.artworks.length + filtered.length;
    const updatedArtworks = updatePolygonDetails(state.artworks, totalAfter);
    set({
      lights: filtered,
      artworks: updatedArtworks,
      shadowQuality: 'low',
      lastOperationTime: getCurrentTimeString(),
    });
    setTimeout(() => {
      set({ shadowQuality: 'high' });
    }, 200);
  },

  updateLight: (id, updates) => {
    set((state) => ({
      lights: state.lights.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
      lastOperationTime: getCurrentTimeString(),
    }));
  },
}));

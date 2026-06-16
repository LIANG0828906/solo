import { create } from 'zustand';
import type { Spice, Culture, FavoriteItem, FlavorProfile } from '../types';
import { cultures } from '../data/spices';

interface StoreState {
  cultures: Culture[];
  selectedCulture: Culture | null;
  dropZoneSpices: (Spice | null)[];
  favorites: FavoriteItem[];
  favoritesPanelOpen: boolean;
  draggedSpice: Spice | null;
  setSelectedCulture: (culture: Culture | null) => void;
  setDropZoneSpice: (index: 0 | 1, spice: Spice | null) => void;
  clearDropZone: () => void;
  addFavorite: (spices: [Spice, Spice], cultureName: string, similarity: number) => void;
  removeFavorite: (id: string) => void;
  toggleFavoritesPanel: () => void;
  setDraggedSpice: (spice: Spice | null) => void;
  loadFavorites: () => void;
}

const FAVORITES_KEY = 'spice-atlas-favorites';

export const useStore = create<StoreState>((set, get) => ({
  cultures,
  selectedCulture: null,
  dropZoneSpices: [null, null],
  favorites: [],
  favoritesPanelOpen: false,
  draggedSpice: null,

  setSelectedCulture: (culture) => set({ selectedCulture: culture }),

  setDropZoneSpice: (index, spice) => set((state) => {
    const newSpices = [...state.dropZoneSpices] as (Spice | null)[];
    newSpices[index] = spice;
    return { dropZoneSpices: newSpices };
  }),

  clearDropZone: () => set({ dropZoneSpices: [null, null] }),

  addFavorite: (spices, cultureName, similarity) => {
    const newFavorite: FavoriteItem = {
      id: crypto.randomUUID(),
      spices,
      cultureName,
      similarity,
      createdAt: Date.now()
    };
    const newFavorites = [newFavorite, ...get().favorites];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    set({ favorites: newFavorites });
  },

  removeFavorite: (id) => {
    const newFavorites = get().favorites.filter(f => f.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    set({ favorites: newFavorites });
  },

  toggleFavoritesPanel: () => set((state) => ({ favoritesPanelOpen: !state.favoritesPanelOpen })),

  setDraggedSpice: (spice) => set({ draggedSpice: spice }),

  loadFavorites: () => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        set({ favorites: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  }
}));

export function calculateCosineSimilarity(a: FlavorProfile, b: FlavorProfile): number {
  const keys: (keyof FlavorProfile)[] = ['spicy', 'aromatic', 'warm', 'pungent', 'sweet'];
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (const key of keys) {
    dotProduct += a[key] * b[key];
    normA += a[key] * a[key];
    normB += b[key] * b[key];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function averageFlavorProfile(spices: Spice[]): FlavorProfile {
  if (spices.length === 0) {
    return { spicy: 0, aromatic: 0, warm: 0, pungent: 0, sweet: 0 };
  }
  
  const keys: (keyof FlavorProfile)[] = ['spicy', 'aromatic', 'warm', 'pungent', 'sweet'];
  const avg: FlavorProfile = { spicy: 0, aromatic: 0, warm: 0, pungent: 0, sweet: 0 };
  
  for (const key of keys) {
    avg[key] = spices.reduce((sum, s) => sum + s.flavor[key], 0) / spices.length;
  }
  
  return avg;
}

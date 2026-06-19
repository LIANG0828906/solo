import { create } from 'zustand';
import type { StyleId, Combination, HistoryEntry } from '../types';
import {
  DEFAULT_STYLE_ID,
  DEFAULT_WOOD_ID,
  DEFAULT_METAL_ID,
  MAX_FAVORITES,
  WOODS,
  METALS
} from '../data/catalog';

interface AppState {
  styleId: StyleId;
  woodId: string;
  metalId: string;
  favorites: Combination[];
  history: HistoryEntry[];
  compareMode: boolean;
  compareCombination: Combination | null;
  rotateX: number;
  rotateY: number;

  setStyle: (styleId: StyleId) => void;
  setWood: (woodId: string) => void;
  setMetal: (metalId: string) => void;
  addFavorite: () => { success: boolean; message?: string };
  removeFavorite: (id: string) => void;
  replaceFavorite: (index: number) => void;
  toggleCompare: (combination: Combination | null) => void;
  setRotation: (x: number, y: number) => void;
  resetRotation: () => void;
  recordSelection: () => void;
  getTopCombinations: (styleId: StyleId, limit: number) => HistoryEntry[];
  applyCombination: (woodId: string, metalId: string) => void;
  getCurrentCombination: () => Combination;
}

const HISTORY_KEY = 'leather-workshop-history';
const FAVORITES_KEY = 'leather-workshop-favorites';

const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return generateMockHistory();
};

const generateMockHistory = (): HistoryEntry[] => {
  const entries: HistoryEntry[] = [];
  const styleIds: StyleId[] = ['short-wallet', 'long-wallet', 'key-case'];
  
  styleIds.forEach((styleId) => {
    WOODS.forEach((wood, wi) => {
      METALS.forEach((metal, mi) => {
        const count = Math.floor(Math.random() * 100) + 10 + (wi + mi) * 5;
        entries.push({ styleId, woodId: wood.id, metalId: metal.id, count });
      });
    });
  });

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
  return entries;
};

const loadFavorites = (): Combination[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return [];
};

const saveFavorites = (favorites: Combination[]) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
};

const saveHistory = (history: HistoryEntry[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
};

const generateCombinationId = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAppStore = create<AppState>((set, get) => ({
  styleId: DEFAULT_STYLE_ID,
  woodId: DEFAULT_WOOD_ID,
  metalId: DEFAULT_METAL_ID,
  favorites: loadFavorites(),
  history: loadHistory(),
  compareMode: false,
  compareCombination: null,
  rotateX: 0,
  rotateY: 0,

  setStyle: (styleId: StyleId) => {
    set({ styleId, compareMode: false, compareCombination: null });
    get().recordSelection();
  },

  setWood: (woodId: string) => {
    set({ woodId });
    get().recordSelection();
  },

  setMetal: (metalId: string) => {
    set({ metalId });
    get().recordSelection();
  },

  addFavorite: () => {
    const state = get();
    const current = state.getCurrentCombination();

    const exists = state.favorites.some(
      (f) =>
        f.styleId === current.styleId &&
        f.woodId === current.woodId &&
        f.metalId === current.metalId
    );
    if (exists) {
      return { success: false, message: '该组合已在收藏夹中' };
    }

    if (state.favorites.length >= MAX_FAVORITES) {
      return { success: false, message: '收藏夹已满，点击要替换的收藏项' };
    }

    const newFavorites = [...state.favorites, current];
    set({ favorites: newFavorites });
    saveFavorites(newFavorites);
    return { success: true };
  },

  removeFavorite: (id: string) => {
    const newFavorites = get().favorites.filter((f) => f.id !== id);
    set({ favorites: newFavorites });
    saveFavorites(newFavorites);
  },

  replaceFavorite: (index: number) => {
    const state = get();
    const current = state.getCurrentCombination();
    const newFavorites = [...state.favorites];
    newFavorites[index] = current;
    set({ favorites: newFavorites });
    saveFavorites(newFavorites);
  },

  toggleCompare: (combination: Combination | null) => {
    if (combination) {
      set({ compareMode: true, compareCombination: combination });
    } else {
      set({ compareMode: false, compareCombination: null });
    }
  },

  setRotation: (x: number, y: number) => {
    const clampedX = Math.max(-30, Math.min(30, x));
    const clampedY = ((y % 360) + 360) % 360;
    set({ rotateX: clampedX, rotateY: clampedY });
  },

  resetRotation: () => {
    set({ rotateX: 0, rotateY: 0 });
  },

  recordSelection: () => {
    const state = get();
    const newHistory = [...state.history];
    const entryIndex = newHistory.findIndex(
      (e) =>
        e.styleId === state.styleId &&
        e.woodId === state.woodId &&
        e.metalId === state.metalId
    );

    if (entryIndex >= 0) {
      newHistory[entryIndex] = {
        ...newHistory[entryIndex],
        count: newHistory[entryIndex].count + 1
      };
    } else {
      newHistory.push({
        styleId: state.styleId,
        woodId: state.woodId,
        metalId: state.metalId,
        count: 1
      });
    }

    set({ history: newHistory });
    saveHistory(newHistory);
  },

  getTopCombinations: (styleId: StyleId, limit: number) => {
    const state = get();
    return state.history
      .filter((e) => e.styleId === styleId)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  applyCombination: (woodId: string, metalId: string) => {
    set({ woodId, metalId });
    get().recordSelection();
  },

  getCurrentCombination: (): Combination => {
    const state = get();
    return {
      id: generateCombinationId(),
      styleId: state.styleId,
      woodId: state.woodId,
      metalId: state.metalId,
      timestamp: Date.now()
    };
  }
}));

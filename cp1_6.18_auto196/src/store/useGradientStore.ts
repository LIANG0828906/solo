import { create } from 'zustand';
import type { ColorStop, GradientConfig, SavedGradient } from '../types';
import { colorEngine } from '../engine/ColorEngine';
import { generateId } from '../utils/colorUtils';

const STORAGE_KEY = 'gradient-palette-favorites';
const MAX_HISTORY = 20;

const loadFavorites = (): SavedGradient[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites: SavedGradient[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    console.error('Failed to save favorites');
  }
};

const initialStops: ColorStop[] = [
  { id: generateId(), color: '#667EEA', position: 0 },
  { id: generateId(), color: '#764BA2', position: 50 },
  { id: generateId(), color: '#F093FB', position: 100 }
];

const initialConfig: GradientConfig = {
  stops: initialStops,
  angle: 135,
  steps: 50
};

interface GradientState {
  stops: ColorStop[];
  angle: number;
  steps: number;
  history: GradientConfig[];
  historyIndex: number;
  favorites: SavedGradient[];
  selectedStopId: string | null;
  setStops: (stops: ColorStop[]) => void;
  updateStop: (id: string, updates: Partial<ColorStop>, saveToHistory?: boolean) => void;
  addStop: (color: string, position: number) => void;
  removeStop: (id: string) => void;
  setAngle: (angle: number) => void;
  setSteps: (steps: number) => void;
  setSelectedStopId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  addFavorite: () => void;
  removeFavorite: (id: string) => void;
  applyFavorite: (favorite: SavedGradient) => void;
}

export const useGradientStore = create<GradientState>((set, get) => ({
  stops: initialStops,
  angle: 135,
  steps: 50,
  history: [initialConfig],
  historyIndex: 0,
  favorites: loadFavorites(),
  selectedStopId: null,

  setStops: (stops: ColorStop[]) => {
    set({ stops });
  },

  updateStop: (id: string, updates: Partial<ColorStop>, saveHistory = false) => {
    const { stops } = get();
    const newStops = colorEngine.updateStop(stops, id, updates);
    set({ stops: newStops });
    if (saveHistory) {
      get().saveToHistory();
    }
  },

  addStop: (color: string, position: number) => {
    const { stops } = get();
    if (stops.length >= 8) return;
    const newStops = colorEngine.addStop(stops, color, position);
    set({ stops: newStops });
    get().saveToHistory();
  },

  removeStop: (id: string) => {
    const { stops, selectedStopId } = get();
    if (stops.length <= 2) return;
    const newStops = colorEngine.removeStop(stops, id);
    set({
      stops: newStops,
      selectedStopId: selectedStopId === id ? null : selectedStopId
    });
    get().saveToHistory();
  },

  setAngle: (angle: number) => {
    set({ angle: Math.max(0, Math.min(360, angle)) });
  },

  setSteps: (steps: number) => {
    set({ steps: Math.max(10, Math.min(100, Math.round(steps))) });
  },

  setSelectedStopId: (id: string | null) => {
    set({ selectedStopId: id });
  },

  saveToHistory: () => {
    const { stops, angle, steps, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    const newConfig: GradientConfig = {
      stops: stops.map((s) => ({ ...s })),
      angle,
      steps
    };

    newHistory.push(newConfig);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    } else {
      set({ history: newHistory, historyIndex: historyIndex + 1 });
    }
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        stops: prevState.stops.map((s) => ({ ...s })),
        angle: prevState.angle,
        steps: prevState.steps,
        historyIndex: historyIndex - 1,
        selectedStopId: null
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        stops: nextState.stops.map((s) => ({ ...s })),
        angle: nextState.angle,
        steps: nextState.steps,
        historyIndex: historyIndex + 1,
        selectedStopId: null
      });
    }
  },

  addFavorite: () => {
    const { stops, angle, steps, favorites } = get();
    const newFavorite: SavedGradient = {
      id: generateId(),
      stops: stops.map((s) => ({ ...s })),
      angle,
      steps,
      createdAt: Date.now()
    };
    const newFavorites = [newFavorite, ...favorites];
    set({ favorites: newFavorites });
    saveFavorites(newFavorites);
  },

  removeFavorite: (id: string) => {
    const { favorites } = get();
    const newFavorites = favorites.filter((f) => f.id !== id);
    set({ favorites: newFavorites });
    saveFavorites(newFavorites);
  },

  applyFavorite: (favorite: SavedGradient) => {
    set({
      stops: favorite.stops.map((s) => ({ ...s })),
      angle: favorite.angle,
      steps: favorite.steps,
      selectedStopId: null
    });
    get().saveToHistory();
  }
}));

import { create } from 'zustand';
import type { Layer } from '../core/canvasEngine';

export interface ColorSwatch {
  id: string;
  hex: string;
  name: string;
}

interface HistorySnapshot {
  layers: Layer[];
  colorSwatches: ColorSwatch[];
}

interface AppState {
  layers: Layer[];
  selectedLayerId: string | null;
  selectedImageSrc: string | null;
  colorSwatches: ColorSwatch[];
  history: HistorySnapshot[];
  historyIndex: number;
  statusRotation: number;

  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  setSelectedLayer: (id: string | null) => void;
  setSelectedImage: (src: string | null) => void;
  setColorSwatches: (swatches: ColorSwatch[]) => void;
  updateColorSwatch: (id: string, updates: Partial<ColorSwatch>) => void;
  setStatusRotation: (deg: number) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 20;

function createId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function snapshot(state: AppState): HistorySnapshot {
  return {
    layers: JSON.parse(JSON.stringify(state.layers)),
    colorSwatches: JSON.parse(JSON.stringify(state.colorSwatches)),
  };
}

export const useStore = create<AppState>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  selectedImageSrc: null,
  colorSwatches: [
    { id: createId(), hex: '#E57373', name: '色1' },
    { id: createId(), hex: '#64B5F6', name: '色2' },
    { id: createId(), hex: '#81C784', name: '色3' },
    { id: createId(), hex: '#FFD54F', name: '色4' },
    { id: createId(), hex: '#BA68C8', name: '色5' },
  ],
  history: [],
  historyIndex: -1,
  statusRotation: 0,

  addLayer: (layer) => {
    get().pushHistory();
    set((state) => ({
      layers: [...state.layers, layer],
      selectedLayerId: layer.id,
    }));
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  deleteLayer: (id) => {
    get().pushHistory();
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
  },

  setSelectedLayer: (id) => {
    set({ selectedLayerId: id });
    if (id) {
      const layer = get().layers.find((l) => l.id === id);
      if (layer) {
        set({ statusRotation: Math.round(layer.rotation) });
      }
    }
  },

  setSelectedImage: (src) => {
    set({ selectedImageSrc: src });
  },

  setColorSwatches: (swatches) => {
    get().pushHistory();
    set({ colorSwatches: swatches });
  },

  updateColorSwatch: (id, updates) => {
    set((state) => ({
      colorSwatches: state.colorSwatches.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  },

  setStatusRotation: (deg) => {
    set({ statusRotation: deg });
  },

  pushHistory: () => {
    const state = get();
    const current = snapshot(state);

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(current);

    while (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const snap = state.history[newIndex];

    set({
      layers: JSON.parse(JSON.stringify(snap.layers)),
      colorSwatches: JSON.parse(JSON.stringify(snap.colorSwatches)),
      historyIndex: newIndex,
      selectedLayerId: null,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const snap = state.history[newIndex];

    set({
      layers: JSON.parse(JSON.stringify(snap.layers)),
      colorSwatches: JSON.parse(JSON.stringify(snap.colorSwatches)),
      historyIndex: newIndex,
      selectedLayerId: null,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));

export { createId };

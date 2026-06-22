import { create } from 'zustand';
import type { CanvasBlock, ColorSwatch, ArrowAnnotation, CanvasState } from '../types';

interface MoodBoardActions {
  addBlock: (block: CanvasBlock) => void;
  updateBlock: (id: string, updates: Partial<CanvasBlock>) => void;
  deleteBlock: (id: string) => void;
  addColorSwatch: (swatch: ColorSwatch) => void;
  removeColorSwatch: (id: string) => void;
  addAnnotation: (annotation: ArrowAnnotation) => void;
  updateAnnotation: (id: string, updates: Partial<ArrowAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  bringToFront: (id: string) => void;
}

const MAX_COLOR_SWATCHES = 8;

const initialState: CanvasState = {
  blocks: [],
  colorSwatches: [],
  annotations: [],
  selectedId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
};

export const useMoodBoardStore = create<CanvasState & MoodBoardActions>((set, get) => ({
  ...initialState,

  addBlock: (block) => {
    set((state) => ({
      blocks: [...state.blocks, block],
      selectedId: block.id,
    }));
  },

  updateBlock: (id, updates) => {
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  },

  deleteBlock: (id) => {
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      colorSwatches: state.colorSwatches.filter((s) => s.sourceBlockId !== id),
    }));
  },

  addColorSwatch: (swatch) => {
    set((state) => {
      const exists = state.colorSwatches.some((s) => s.hex.toLowerCase() === swatch.hex.toLowerCase());
      if (exists) return state;
      
      let newSwatches = [...state.colorSwatches, swatch];
      if (newSwatches.length > MAX_COLOR_SWATCHES) {
        newSwatches = newSwatches.slice(-MAX_COLOR_SWATCHES);
      }
      return { colorSwatches: newSwatches };
    });
  },

  removeColorSwatch: (id) => {
    set((state) => ({
      colorSwatches: state.colorSwatches.filter((s) => s.id !== id),
    }));
  },

  addAnnotation: (annotation) => {
    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));
  },

  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  },

  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  setSelectedId: (id) => {
    set({ selectedId: id });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.min(3, Math.max(0.2, zoom)) });
  },

  setPan: (x, y) => {
    set({ panX: x, panY: y });
  },

  bringToFront: (id) => {
    const state = get();
    const maxZ = Math.max(...state.blocks.map((b) => b.zIndex), ...state.annotations.map((a) => a.zIndex), 0);
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === id ? { ...b, zIndex: maxZ + 1 } : b
      ),
    }));
  },
}));

import { create } from 'zustand';
import type { Stroke, Doodle, BrushSettings, Viewport, BlendMode } from '../types';

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#FF8C42', '#6C5CE7',
  '#A8E6CF', '#FFD93D', '#FF6F91', '#2C3E50'
];

const MAX_HISTORY = 20;

interface CanvasState {
  brushSettings: BrushSettings;
  viewport: Viewport;
  currentStrokes: Stroke[];
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  doodles: Doodle[];
  currentDoodleId: string | null;
  galleryPage: number;
  galleryPageSize: number;
  isGalleryOpen: boolean;

  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setBlendMode: (mode: BlendMode) => void;
  setViewport: (offsetX: number, offsetY: number) => void;
  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  setDoodles: (doodles: Doodle[]) => void;
  addDoodle: (doodle: Doodle) => void;
  deleteDoodle: (id: string) => void;
  loadDoodle: (doodle: Doodle) => void;
  setGalleryPage: (page: number) => void;
  setGalleryOpen: (open: boolean) => void;
  toggleGallery: () => void;
  presetColors: string[];
}

export const useCanvasStore = create<CanvasState>((set) => ({
  brushSettings: {
    color: PRESET_COLORS[0],
    size: 8,
    blendMode: 'normal'
  },
  viewport: {
    offsetX: 0,
    offsetY: 0
  },
  currentStrokes: [],
  undoStack: [],
  redoStack: [],
  doodles: [],
  currentDoodleId: null,
  galleryPage: 1,
  galleryPageSize: 20,
  isGalleryOpen: false,
  presetColors: PRESET_COLORS,

  setColor: (color) => set((state) => ({
    brushSettings: { ...state.brushSettings, color }
  })),

  setSize: (size) => set((state) => ({
    brushSettings: { ...state.brushSettings, size: Math.max(1, Math.min(50, size)) }
  })),

  setBlendMode: (mode) => set((state) => ({
    brushSettings: { ...state.brushSettings, blendMode: mode }
  })),

  setViewport: (offsetX, offsetY) => set({
    viewport: { offsetX, offsetY }
  }),

  addStroke: (stroke) => set((state) => {
    const newStrokes = [...state.currentStrokes, stroke];
    const newUndoStack = [...state.undoStack, state.currentStrokes].slice(-MAX_HISTORY);
    return {
      currentStrokes: newStrokes,
      undoStack: newUndoStack,
      redoStack: []
    };
  }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previous = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    const newRedoStack = [...state.redoStack, state.currentStrokes].slice(-MAX_HISTORY);
    return {
      currentStrokes: previous,
      undoStack: newUndoStack,
      redoStack: newRedoStack
    };
  }),

  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state;
    const next = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    const newUndoStack = [...state.undoStack, state.currentStrokes].slice(-MAX_HISTORY);
    return {
      currentStrokes: next,
      undoStack: newUndoStack,
      redoStack: newRedoStack
    };
  }),

  clearCanvas: () => set((state) => ({
    currentStrokes: [],
    undoStack: [...state.undoStack, state.currentStrokes].slice(-MAX_HISTORY),
    redoStack: [],
    currentDoodleId: null
  })),

  setDoodles: (doodles) => set({ doodles }),

  addDoodle: (doodle) => set((state) => ({
    doodles: [doodle, ...state.doodles]
  })),

  deleteDoodle: (id) => set((state) => ({
    doodles: state.doodles.filter((d) => d.id !== id),
    currentDoodleId: state.currentDoodleId === id ? null : state.currentDoodleId
  })),

  loadDoodle: (doodle) => set({
    currentStrokes: [...doodle.strokes],
    undoStack: [],
    redoStack: [],
    currentDoodleId: doodle.id
  }),

  setGalleryPage: (page) => set({ galleryPage: page }),

  setGalleryOpen: (open) => set({ isGalleryOpen: open }),

  toggleGallery: () => set((state) => ({ isGalleryOpen: !state.isGalleryOpen }))
}));

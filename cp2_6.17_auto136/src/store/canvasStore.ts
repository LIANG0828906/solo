import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  BrushSettings,
  BlendMode,
  Doodle,
  Stroke,
  Viewport,
  Point,
} from '@/types';
import { MAX_HISTORY, GALLERY_PAGE_SIZE } from '@/types';
import {
  initDB,
  saveDoodle as storageSave,
  getDoodle,
  listDoodles,
  deleteDoodle as storageDelete,
  exportDoodle as storageExport,
} from '@/modules/storageManager';

interface CanvasState {
  brush: BrushSettings;
  currentDoodleId: string | null;
  currentDoodleName: string;
  strokes: Stroke[];
  activeStroke: Stroke | null;
  undoStack: Stroke[][];
  redoStack: Stroke[][];
  viewport: Viewport;
  gallery: Doodle[];
  galleryPage: number;
  galleryTotal: number;
  isGalleryOpen: boolean;
  isSaving: boolean;

  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBlendMode: (mode: BlendMode) => void;

  setViewport: (vp: Viewport) => void;

  startStroke: (point: Point) => void;
  appendStrokePoint: (point: Point) => void;
  finishStroke: () => void;

  undo: () => void;
  redo: () => void;

  saveCurrentDoodle: (thumbnail: string) => Promise<void>;
  loadDoodle: (id: string) => Promise<void>;
  deleteDoodle: (id: string) => Promise<void>;
  exportDoodle: (id: string) => Promise<void>;
  newDoodle: () => void;

  loadGallery: (page?: number) => Promise<void>;
  setGalleryPage: (page: number) => Promise<void>;
  toggleGallery: () => void;
  setGalleryOpen: (open: boolean) => void;

  initApp: () => Promise<void>;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  brush: {
    color: '#3498DB',
    size: 8,
    blendMode: 'normal',
  },
  currentDoodleId: null,
  currentDoodleName: '未命名作品',
  strokes: [],
  activeStroke: null,
  undoStack: [],
  redoStack: [],
  viewport: { offsetX: 0, offsetY: 0 },
  gallery: [],
  galleryPage: 1,
  galleryTotal: 0,
  isGalleryOpen: false,
  isSaving: false,

  setBrushColor: (color) =>
    set((s) => ({ brush: { ...s.brush, color } })),

  setBrushSize: (size) =>
    set((s) => ({ brush: { ...s.brush, size: Math.max(1, Math.min(50, size)) } })),

  setBlendMode: (mode) =>
    set((s) => ({ brush: { ...s.brush, blendMode: mode } })),

  setViewport: (viewport) => set({ viewport }),

  startStroke: (point) => {
    const { brush } = get();
    const stroke: Stroke = {
      id: uuidv4(),
      color: brush.color,
      size: brush.size,
      blendMode: brush.blendMode,
      points: [point],
    };
    set({ activeStroke: stroke, redoStack: [] });
  },

  appendStrokePoint: (point) => {
    const { activeStroke } = get();
    if (!activeStroke) return;
    set({
      activeStroke: {
        ...activeStroke,
        points: [...activeStroke.points, point],
      },
    });
  },

  finishStroke: () => {
    const { activeStroke, strokes, undoStack } = get();
    if (!activeStroke || activeStroke.points.length < 1) {
      set({ activeStroke: null });
      return;
    }
    const newStrokes = [...strokes, activeStroke];
    const newUndo = [...undoStack, strokes];
    if (newUndo.length > MAX_HISTORY) newUndo.shift();
    set({
      strokes: newStrokes,
      activeStroke: null,
      undoStack: newUndo,
    });
  },

  undo: () => {
    const { undoStack, strokes, redoStack } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    const newRedo = [...redoStack, strokes];
    if (newRedo.length > MAX_HISTORY) newRedo.shift();
    set({ strokes: prev, undoStack: newUndo, redoStack: newRedo });
  },

  redo: () => {
    const { redoStack, strokes, undoStack } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newUndo = [...undoStack, strokes];
    if (newUndo.length > MAX_HISTORY) newUndo.shift();
    set({ strokes: next, undoStack: newUndo, redoStack: newRedo });
  },

  saveCurrentDoodle: async (thumbnail) => {
    const { strokes, currentDoodleId, currentDoodleName } = get();
    if (strokes.length === 0) return;
    set({ isSaving: true });
    try {
      const now = Date.now();
      const doodle: Doodle = {
        id: currentDoodleId || uuidv4(),
        name: currentDoodleName,
        thumbnail,
        strokes: strokes.map((s) => ({ ...s })),
        createdAt: currentDoodleId ? (await getDoodle(currentDoodleId))?.createdAt || now : now,
        updatedAt: now,
      };
      await storageSave(doodle);
      set({ currentDoodleId: doodle.id, isSaving: false });
      await get().loadGallery(get().galleryPage);
    } catch (err) {
      console.error('Save failed:', err);
      set({ isSaving: false });
    }
  },

  loadDoodle: async (id) => {
    const doodle = await getDoodle(id);
    if (!doodle) return;
    set({
      currentDoodleId: doodle.id,
      currentDoodleName: doodle.name,
      strokes: doodle.strokes.map((s) => ({ ...s, points: [...s.points] })),
      undoStack: [],
      redoStack: [],
      viewport: { offsetX: 0, offsetY: 0 },
      activeStroke: null,
    });
  },

  deleteDoodle: async (id) => {
    await storageDelete(id);
    const { currentDoodleId, galleryPage } = get();
    if (currentDoodleId === id) {
      get().newDoodle();
    }
    await get().loadGallery(galleryPage);
  },

  exportDoodle: async (id) => {
    await storageExport(id);
  },

  newDoodle: () => {
    set({
      currentDoodleId: null,
      currentDoodleName: '未命名作品',
      strokes: [],
      undoStack: [],
      redoStack: [],
      activeStroke: null,
    });
  },

  loadGallery: async (page = 1) => {
    const { items, total } = await listDoodles(page, GALLERY_PAGE_SIZE);
    set({ gallery: items, galleryPage: page, galleryTotal: total });
  },

  setGalleryPage: async (page) => {
    await get().loadGallery(page);
  },

  toggleGallery: () => set((s) => ({ isGalleryOpen: !s.isGalleryOpen })),

  setGalleryOpen: (open) => set({ isGalleryOpen: open }),

  initApp: async () => {
    await initDB();
    await get().loadGallery(1);
  },
}));

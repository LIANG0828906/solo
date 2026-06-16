import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Shape, ToolType, ActionRecord, ViewTransform } from '../types';

interface CanvasState {
  shapes: Shape[];
  past: Shape[][];
  future: Shape[][];
  currentTool: ToolType;
  currentColor: string;
  lineWidth: number;
  fillColor: string;
  userId: string;
  actionRecords: ActionRecord[];
  maxHistory: number;
  viewTransform: ViewTransform;
  isPlayback: boolean;
  playbackIndex: number;
  playbackSpeed: number;
  playbackShapes: Shape[];
  isExporting: boolean;
  showNoteInput: { x: number; y: number } | null;

  setCurrentTool: (tool: ToolType) => void;
  setCurrentColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  setFillColor: (color: string) => void;

  addShape: (shape: Shape) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
  clearShapes: () => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  setViewTransform: (transform: Partial<ViewTransform>) => void;
  resetView: () => void;

  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackIndex: (index: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackShapes: (shapes: Shape[]) => void;
  stepPlayback: () => boolean;

  setIsExporting: (value: boolean) => void;
  setShowNoteInput: (value: { x: number; y: number } | null) => void;
  addNote: (x: number, y: number, text: string) => void;
}

const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);

const initialViewTransform: ViewTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  past: [],
  future: [],
  currentTool: 'brush',
  currentColor: '#333333',
  lineWidth: 3,
  fillColor: 'transparent',
  userId: USER_ID,
  actionRecords: [],
  maxHistory: 100,
  viewTransform: initialViewTransform,
  isPlayback: false,
  playbackIndex: -1,
  playbackSpeed: 1,
  playbackShapes: [],
  isExporting: false,
  showNoteInput: null,

  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCurrentColor: (color) => set({ currentColor: color }),
  setLineWidth: (width) => set({ lineWidth: width }),
  setFillColor: (color) => set({ fillColor: color }),

  addShape: (shape) => {
    const { shapes, actionRecords, userId } = get();
    const newShapes = [...shapes, shape];
    const record: ActionRecord = {
      id: uuidv4(),
      shape,
      timestamp: Date.now(),
      userId,
      action: 'add',
    };
    set({
      shapes: newShapes,
      actionRecords: [...actionRecords, record],
    });
  },

  updateShape: (id, updates) => {
    const { shapes, actionRecords, userId } = get();
    const newShapes = shapes.map((s) =>
      s.id === id ? ({ ...s, ...updates } as Shape) : s
    );
    const updatedShape = newShapes.find((s) => s.id === id);
    if (updatedShape) {
      const record: ActionRecord = {
        id: uuidv4(),
        shape: updatedShape,
        timestamp: Date.now(),
        userId,
        action: 'update',
      };
      set({
        shapes: newShapes,
        actionRecords: [...actionRecords, record],
      });
    }
  },

  deleteShape: (id) => {
    const { shapes, actionRecords, userId } = get();
    const shapeToDelete = shapes.find((s) => s.id === id);
    const newShapes = shapes.filter((s) => s.id !== id);
    if (shapeToDelete) {
      const record: ActionRecord = {
        id: uuidv4(),
        shape: shapeToDelete,
        timestamp: Date.now(),
        userId,
        action: 'delete',
      };
      set({
        shapes: newShapes,
        actionRecords: [...actionRecords, record],
      });
    }
  },

  clearShapes: () => set({ shapes: [] }),

  pushHistory: () => {
    const { shapes, past, maxHistory } = get();
    const newPast = [...past, [...shapes]];
    if (newPast.length > maxHistory) {
      newPast.shift();
    }
    set({ past: newPast, future: [] });
  },

  undo: () => {
    const { past, future, shapes } = get();
    if (past.length === 0) return;
    const newPast = [...past];
    const previous = newPast.pop()!;
    const newFuture = [shapes, ...future];
    set({ past: newPast, future: newFuture, shapes: previous });
  },

  redo: () => {
    const { past, future, shapes } = get();
    if (future.length === 0) return;
    const newFuture = [...future];
    const next = newFuture.shift()!;
    const newPast = [...past, shapes];
    set({ past: newPast, future: newFuture, shapes: next });
  },

  setViewTransform: (transform) =>
    set((state) => ({
      viewTransform: { ...state.viewTransform, ...transform },
    })),

  resetView: () => set({ viewTransform: initialViewTransform }),

  startPlayback: () => {
    set({
      isPlayback: true,
      playbackIndex: -1,
      playbackShapes: [],
    });
  },

  stopPlayback: () =>
    set({
      isPlayback: false,
      playbackIndex: -1,
      playbackShapes: [],
    }),

  setPlaybackIndex: (index) => {
    const { actionRecords } = get();
    const addRecords = actionRecords.filter((r) => r.action === 'add');
    const shapes = addRecords.slice(0, index + 1).map((r) => r.shape);
    set({ playbackIndex: index, playbackShapes: shapes });
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setPlaybackShapes: (shapes) => set({ playbackShapes: shapes }),

  stepPlayback: () => {
    const { playbackIndex, actionRecords } = get();
    const addRecords = actionRecords.filter((r) => r.action === 'add');
    if (playbackIndex < addRecords.length - 1) {
      const nextIndex = playbackIndex + 1;
      const shapes = addRecords.slice(0, nextIndex + 1).map((r) => r.shape);
      set({ playbackIndex: nextIndex, playbackShapes: shapes });
      return true;
    }
    return false;
  },

  setIsExporting: (value) => set({ isExporting: value }),

  setShowNoteInput: (value) => set({ showNoteInput: value }),

  addNote: (x, y, text) => {
    const { currentColor, userId } = get();
    const note: Shape = {
      id: uuidv4(),
      type: 'note',
      x,
      y,
      width: 200,
      height: 120,
      color: currentColor,
      lineWidth: 1,
      fillColor: '#FFF9C4',
      text,
      createdAt: Date.now(),
      userId,
    };
    get().pushHistory();
    get().addShape(note);
  },
}));

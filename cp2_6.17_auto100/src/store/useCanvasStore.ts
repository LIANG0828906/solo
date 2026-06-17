import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ToolType = 'brush' | 'airbrush' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface DrawAction {
  id: string;
  tool: ToolType;
  color: string;
  lineWidth: number;
  points: Point[];
}

interface CanvasState {
  tool: ToolType;
  color: string;
  lineWidth: number;
  undoStack: DrawAction[];
  redoStack: DrawAction[];
  maxHistorySize: number;
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setLineWidth: (width: number) => void;
  addAction: (action: Omit<DrawAction, 'id'>) => void;
  undo: () => DrawAction | null;
  redo: () => DrawAction | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoStack: () => DrawAction[];
  clearHistory: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  tool: 'brush',
  color: '#FF6B6B',
  lineWidth: 3,
  undoStack: [],
  redoStack: [],
  maxHistorySize: 20,

  setTool: (tool: ToolType) => set({ tool }),
  setColor: (color: string) => set({ color }),
  setLineWidth: (lineWidth: number) => set({ lineWidth }),

  addAction: (action) => {
    const newAction: DrawAction = {
      ...action,
      id: uuidv4(),
    };
    set((state) => {
      let newUndoStack = [...state.undoStack, newAction];
      if (newUndoStack.length > state.maxHistorySize) {
        newUndoStack = newUndoStack.slice(-state.maxHistorySize);
      }
      return {
        undoStack: newUndoStack,
        redoStack: [],
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return null;
    const lastAction = state.undoStack[state.undoStack.length - 1];
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, lastAction],
    }));
    return lastAction;
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return null;
    const nextAction = state.redoStack[state.redoStack.length - 1];
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, nextAction],
    }));
    return nextAction;
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
  getUndoStack: () => get().undoStack,
  clearHistory: () => set({ undoStack: [], redoStack: [] }),
}));

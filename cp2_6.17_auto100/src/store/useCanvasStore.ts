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

interface HistoryBuffer {
  buffer: (DrawAction | null)[];
  start: number;
  count: number;
}

function createHistoryBuffer(capacity: number): HistoryBuffer {
  return {
    buffer: new Array(capacity).fill(null),
    start: 0,
    count: 0,
  };
}

function pushHistory(buffer: HistoryBuffer, item: DrawAction): void {
  const capacity = buffer.buffer.length;
  if (buffer.count === capacity) {
    buffer.buffer[buffer.start] = null;
    buffer.start = (buffer.start + 1) % capacity;
    buffer.count--;
  }
  const end = (buffer.start + buffer.count) % capacity;
  buffer.buffer[end] = item;
  buffer.count++;
}

function popHistory(buffer: HistoryBuffer): DrawAction | null {
  if (buffer.count === 0) return null;
  const capacity = buffer.buffer.length;
  const end = (buffer.start + buffer.count - 1) % capacity;
  const item = buffer.buffer[end];
  buffer.buffer[end] = null;
  buffer.count--;
  return item;
}

function getHistoryItems(buffer: HistoryBuffer): DrawAction[] {
  const result: DrawAction[] = [];
  const capacity = buffer.buffer.length;
  for (let i = 0; i < buffer.count; i++) {
    const idx = (buffer.start + i) % capacity;
    const item = buffer.buffer[idx];
    if (item) {
      result.push(item);
    }
  }
  return result;
}

function cloneHistoryBuffer(buffer: HistoryBuffer): HistoryBuffer {
  return {
    buffer: [...buffer.buffer],
    start: buffer.start,
    count: buffer.count,
  };
}

interface CanvasState {
  tool: ToolType;
  color: string;
  lineWidth: number;
  undoBuffer: HistoryBuffer;
  redoBuffer: HistoryBuffer;
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

export const useCanvasStore = create<CanvasState>((set, get) => {
  const MAX_HISTORY = 20;

  return {
    tool: 'brush',
    color: '#FF6B6B',
    lineWidth: 3,
    undoBuffer: createHistoryBuffer(MAX_HISTORY),
    redoBuffer: createHistoryBuffer(MAX_HISTORY),
    maxHistorySize: MAX_HISTORY,

    setTool: (tool: ToolType) => set({ tool }),
    setColor: (color: string) => set({ color }),
    setLineWidth: (lineWidth: number) => set({ lineWidth }),

    addAction: (action) => {
      const newAction: DrawAction = {
        ...action,
        id: uuidv4(),
      };
      set((state) => {
        const newUndoBuffer = cloneHistoryBuffer(state.undoBuffer);
        pushHistory(newUndoBuffer, newAction);
        return {
          undoBuffer: newUndoBuffer,
          redoBuffer: createHistoryBuffer(state.maxHistorySize),
        };
      });
    },

    undo: () => {
      const state = get();
      if (state.undoBuffer.count === 0) return null;

      const action = popHistory(state.undoBuffer);
      if (!action) return null;

      set((s) => {
        const newUndoBuffer = cloneHistoryBuffer(s.undoBuffer);
        const popped = popHistory(newUndoBuffer);
        if (!popped) return s;

        const newRedoBuffer = cloneHistoryBuffer(s.redoBuffer);
        pushHistory(newRedoBuffer, popped);

        return {
          undoBuffer: newUndoBuffer,
          redoBuffer: newRedoBuffer,
        };
      });
      return action;
    },

    redo: () => {
      const state = get();
      if (state.redoBuffer.count === 0) return null;

      const action = popHistory(state.redoBuffer);
      if (!action) return null;

      set((s) => {
        const newRedoBuffer = cloneHistoryBuffer(s.redoBuffer);
        const popped = popHistory(newRedoBuffer);
        if (!popped) return s;

        const newUndoBuffer = cloneHistoryBuffer(s.undoBuffer);
        pushHistory(newUndoBuffer, popped);

        return {
          undoBuffer: newUndoBuffer,
          redoBuffer: newRedoBuffer,
        };
      });
      return action;
    },

    canUndo: () => get().undoBuffer.count > 0,
    canRedo: () => get().redoBuffer.count > 0,
    getUndoStack: () => getHistoryItems(get().undoBuffer),
    clearHistory: () => set({
      undoBuffer: createHistoryBuffer(MAX_HISTORY),
      redoBuffer: createHistoryBuffer(MAX_HISTORY),
    }),
  };
});

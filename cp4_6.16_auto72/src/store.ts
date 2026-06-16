import { create } from 'zustand';
import type {
  CanvasElement,
  ToolType,
  ConnectionStatus,
  CanvasOperation,
  Point,
  StickyNoteElement,
} from './types';
import { v4 as uuidv4 } from 'uuid';

interface HistoryEntry {
  operation: CanvasOperation;
  previousElements: CanvasElement[];
}

interface CanvasState {
  elements: CanvasElement[];
  currentTool: ToolType;
  currentColor: string;
  connectionStatus: ConnectionStatus;
  selectedIds: string[];
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxHistorySize: number;
  isDrawing: boolean;
  currentDrawingId: string | null;
  drawingStartPoint: Point | null;

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;

  addElement: (element: CanvasElement, recordHistory?: boolean) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>, recordHistory?: boolean) => void;
  deleteElement: (id: string, recordHistory?: boolean) => void;
  deleteSelectedElements: () => void;

  selectElement: (id: string, multi?: boolean) => void;
  selectElementsInRect: (startX: number, startY: number, endX: number, endY: number) => void;
  clearSelection: () => void;

  startDrawing: (point: Point) => void;
  updateDrawing: (point: Point) => void;
  endDrawing: () => CanvasElement | null;

  undo: () => void;
  redo: () => void;

  loadSnapshot: (elements: CanvasElement[]) => void;
  addStickyNote: (x: number, y: number) => void;
  moveSelected: (dx: number, dy: number) => void;

  animateDelete: (id: string) => void;
  finishDeleteAnimation: (id: string) => void;
}

const getElementBounds = (element: CanvasElement) => {
  switch (element.type) {
    case 'pencil': {
      const xs = element.points.map((p) => p.x);
      const ys = element.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    }
    case 'rectangle': {
      const x = element.x;
      const y = element.y;
      const w = element.width;
      const h = element.height;
      return {
        minX: Math.min(x, x + w),
        maxX: Math.max(x, x + w),
        minY: Math.min(y, y + h),
        maxY: Math.max(y, y + h),
      };
    }
    case 'stickyNote': {
      return {
        minX: element.x,
        maxX: element.x + element.width,
        minY: element.y,
        maxY: element.y + element.height,
      };
    }
  }
};

const pointInElement = (x: number, y: number, element: CanvasElement): boolean => {
  const bounds = getElementBounds(element);
  const padding = 5;
  return (
    x >= bounds.minX - padding &&
    x <= bounds.maxX + padding &&
    y >= bounds.minY - padding &&
    y <= bounds.maxY + padding
  );
};

const getTopmostElementAtPoint = (
  x: number,
  y: number,
  elements: CanvasElement[]
): CanvasElement | null => {
  const visible = elements.filter((e) => !e.isDeleted);
  for (let i = visible.length - 1; i >= 0; i--) {
    if (pointInElement(x, y, visible[i])) {
      return visible[i];
    }
  }
  return null;
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  currentTool: 'pencil',
  currentColor: '#FF6B6B',
  connectionStatus: 'disconnected',
  selectedIds: [],
  undoStack: [],
  redoStack: [],
  maxHistorySize: 5,
  isDrawing: false,
  currentDrawingId: null,
  drawingStartPoint: null,

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  addElement: (element, recordHistory = true) => {
    const prevElements = get().elements;
    set((state) => {
      const newElements = [...state.elements, element];
      return { elements: newElements };
    });

    if (recordHistory) {
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'add',
          id: element.id,
          payload: element,
          timestamp: Date.now(),
          clientId: 'local',
        },
        previousElements: prevElements,
      };
      set((state) => {
        const newUndoStack = [...state.undoStack, historyEntry].slice(-state.maxHistorySize);
        return { undoStack: newUndoStack, redoStack: [] };
      });
    }
  },

  updateElement: (id, updates, recordHistory = true) => {
    const prevElements = get().elements;
    const oldElement = prevElements.find((e) => e.id === id);

    set((state) => ({
      elements: state.elements.map((e) =>
        e.id === id
          ? ({ ...e, ...updates, updatedAt: Date.now() } as CanvasElement)
          : e
      ),
    }));

    if (recordHistory && oldElement) {
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'update',
          id,
          payload: { ...oldElement, ...updates } as CanvasElement,
          timestamp: Date.now(),
          clientId: 'local',
        },
        previousElements: prevElements,
      };
      set((state) => {
        const newUndoStack = [...state.undoStack, historyEntry].slice(-state.maxHistorySize);
        return { undoStack: newUndoStack, redoStack: [] };
      });
    }
  },

  deleteElement: (id, recordHistory = true) => {
    const prevElements = get().elements;
    const element = prevElements.find((e) => e.id === id);

    set((state) => ({
      elements: state.elements.filter((e) => e.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));

    if (recordHistory && element) {
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'delete',
          id,
          payload: element,
          timestamp: Date.now(),
          clientId: 'local',
        },
        previousElements: prevElements,
      };
      set((state) => {
        const newUndoStack = [...state.undoStack, historyEntry].slice(-state.maxHistorySize);
        return { undoStack: newUndoStack, redoStack: [] };
      });
    }
  },

  deleteSelectedElements: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => get().animateDelete(id));

    setTimeout(() => {
      selectedIds.forEach((id) => {
        get().finishDeleteAnimation(id);
      });
    }, 300);
  },

  animateDelete: (id) => {
    set((state) => ({
      elements: state.elements.map((e) =>
        e.id === id ? { ...e, isDeleted: true, deleteAnimation: true } : e
      ),
    }));
  },

  finishDeleteAnimation: (id) => {
    get().deleteElement(id);
  },

  selectElement: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const newSelected = state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id];
        return { selectedIds: newSelected };
      }
      return { selectedIds: [id] };
    });
  },

  selectElementsInRect: (startX, startY, endX, endY) => {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    set((state) => {
      const selected = state.elements
        .filter((e) => !e.isDeleted)
        .filter((e) => {
          const bounds = getElementBounds(e);
          return (
            bounds.minX >= minX &&
            bounds.maxX <= maxX &&
            bounds.minY >= minY &&
            bounds.maxY <= maxY
          );
        })
        .map((e) => e.id);
      return { selectedIds: selected };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  startDrawing: (point) => {
    const { currentTool, currentColor } = get();
    const id = uuidv4();
    const now = Date.now();

    if (currentTool === 'pencil') {
      const element: CanvasElement = {
        id,
        type: 'pencil',
        x: point.x,
        y: point.y,
        color: currentColor,
        createdAt: now,
        updatedAt: now,
        points: [{ x: point.x, y: point.y }],
        lineWidth: 6,
      };
      get().addElement(element, false);
      set({ isDrawing: true, currentDrawingId: id, drawingStartPoint: point });
    } else if (currentTool === 'rectangle') {
      const element: CanvasElement = {
        id,
        type: 'rectangle',
        x: point.x,
        y: point.y,
        color: currentColor,
        createdAt: now,
        updatedAt: now,
        width: 0,
        height: 0,
        filled: false,
        lineWidth: 3,
      };
      get().addElement(element, false);
      set({ isDrawing: true, currentDrawingId: id, drawingStartPoint: point });
    } else if (currentTool === 'stickyNote') {
      get().addStickyNote(point.x, point.y);
    }
  },

  updateDrawing: (point) => {
    const { isDrawing, currentDrawingId, currentTool, drawingStartPoint } = get();
    if (!isDrawing || !currentDrawingId || !drawingStartPoint) return;

    if (currentTool === 'pencil') {
      set((state) => ({
        elements: state.elements.map((e) => {
          if (e.id === currentDrawingId && e.type === 'pencil') {
            return { ...e, points: [...e.points, { x: point.x, y: point.y }], updatedAt: Date.now() };
          }
          return e;
        }),
      }));
    } else if (currentTool === 'rectangle') {
      const dx = point.x - drawingStartPoint.x;
      const dy = point.y - drawingStartPoint.y;
      set((state) => ({
        elements: state.elements.map((e) => {
          if (e.id === currentDrawingId && e.type === 'rectangle') {
            return {
              ...e,
              x: dx >= 0 ? drawingStartPoint.x : point.x,
              y: dy >= 0 ? drawingStartPoint.y : point.y,
              width: Math.abs(dx),
              height: Math.abs(dy),
              updatedAt: Date.now(),
            };
          }
          return e;
        }),
      }));
    }
  },

  endDrawing: () => {
    const { currentDrawingId, elements } = get();
    const element = elements.find((e) => e.id === currentDrawingId);

    if (element) {
      const prevElements = elements.filter((e) => e.id !== currentDrawingId);
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'add',
          id: element.id,
          payload: element,
          timestamp: Date.now(),
          clientId: 'local',
        },
        previousElements: prevElements,
      };
      set((state) => {
        const newUndoStack = [...state.undoStack, historyEntry].slice(-state.maxHistorySize);
        return { undoStack: newUndoStack, redoStack: [] };
      });
    }

    set({ isDrawing: false, currentDrawingId: null, drawingStartPoint: null });
    return element || null;
  },

  undo: () => {
    const { undoStack, elements } = get();
    if (undoStack.length === 0) return;

    const lastEntry = undoStack[undoStack.length - 1];

    set((state) => ({
      elements: lastEntry.previousElements,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [
        ...state.redoStack,
        { ...lastEntry, previousElements: elements },
      ].slice(-state.maxHistorySize),
      selectedIds: [],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const nextEntry = redoStack[redoStack.length - 1];
    const currentElements = get().elements;

    let newElements: CanvasElement[] = [];
    if (nextEntry.operation.type === 'add') {
      newElements = [...currentElements, nextEntry.operation.payload as CanvasElement];
    } else if (nextEntry.operation.type === 'delete') {
      newElements = currentElements.filter(
        (e) => e.id !== nextEntry.operation.id
      );
    } else if (nextEntry.operation.type === 'update') {
      newElements = currentElements.map((e) =>
        e.id === nextEntry.operation.id
          ? (nextEntry.operation.payload as CanvasElement)
          : e
      );
    }

    set((state) => ({
      elements: newElements,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [
        ...state.undoStack,
        { ...nextEntry, previousElements: currentElements },
      ].slice(-state.maxHistorySize),
      selectedIds: [],
    }));
  },

  loadSnapshot: (snapshotElements) => {
    set({ elements: [...snapshotElements], undoStack: [], redoStack: [], selectedIds: [] });
  },

  addStickyNote: (x, y) => {
    const id = uuidv4();
    const now = Date.now();
    const element: StickyNoteElement = {
      id,
      type: 'stickyNote',
      x: x - 110,
      y: y - 110,
      color: '#FFEB3B',
      createdAt: now,
      updatedAt: now,
      width: 220,
      height: 220,
      text: '',
      isNew: true,
    };
    get().addElement(element);

    setTimeout(() => {
      get().updateElement(id, { isNew: false } as Partial<CanvasElement>, false);
    }, 300);
  },

  moveSelected: (dx, dy) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      const element = get().elements.find((e) => e.id === id);
      if (!element) return;

      if (element.type === 'pencil') {
        set((state) => ({
          elements: state.elements.map((e) => {
            if (e.id === id && e.type === 'pencil') {
              return {
                ...e,
                x: e.x + dx,
                y: e.y + dy,
                points: e.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
                updatedAt: Date.now(),
              };
            }
            return e;
          }),
        }));
      } else {
        set((state) => ({
          elements: state.elements.map((e) =>
            e.id === id ? { ...e, x: e.x + dx, y: e.y + dy, updatedAt: Date.now() } : e
          ),
        }));
      }
    });
  },
}));

export { getTopmostElementAtPoint, getElementBounds, pointInElement };

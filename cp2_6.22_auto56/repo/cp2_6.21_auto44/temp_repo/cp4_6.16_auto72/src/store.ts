import { create } from 'zustand';
import type {
  CanvasElement,
  ToolType,
  ConnectionStatus,
  CanvasOperation,
  Point,
  StickyNoteElement,
  Rect,
} from './types';
import { v4 as uuidv4 } from 'uuid';

interface HistoryEntry {
  operation: CanvasOperation;
  previousElements: CanvasElement[];
  elementIds: string[];
}

interface PendingAnimation {
  elementId: string;
  type: 'enter' | 'delete' | 'undo' | 'redo';
  startTime: number;
  duration: number;
  fromState?: Partial<CanvasElement>;
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
  sequenceCounter: number;
  pendingAnimations: Map<string, PendingAnimation>;
  editingNoteId: string | null;
  isDraggingSelection: boolean;
  dragStartPos: Point | null;

  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;

  addElement: (element: CanvasElement, recordHistory?: boolean, animate?: boolean) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>, recordHistory?: boolean) => void;
  deleteElement: (id: string, recordHistory?: boolean, animate?: boolean) => void;
  deleteSelectedElements: () => void;
  finishDeleteAnimation: (id: string) => void;

  selectElement: (id: string, multi?: boolean) => void;
  selectElementsInRect: (startX: number, startY: number, endX: number, endY: number) => void;
  clearSelection: () => void;
  setEditingNote: (id: string | null) => void;

  startDrawing: (point: Point) => void;
  updateDrawing: (point: Point) => void;
  endDrawing: () => CanvasElement | null;

  undo: () => void;
  redo: () => void;

  loadSnapshot: (elements: CanvasElement[], baseSequence?: number) => void;
  addStickyNote: (x: number, y: number) => void;

  getSequence: () => number;
  incrementSequence: () => number;

  applyRemoteOperation: (op: CanvasOperation) => void;

  startDraggingSelection: (startPoint: Point) => void;
  updateDraggingSelection: (currentPoint: Point) => void;
  endDraggingSelection: () => void;

  getElementsInViewport: (viewport: Rect) => CanvasElement[];
}

export const getElementBounds = (element: CanvasElement): { minX: number; minY: number; maxX: number; maxY: number } => {
  switch (element.type) {
    case 'pencil': {
      const xs = element.points.map((p) => p.x);
      const ys = element.points.map((p) => p.y);
      const pad = element.lineWidth / 2;
      return {
        minX: Math.min(...xs) - pad,
        maxX: Math.max(...xs) + pad,
        minY: Math.min(...ys) - pad,
        maxY: Math.max(...ys) + pad,
      };
    }
    case 'rectangle': {
      const x = element.x;
      const y = element.y;
      const w = element.width;
      const h = element.height;
      const pad = element.filled ? 0 : element.lineWidth / 2;
      return {
        minX: Math.min(x, x + w) - pad,
        maxX: Math.max(x, x + w) + pad,
        minY: Math.min(y, y + h) - pad,
        maxY: Math.max(y, y + h) + pad,
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

export const getTopmostElementAtPoint = (
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

const rectIntersects = (r1: Rect, r2: { minX: number; minY: number; maxX: number; maxY: number }): boolean => {
  return (
    r1.x < r2.maxX &&
    r1.x + r1.width > r2.minX &&
    r1.y < r2.maxY &&
    r1.y + r1.height > r2.minY
  );
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
  sequenceCounter: 0,
  pendingAnimations: new Map(),
  editingNoteId: null,
  isDraggingSelection: false,
  dragStartPos: null,

  setTool: (tool) => set({ currentTool: tool, editingNoteId: null }),
  setColor: (color) => set({ currentColor: color }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setEditingNote: (id) => set({ editingNoteId: id }),

  getSequence: () => get().sequenceCounter,
  incrementSequence: () => {
    const next = get().sequenceCounter + 1;
    set({ sequenceCounter: next });
    return next;
  },

  addElement: (element, recordHistory = true, animate = true) => {
    const prevElements = get().elements;
    const seq = get().incrementSequence();
    const elWithSeq = { ...element, sequence: seq };

    if (animate) {
      elWithSeq.enterAnimationProgress = 0;
    }

    set((state) => {
      const newElements = [...state.elements, elWithSeq];
      return { elements: newElements };
    });

    if (recordHistory) {
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'add',
          id: element.id,
          payload: elWithSeq,
          timestamp: Date.now(),
          clientId: 'local',
          sequence: seq,
        },
        previousElements: prevElements,
        elementIds: [element.id],
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
      const seq = get().incrementSequence();
      const newElement = { ...oldElement, ...updates, updatedAt: Date.now(), sequence: seq };
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'update',
          id,
          payload: newElement as CanvasElement,
          timestamp: Date.now(),
          clientId: 'local',
          sequence: seq,
        },
        previousElements: prevElements,
        elementIds: [id],
      };
      set((state) => {
        const newUndoStack = [...state.undoStack, historyEntry].slice(-state.maxHistorySize);
        return { undoStack: newUndoStack, redoStack: [] };
      });
    }
  },

  deleteElement: (id, recordHistory = true, animate = true) => {
    const prevElements = get().elements;
    const element = prevElements.find((e) => e.id === id);

    if (!element) return;

    if (animate) {
      set((state) => ({
        elements: state.elements.map((e) =>
          e.id === id ? { ...e, isDeleted: true, deleteAnimationProgress: 0 } : e
        ),
        selectedIds: state.selectedIds.filter((sid) => sid !== id),
      }));
      return;
    }

    set((state) => ({
      elements: state.elements.filter((e) => e.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));

    if (recordHistory && element) {
      const seq = get().incrementSequence();
      const historyEntry: HistoryEntry = {
        operation: {
          type: 'delete',
          id,
          payload: { ...element, sequence: seq },
          timestamp: Date.now(),
          clientId: 'local',
          sequence: seq,
        },
        previousElements: prevElements,
        elementIds: [id],
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

    const prevElements = get().elements;
    const deletedElements = selectedIds
      .map((id) => prevElements.find((e) => e.id === id))
      .filter((e): e is CanvasElement => !!e);

    set((state) => ({
      elements: state.elements.map((e) =>
        selectedIds.includes(e.id)
          ? { ...e, isDeleted: true, deleteAnimationProgress: 0 }
          : e
      ),
      selectedIds: [],
    }));

    const seq = get().incrementSequence();
    const historyEntry: HistoryEntry = {
      operation: {
        type: 'delete',
        id: 'batch_' + Date.now(),
        payload: deletedElements.map((e) => ({ ...e, sequence: seq })),
        timestamp: Date.now(),
        clientId: 'local',
        sequence: seq,
      },
      previousElements: prevElements,
      elementIds: selectedIds,
    };

    set((state) => {
      const newUndoStack = [...state.undoStack, historyEntry].slice(-state.maxHistorySize);
      return { undoStack: newUndoStack, redoStack: [] };
    });
  },

  finishDeleteAnimation: (id) => {
    set((state) => ({
      elements: state.elements.filter((e) => e.id !== id),
    }));
  },

  selectElement: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const newSelected = state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id];
        return { selectedIds: newSelected, editingNoteId: null };
      }
      return { selectedIds: [id], editingNoteId: null };
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

  clearSelection: () => set({ selectedIds: [], editingNoteId: null }),

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
        sequence: 0,
        enterAnimationProgress: 1,
      };
      get().addElement(element, false, false);
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
        sequence: 0,
        enterAnimationProgress: 1,
      };
      get().addElement(element, false, false);
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
      const seq = get().incrementSequence();
      const elWithSeq = { ...element, sequence: seq };

      set((state) => ({
        elements: state.elements.map((e) => (e.id === currentDrawingId ? elWithSeq : e)),
      }));

      const historyEntry: HistoryEntry = {
        operation: {
          type: 'add',
          id: element.id,
          payload: elWithSeq,
          timestamp: Date.now(),
          clientId: 'local',
          sequence: seq,
        },
        previousElements: prevElements,
        elementIds: [element.id],
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
    const op = lastEntry.operation;
    const payloadArr = Array.isArray(op.payload) ? op.payload : [op.payload];
    const targetIds = new Set(payloadArr.map((p) => p.id));

    if (op.type === 'add') {
      set((state) => ({
        elements: state.elements.map((e) =>
          targetIds.has(e.id)
            ? { ...e, isDeleted: true, deleteAnimationProgress: 0 }
            : e
        ),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, { ...lastEntry, previousElements: elements }].slice(
          -state.maxHistorySize
        ),
        selectedIds: [],
        editingNoteId: null,
      }));
    } else if (op.type === 'delete') {
      const deletedElements = payloadArr.map((p) => ({
        ...p,
        isDeleted: false,
        enterAnimationProgress: 0,
      }));
      const existingIds = new Set(elements.map((e) => e.id));
      const toAdd = deletedElements.filter((e) => !existingIds.has(e.id));
      const updatedElements = elements.map((e) => {
        const restored = deletedElements.find((d) => d.id === e.id);
        return restored ? { ...restored } : e;
      });

      set((state) => ({
        elements: [...updatedElements, ...toAdd],
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, { ...lastEntry, previousElements: elements }].slice(
          -state.maxHistorySize
        ),
        selectedIds: [],
        editingNoteId: null,
      }));
    } else if (op.type === 'update') {
      const prevElements = lastEntry.previousElements;
      set((state) => ({
        elements: state.elements.map((e) => {
          const prev = prevElements.find((p) => p.id === e.id);
          return prev ? { ...prev } : e;
        }),
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, { ...lastEntry, previousElements: elements }].slice(
          -state.maxHistorySize
        ),
        selectedIds: [],
        editingNoteId: null,
      }));
    }
  },

  redo: () => {
    const { redoStack, elements } = get();
    if (redoStack.length === 0) return;

    const nextEntry = redoStack[redoStack.length - 1];
    const op = nextEntry.operation;
    const payloadArr = Array.isArray(op.payload) ? op.payload : [op.payload];
    const targetIds = new Set(payloadArr.map((p) => p.id));

    if (op.type === 'add') {
      const toAdd = payloadArr.map((p) => ({ ...p, enterAnimationProgress: 0 }));
      const existingIds = new Set(elements.map((e) => e.id));
      const newElements = toAdd.filter((e) => !existingIds.has(e.id));

      set((state) => ({
        elements: [...state.elements, ...newElements],
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, { ...nextEntry, previousElements: elements }].slice(
          -state.maxHistorySize
        ),
        selectedIds: [],
        editingNoteId: null,
      }));
    } else if (op.type === 'delete') {
      set((state) => ({
        elements: state.elements.map((e) =>
          targetIds.has(e.id)
            ? { ...e, isDeleted: true, deleteAnimationProgress: 0 }
            : e
        ),
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, { ...nextEntry, previousElements: elements }].slice(
          -state.maxHistorySize
        ),
        selectedIds: [],
        editingNoteId: null,
      }));
    } else if (op.type === 'update') {
      set((state) => ({
        elements: state.elements.map((e) => {
          const updated = payloadArr.find((p) => p.id === e.id);
          return updated ? ({ ...updated } as CanvasElement) : e;
        }),
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, { ...nextEntry, previousElements: elements }].slice(
          -state.maxHistorySize
        ),
        selectedIds: [],
        editingNoteId: null,
      }));
    }
  },

  loadSnapshot: (snapshotElements, baseSequence) => {
    const maxSeq = baseSequence ?? Math.max(...snapshotElements.map((e) => e.sequence || 0), 0);
    set({
      elements: snapshotElements.map((e) => ({ ...e, enterAnimationProgress: 1 })),
      undoStack: [],
      redoStack: [],
      selectedIds: [],
      sequenceCounter: maxSeq,
      editingNoteId: null,
    });
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
      sequence: 0,
      enterAnimationProgress: 0,
    };
    get().addElement(element as CanvasElement, true, true);
  },

  startDraggingSelection: (startPoint) => {
    set({ isDraggingSelection: true, dragStartPos: startPoint });
  },

  updateDraggingSelection: (currentPoint) => {
    const { isDraggingSelection, dragStartPos, selectedIds, elements } = get();
    if (!isDraggingSelection || !dragStartPos || selectedIds.length === 0) return;

    const dx = currentPoint.x - dragStartPos.x;
    const dy = currentPoint.y - dragStartPos.y;

    set((state) => ({
      elements: state.elements.map((e) => {
        if (!selectedIds.includes(e.id) || e.isDeleted) return e;

        if (e.type === 'pencil') {
          return {
            ...e,
            x: e.x + dx,
            y: e.y + dy,
            points: e.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            updatedAt: Date.now(),
          };
        }
        return {
          ...e,
          x: e.x + dx,
          y: e.y + dy,
          updatedAt: Date.now(),
        };
      }),
      dragStartPos: currentPoint,
    }));
  },

  endDraggingSelection: () => {
    const { selectedIds, isDraggingSelection } = get();
    if (!isDraggingSelection || selectedIds.length === 0) {
      set({ isDraggingSelection: false, dragStartPos: null });
      return;
    }

    set({ isDraggingSelection: false, dragStartPos: null });
  },

  applyRemoteOperation: (op) => {
    const opSeq = op.sequence || 0;
    const localSeq = get().sequenceCounter;

    if (opSeq <= localSeq && op.type !== 'snapshot') {
      return;
    }

    const payload = Array.isArray(op.payload) ? op.payload : [op.payload];

    switch (op.type) {
      case 'add': {
        set((state) => {
          const existingIds = new Set(state.elements.map((e) => e.id));
          const newElements = payload.filter((p) => !existingIds.has(p.id));
          return {
            elements: [
              ...state.elements,
              ...newElements.map((e) => ({ ...e, enterAnimationProgress: 1 })),
            ],
            sequenceCounter: Math.max(state.sequenceCounter, opSeq),
          };
        });
        break;
      }
      case 'update': {
        set((state) => ({
          elements: state.elements.map((e) => {
            const updated = payload.find((p) => p.id === e.id);
            if (updated && (updated.sequence || 0) >= e.sequence) {
              return { ...e, ...updated } as CanvasElement;
            }
            return e;
          }),
          sequenceCounter: Math.max(state.sequenceCounter, opSeq),
        }));
        break;
      }
      case 'delete': {
        set((state) => {
          const idsToDelete = new Set(payload.map((p) => p.id));
          return {
            elements: state.elements
              .filter((e) => !idsToDelete.has(e.id))
              .map((e) => (idsToDelete.has(e.id) ? { ...e, isDeleted: true } : e)),
            selectedIds: state.selectedIds.filter((id) => !idsToDelete.has(id)),
            sequenceCounter: Math.max(state.sequenceCounter, opSeq),
          };
        });
        break;
      }
      case 'snapshot': {
        const snapshotElements = payload as CanvasElement[];
        get().loadSnapshot(snapshotElements, opSeq);
        break;
      }
    }
  },

  getElementsInViewport: (viewport) => {
    const { elements } = get();
    return elements.filter((e) => {
      if (e.isDeleted) return false;
      const bounds = getElementBounds(e);
      return rectIntersects(viewport, bounds);
    });
  },
}));

export { pointInElement };

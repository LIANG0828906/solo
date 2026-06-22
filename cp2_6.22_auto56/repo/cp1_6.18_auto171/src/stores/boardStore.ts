import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { BoardElement, Snapshot, HistoryEntry, ToolType, PenColor, PenWidth, PathPoint } from '@/data/boardData';
import { MAX_HISTORY_SIZE } from '@/data/boardData';

interface BoardState {
  roomId: string;
  tool: ToolType;
  penColor: PenColor;
  penWidth: PenWidth;
  elements: BoardElement[];
  selectedElementId: string | null;
  snapshots: Snapshot[];
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  isDrawing: boolean;
  currentPath: PathPoint[];
  isDragging: boolean;
  dragStartPos: { x: number; y: number } | null;
  dragElementStartPos: { x: number; y: number } | null;
  showClearConfirm: boolean;
  showRollbackConfirm: string | null;
  showColorPicker: boolean;
  showWidthPicker: boolean;

  setRoomId: (roomId: string) => void;
  setTool: (tool: ToolType) => void;
  setPenColor: (color: PenColor) => void;
  setPenWidth: (width: PenWidth) => void;
  addElement: (element: BoardElement) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setElements: (elements: BoardElement[]) => void;
  clearElements: () => void;
  setSnapshots: (snapshots: Snapshot[]) => void;
  addSnapshot: (snapshot: Snapshot) => void;
  markSnapshotsExpired: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  pushUndo: (entry: HistoryEntry) => void;
  setIsDrawing: (val: boolean) => void;
  addPathPoint: (point: PathPoint) => void;
  clearCurrentPath: () => void;
  setIsDragging: (val: boolean) => void;
  setDragStartPos: (pos: { x: number; y: number } | null) => void;
  setDragElementStartPos: (pos: { x: number; y: number } | null) => void;
  setShowClearConfirm: (val: boolean) => void;
  setShowRollbackConfirm: (id: string | null) => void;
  setShowColorPicker: (val: boolean) => void;
  setShowWidthPicker: (val: boolean) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  roomId: '',
  tool: 'pen',
  penColor: '#333333',
  penWidth: 3,
  elements: [],
  selectedElementId: null,
  snapshots: [],
  undoStack: [],
  redoStack: [],
  isDrawing: false,
  currentPath: [],
  isDragging: false,
  dragStartPos: null,
  dragElementStartPos: null,
  showClearConfirm: false,
  showRollbackConfirm: null,
  showColorPicker: false,
  showWidthPicker: false,

  setRoomId: (roomId) => set({ roomId }),
  setTool: (tool) => set({ tool, showColorPicker: false, showWidthPicker: false }),
  setPenColor: (penColor) => set({ penColor }),
  setPenWidth: (penWidth) => set({ penWidth }),
  addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => el.id === id ? { ...el, ...updates, updatedAt: Date.now() } : el),
  })),
  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),
  selectElement: (id) => set({ selectedElementId: id }),
  setElements: (elements) => set({ elements }),
  clearElements: () => set({ elements: [], selectedElementId: null }),
  setSnapshots: (snapshots) => set({ snapshots }),
  addSnapshot: (snapshot) => set((state) => ({ snapshots: [snapshot, ...state.snapshots] })),
  markSnapshotsExpired: (ids) => set((state) => ({
    snapshots: state.snapshots.map((s) => ids.includes(s.id) ? { ...s, expired: true } : s),
  })),
  undo: () => {
    const { undoStack, redoStack, elements } = get();
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    let newElements = elements;
    switch (entry.type) {
      case 'add':
        newElements = elements.filter((el) => el.id !== entry.element?.id);
        break;
      case 'update':
        if (entry.previousElement) {
          newElements = elements.map((el) => el.id === entry.previousElement!.id ? entry.previousElement! : el);
        }
        break;
      case 'delete':
        if (entry.element) {
          newElements = [...elements, entry.element];
        }
        break;
      case 'clear':
        if (entry.clearedElements) {
          newElements = [...elements, ...entry.clearedElements];
        }
        break;
    }
    set({
      elements: newElements,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, entry],
    });
  },
  redo: () => {
    const { undoStack, redoStack, elements } = get();
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    let newElements = elements;
    switch (entry.type) {
      case 'add':
        if (entry.element) newElements = [...elements, entry.element];
        break;
      case 'update':
        if (entry.element) {
          newElements = elements.map((el) => el.id === entry.element!.id ? entry.element! : el);
        }
        break;
      case 'delete':
        newElements = elements.filter((el) => el.id !== entry.element?.id);
        break;
      case 'clear':
        newElements = [];
        break;
    }
    set({
      elements: newElements,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, entry],
    });
  },
  pushUndo: (entry) => set((state) => {
    const newStack = [...state.undoStack, entry];
    if (newStack.length > MAX_HISTORY_SIZE) newStack.shift();
    return { undoStack: newStack, redoStack: [] };
  }),
  setIsDrawing: (isDrawing) => set({ isDrawing }),
  addPathPoint: (point) => set((state) => ({ currentPath: [...state.currentPath, point] })),
  clearCurrentPath: () => set({ currentPath: [] }),
  setIsDragging: (isDragging) => set({ isDragging }),
  setDragStartPos: (dragStartPos) => set({ dragStartPos }),
  setDragElementStartPos: (dragElementStartPos) => set({ dragElementStartPos }),
  setShowClearConfirm: (showClearConfirm) => set({ showClearConfirm }),
  setShowRollbackConfirm: (showRollbackConfirm) => set({ showRollbackConfirm }),
  setShowColorPicker: (showColorPicker) => set({ showColorPicker }),
  setShowWidthPicker: (showWidthPicker) => set({ showWidthPicker }),
}));

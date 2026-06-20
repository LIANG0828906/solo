import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Board, BoardElement, Point } from '../types/board';
import { loadState, saveState, debounce } from '../utils/storageUtils';

interface HistorySnapshot {
  boards: Board[];
  activeBoardId: string;
}

interface BoardStore {
  boards: Board[];
  activeBoardId: string;
  selectedElementId: string | null;
  pageTransition: { active: boolean; direction: 'left' | 'right' };
  initFromStorage: () => void;
  getActiveBoard: () => Board | undefined;
  addBoard: (name?: string) => void;
  removeBoard: (id: string) => void;
  switchBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  setOffset: (offset: Point) => void;
  setZoom: (zoom: number) => void;
  addElement: (element: BoardElement, recordHistory?: boolean) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  startBatch: () => void;
  endBatch: () => void;
  _history: HistorySnapshot[];
  _historyIndex: number;
  _recordHistory: boolean;
  _batchDepth: number;
  _pushHistory: () => void;
  _persist: () => void;
}

function createDefaultBoard(name = '灵感板 1'): Board {
  return {
    id: uuidv4(),
    name,
    elements: [],
    zoom: 1,
    offset: { x: 0, y: 0 },
    maxZIndex: 0,
  };
}

function createInitialState() {
  const saved = loadState();
  if (saved && saved.boards.length > 0) {
    return {
      boards: saved.boards,
      activeBoardId: saved.activeBoardId,
    };
  }
  const defaultBoard = createDefaultBoard();
  return {
    boards: [defaultBoard],
    activeBoardId: defaultBoard.id,
  };
}

const debouncedPersist = debounce((state: { boards: Board[]; activeBoardId: string }) => {
  saveState({ boards: state.boards, activeBoardId: state.activeBoardId });
}, 300);

export const useBoardStore = create<BoardStore>((set, get) => ({
  boards: [],
  activeBoardId: '',
  selectedElementId: null,
  pageTransition: { active: false, direction: 'left' as const },
  _history: [],
  _historyIndex: -1,
  _recordHistory: true,
  _batchDepth: 0,

  initFromStorage: () => {
    const initial = createInitialState();
    set({
      boards: initial.boards,
      activeBoardId: initial.activeBoardId,
      _history: [{ boards: JSON.parse(JSON.stringify(initial.boards)), activeBoardId: initial.activeBoardId }],
      _historyIndex: 0,
    });
  },

  getActiveBoard: () => {
    const { boards, activeBoardId } = get();
    return boards.find((b) => b.id === activeBoardId);
  },

  addBoard: (name) => {
    const { boards } = get();
    const newBoard = createDefaultBoard(name || `灵感板 ${boards.length + 1}`);
    set({
      boards: [...boards, newBoard],
      activeBoardId: newBoard.id,
      pageTransition: { active: true, direction: 'right' },
    });
    setTimeout(() => set({ pageTransition: { active: false, direction: 'right' } }), 400);
    get()._pushHistory();
    get()._persist();
  },

  removeBoard: (id) => {
    const { boards, activeBoardId } = get();
    if (boards.length <= 1) return;
    const newBoards = boards.filter((b) => b.id !== id);
    const newActiveId = activeBoardId === id ? newBoards[0].id : activeBoardId;
    set({ boards: newBoards, activeBoardId: newActiveId });
    get()._pushHistory();
    get()._persist();
  },

  switchBoard: (id) => {
    const { boards, activeBoardId } = get();
    const currentIdx = boards.findIndex((b) => b.id === activeBoardId);
    const targetIdx = boards.findIndex((b) => b.id === id);
    const direction = targetIdx >= currentIdx ? 'right' : 'left';
    set({ activeBoardId: id, pageTransition: { active: true, direction } });
    setTimeout(() => set({ pageTransition: { active: false, direction } }), 400);
    get()._persist();
  },

  renameBoard: (id, name) => {
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, name } : b)),
    }));
    get()._persist();
  },

  setOffset: (offset) => {
    const { activeBoardId } = get();
    set((state) => ({
      boards: state.boards.map((b) => (b.id === activeBoardId ? { ...b, offset } : b)),
    }));
  },

  setZoom: (zoom) => {
    const { activeBoardId } = get();
    const clampedZoom = Math.min(4, Math.max(0.2, zoom));
    set((state) => ({
      boards: state.boards.map((b) => (b.id === activeBoardId ? { ...b, zoom: clampedZoom } : b)),
    }));
  },

  addElement: (element, recordHistory = true) => {
    const { activeBoardId, _recordHistory } = get();
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoardId
          ? {
              ...b,
              elements: [...b.elements, element],
              maxZIndex: Math.max(b.maxZIndex, element.zIndex) + 1,
            }
          : b
      ),
      selectedElementId: element.id,
    }));
    if (recordHistory && _recordHistory) {
      get()._pushHistory();
    }
    get()._persist();
  },

  updateElement: (id, updates) => {
    const { activeBoardId, _recordHistory } = get();
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoardId
          ? {
              ...b,
              elements: b.elements.map((e) =>
                e.id === id ? ({ ...e, ...updates } as BoardElement) : e
              ),
            }
          : b
      ),
    }));
    if (_recordHistory) {
      get()._pushHistory();
    }
    get()._persist();
  },

  removeElement: (id) => {
    const { activeBoardId } = get();
    set((state) => ({
      boards: state.boards.map((b) =>
        b.id === activeBoardId
          ? { ...b, elements: b.elements.filter((e) => e.id !== id) }
          : b
      ),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get()._pushHistory();
    get()._persist();
  },

  selectElement: (id) => {
    set({ selectedElementId: id });
  },

  bringToFront: (id) => {
    const { activeBoardId } = get();
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== activeBoardId) return b;
        const maxZ = b.maxZIndex + 1;
        return {
          ...b,
          maxZIndex: maxZ,
          elements: b.elements.map((e) => (e.id === id ? { ...e, zIndex: maxZ } : e)),
        };
      }),
    }));
    get()._pushHistory();
    get()._persist();
  },

  sendToBack: (id) => {
    const { activeBoardId } = get();
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== activeBoardId) return b;
        const minZ = Math.min(...b.elements.map((e) => e.zIndex)) - 1;
        return {
          ...b,
          elements: b.elements.map((e) => (e.id === id ? { ...e, zIndex: minZ } : e)),
        };
      }),
    }));
    get()._pushHistory();
    get()._persist();
  },

  moveUp: (id) => {
    const { activeBoardId } = get();
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== activeBoardId) return b;
        const sorted = [...b.elements].sort((a, c) => a.zIndex - c.zIndex);
        const idx = sorted.findIndex((e) => e.id === id);
        if (idx === -1 || idx === sorted.length - 1) return b;
        const current = sorted[idx];
        const next = sorted[idx + 1];
        return {
          ...b,
          elements: b.elements.map((e) => {
            if (e.id === id) return { ...e, zIndex: next.zIndex };
            if (e.id === next.id) return { ...e, zIndex: current.zIndex };
            return e;
          }),
        };
      }),
    }));
    get()._pushHistory();
    get()._persist();
  },

  moveDown: (id) => {
    const { activeBoardId } = get();
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id !== activeBoardId) return b;
        const sorted = [...b.elements].sort((a, c) => a.zIndex - c.zIndex);
        const idx = sorted.findIndex((e) => e.id === id);
        if (idx <= 0) return b;
        const current = sorted[idx];
        const prev = sorted[idx - 1];
        return {
          ...b,
          elements: b.elements.map((e) => {
            if (e.id === id) return { ...e, zIndex: prev.zIndex };
            if (e.id === prev.id) return { ...e, zIndex: current.zIndex };
            return e;
          }),
        };
      }),
    }));
    get()._pushHistory();
    get()._persist();
  },

  undo: () => {
    const { _history, _historyIndex } = get();
    if (_historyIndex <= 0) return;
    const newIndex = _historyIndex - 1;
    const snapshot = _history[newIndex];
    set({
      _recordHistory: false,
      _historyIndex: newIndex,
      boards: JSON.parse(JSON.stringify(snapshot.boards)),
      activeBoardId: snapshot.activeBoardId,
      selectedElementId: null,
    });
    setTimeout(() => set({ _recordHistory: true }), 50);
    get()._persist();
  },

  redo: () => {
    const { _history, _historyIndex } = get();
    if (_historyIndex >= _history.length - 1) return;
    const newIndex = _historyIndex + 1;
    const snapshot = _history[newIndex];
    set({
      _recordHistory: false,
      _historyIndex: newIndex,
      boards: JSON.parse(JSON.stringify(snapshot.boards)),
      activeBoardId: snapshot.activeBoardId,
      selectedElementId: null,
    });
    setTimeout(() => set({ _recordHistory: true }), 50);
    get()._persist();
  },

  canUndo: () => get()._historyIndex > 0,
  canRedo: () => get()._historyIndex < get()._history.length - 1,

  startBatch: () => {
    const depth = get()._batchDepth;
    if (depth === 0) {
      set({ _recordHistory: false });
    }
    set({ _batchDepth: depth + 1 });
  },

  endBatch: () => {
    const depth = get()._batchDepth;
    const newDepth = Math.max(0, depth - 1);
    set({ _batchDepth: newDepth });
    if (newDepth === 0) {
      set({ _recordHistory: true });
      get()._pushHistory();
    }
  },

  _pushHistory: () => {
    const { boards, activeBoardId, _history, _historyIndex } = get();
    const snapshot: HistorySnapshot = {
      boards: JSON.parse(JSON.stringify(boards)),
      activeBoardId,
    };
    const newHistory = _history.slice(0, _historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > 100) newHistory.shift();
    set({ _history: newHistory, _historyIndex: newHistory.length - 1 });
  },

  _persist: () => {
    const { boards, activeBoardId } = get();
    debouncedPersist({ boards, activeBoardId });
  },
}));

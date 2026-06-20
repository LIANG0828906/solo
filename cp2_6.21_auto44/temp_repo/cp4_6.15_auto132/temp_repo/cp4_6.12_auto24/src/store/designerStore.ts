import { create } from 'zustand';
import { Tile } from '../api';

interface HistoryState {
  past: Tile[][];
  future: Tile[][];
}

interface DesignerState {
  tiles: Tile[];
  selectedTileId: string | null;
  draggedTile: Tile | null;
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  history: HistoryState;
  showColorPicker: boolean;
  colorPickerTileId: string | null;

  addTile: (tile: Tile) => void;
  removeTile: (id: string) => void;
  updateTilePosition: (id: string, gridX: number, gridY: number) => void;
  updateTileColor: (id: string, color: string) => void;
  selectTile: (id: string | null) => void;
  setDraggedTile: (tile: Tile | null, offset?: { x: number; y: number }) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragOffset: (offset: { x: number; y: number }) => void;
  setShowColorPicker: (show: boolean, tileId?: string) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  getTileCount: () => number;
  getTilesByShapeAndColor: () => Record<string, number>;
}

let tileIdCounter = 0;
const generateTileId = () => `tile_${++tileIdCounter}_${Date.now()}`;

export const useDesignerStore = create<DesignerState>((set, get) => ({
  tiles: [],
  selectedTileId: null,
  draggedTile: null,
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  history: { past: [], future: [] },
  showColorPicker: false,
  colorPickerTileId: null,

  saveToHistory: () => {
    const { tiles, history } = get();
    set({
      history: {
        past: [...history.past, [...tiles]],
        future: [],
      },
    });
  },

  addTile: (tile) => {
    get().saveToHistory();
    set((state) => ({
      tiles: [...state.tiles, { ...tile, id: generateTileId() }],
    }));
  },

  removeTile: (id) => {
    get().saveToHistory();
    set((state) => ({
      tiles: state.tiles.filter((t) => t.id !== id),
      selectedTileId: state.selectedTileId === id ? null : state.selectedTileId,
    }));
  },

  updateTilePosition: (id, gridX, gridY) => {
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.id === id ? { ...t, gridX, gridY } : t
      ),
    }));
  },

  updateTileColor: (id, color) => {
    get().saveToHistory();
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.id === id ? { ...t, color } : t
      ),
    }));
  },

  selectTile: (id) => {
    set({ selectedTileId: id });
  },

  setDraggedTile: (tile, offset) => {
    set({
      draggedTile: tile,
      dragOffset: offset || { x: 0, y: 0 },
    });
  },

  setIsDragging: (dragging) => {
    set({ isDragging: dragging });
  },

  setDragOffset: (offset) => {
    set({ dragOffset: offset });
  },

  setShowColorPicker: (show, tileId) => {
    set({
      showColorPicker: show,
      colorPickerTileId: tileId ?? null,
    });
  },

  clearCanvas: () => {
    get().saveToHistory();
    set({
      tiles: [],
      selectedTileId: null,
    });
  },

  undo: () => {
    const { history } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const currentTiles = get().tiles;

    set({
      tiles: previous,
      history: {
        past: newPast,
        future: [currentTiles, ...history.future],
      },
      selectedTileId: null,
    });
  },

  redo: () => {
    const { history } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const currentTiles = get().tiles;

    set({
      tiles: next,
      history: {
        past: [...history.past, currentTiles],
        future: newFuture,
      },
      selectedTileId: null,
    });
  },

  getTileCount: () => {
    return get().tiles.length;
  },

  getTilesByShapeAndColor: () => {
    const { tiles } = get();
    const countMap: Record<string, number> = {};
    tiles.forEach((tile) => {
      const key = `${tile.shape}-${tile.color}`;
      countMap[key] = (countMap[key] || 0) + 1;
    });
    return countMap;
  },
}));

export default useDesignerStore;

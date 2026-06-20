import { create } from 'zustand';
import { TerrainType, BattleMap } from '../types';

const STORAGE_KEY = 'arcane_tactics_maps';
const GRID_SIZE = 6;
const MAX_UNDO = 50;

const createEmptyGrid = (): TerrainType[][] => {
  return Array(GRID_SIZE).fill(null).map(() =>
    Array(GRID_SIZE).fill('empty' as TerrainType)
  );
};

const cloneGrid = (grid: TerrainType[][]): TerrainType[][] => {
  return grid.map(row => [...row]);
};

interface EditorStoreState {
  currentTool: TerrainType;
  cells: TerrainType[][];
  undoStack: TerrainType[][][];
  redoStack: TerrainType[][][];
  savedMaps: BattleMap[];
  selectedMapId?: string;
  mapName: string;
  init: () => void;
  setTool: (tool: TerrainType) => void;
  paintCell: (x: number, y: number) => void;
  eraseCell: (x: number, y: number) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  saveMap: () => BattleMap | null;
  loadMap: (mapId: string) => void;
  deleteMap: (mapId: string) => void;
  setMapName: (name: string) => void;
  newMap: () => void;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  currentTool: 'rock',
  cells: createEmptyGrid(),
  undoStack: [],
  redoStack: [],
  savedMaps: [],
  selectedMapId: undefined,
  mapName: '新战场',

  init: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ savedMaps: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('Failed to load maps', e);
    }
  },

  setTool: (tool) => set({ currentTool: tool }),

  paintCell: (x: number, y: number) => {
    const { cells, undoStack, currentTool } = get();
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    if (cells[y][x] === currentTool) return;

    const newUndo = [...undoStack, cloneGrid(cells)];
    if (newUndo.length > MAX_UNDO) newUndo.shift();

    const newCells = cloneGrid(cells);
    newCells[y][x] = currentTool;

    set({
      cells: newCells,
      undoStack: newUndo,
      redoStack: []
    });
  },

  eraseCell: (x: number, y: number) => {
    const { cells, undoStack } = get();
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    if (cells[y][x] === 'empty') return;

    const newUndo = [...undoStack, cloneGrid(cells)];
    if (newUndo.length > MAX_UNDO) newUndo.shift();

    const newCells = cloneGrid(cells);
    newCells[y][x] = 'empty';

    set({
      cells: newCells,
      undoStack: newUndo,
      redoStack: []
    });
  },

  undo: () => {
    const { cells, undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const prev = undoStack[undoStack.length - 1];
    set({
      cells: prev,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, cloneGrid(cells)]
    });
  },

  redo: () => {
    const { cells, undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    set({
      cells: next,
      undoStack: [...undoStack, cloneGrid(cells)],
      redoStack: redoStack.slice(0, -1)
    });
  },

  clearAll: () => {
    const { cells, undoStack } = get();
    const newUndo = [...undoStack, cloneGrid(cells)];
    if (newUndo.length > MAX_UNDO) newUndo.shift();

    set({
      cells: createEmptyGrid(),
      undoStack: newUndo,
      redoStack: []
    });
  },

  setMapName: (name: string) => set({ mapName: name }),

  saveMap: () => {
    const { cells, savedMaps, mapName, selectedMapId } = get();
    const hasTerrain = cells.some(row => row.some(c => c !== 'empty'));
    if (!hasTerrain && !mapName.trim()) return null;

    let result: BattleMap;

    if (selectedMapId) {
      const updatedMaps = savedMaps.map(m => {
        if (m.id === selectedMapId) {
          return { ...m, name: mapName || '未命名战场', cells: cloneGrid(cells) };
        }
        return m;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMaps));
      result = updatedMaps.find(m => m.id === selectedMapId)!;
      set({ savedMaps: updatedMaps });
    } else {
      result = {
        id: `map_${Date.now()}`,
        name: mapName || '未命名战场',
        cells: cloneGrid(cells),
        createdAt: Date.now()
      };
      const newMaps = [...savedMaps, result];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaps));
      set({ savedMaps: newMaps, selectedMapId: result.id });
    }

    return result;
  },

  loadMap: (mapId: string) => {
    const map = get().savedMaps.find(m => m.id === mapId);
    if (map) {
      set({
        cells: cloneGrid(map.cells),
        mapName: map.name,
        selectedMapId: mapId,
        undoStack: [],
        redoStack: []
      });
    }
  },

  deleteMap: (mapId: string) => {
    const newMaps = get().savedMaps.filter(m => m.id !== mapId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newMaps));
    set({
      savedMaps: newMaps,
      selectedMapId: get().selectedMapId === mapId ? undefined : get().selectedMapId
    });
  },

  newMap: () => {
    set({
      cells: createEmptyGrid(),
      mapName: '新战场',
      selectedMapId: undefined,
      undoStack: [],
      redoStack: []
    });
  }
}));

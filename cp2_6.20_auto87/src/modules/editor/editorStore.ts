import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface EditorState {
  buildings: Building[];
  selectedId: string | null;
  history: Building[][];
  historyIndex: number;
  addBuilding: (building?: Partial<Building>) => void;
  removeBuilding: (id: string) => void;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  selectBuilding: (id: string | null) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  loadBuildings: (buildings: Building[]) => void;
}

const SNAP_DISTANCE = 20;
const DEFAULT_COLOR = '#a0a0a0';
const DEFAULT_WIDTH = 50;
const DEFAULT_HEIGHT = 120;

const snapToNeighbors = (
  building: Building,
  allBuildings: Building[],
  excludeId: string
): Building => {
  let { x, width } = building;
  const others = allBuildings.filter((b) => b.id !== excludeId);

  for (const other of others) {
    const otherRight = other.x + other.width;
    const otherLeft = other.x;
    const thisRight = x + width;
    const thisLeft = x;

    const verticalOverlap =
      building.y < other.y + other.height &&
      building.y + building.height > other.y;

    if (!verticalOverlap) continue;

    if (Math.abs(thisLeft - otherRight) < SNAP_DISTANCE) {
      x = otherRight;
    }
    if (Math.abs(thisRight - otherLeft) < SNAP_DISTANCE) {
      x = otherLeft - width;
    }
    if (Math.abs(thisLeft - otherLeft) < SNAP_DISTANCE) {
      x = otherLeft;
    }
    if (Math.abs(thisRight - otherRight) < SNAP_DISTANCE) {
      x = otherRight - width;
    }
  }

  return { ...building, x, width };
};

export const useEditorStore = create<EditorState>((set, get) => ({
  buildings: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,

  addBuilding: (partial) => {
    const { buildings } = get();
    const id = uuidv4();
    const canvasWidth = typeof window !== 'undefined' ? window.innerWidth - 280 : 800;
    const canvasHeight = typeof window !== 'undefined' ? window.innerHeight - 120 : 600;

    const newBuilding: Building = {
      id,
      x: partial?.x ?? Math.random() * (canvasWidth - DEFAULT_WIDTH),
      y: partial?.y ?? canvasHeight - (partial?.height ?? DEFAULT_HEIGHT) - 20,
      width: partial?.width ?? DEFAULT_WIDTH,
      height: partial?.height ?? DEFAULT_HEIGHT,
      color: partial?.color ?? DEFAULT_COLOR,
    };

    const snapped = snapToNeighbors(newBuilding, buildings, id);
    const newBuildings = [...buildings, snapped];

    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newBuildings);
      return {
        buildings: newBuildings,
        selectedId: id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  removeBuilding: (id) => {
    const { buildings } = get();
    const newBuildings = buildings.filter((b) => b.id !== id);

    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newBuildings);
      return {
        buildings: newBuildings,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  updateBuilding: (id, updates) => {
    const { buildings } = get();
    const newBuildings = buildings.map((b) => {
      if (b.id !== id) return b;
      const updated = { ...b, ...updates };
      return snapToNeighbors(updated, buildings, id);
    });

    set({ buildings: newBuildings });
  },

  selectBuilding: (id) => {
    set({ selectedId: id });
  },

  clearAll: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([]);
      return {
        buildings: [],
        selectedId: null,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        buildings: state.history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        buildings: state.history[newIndex],
        historyIndex: newIndex,
        selectedId: null,
      };
    });
  },

  pushHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.buildings]);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  loadBuildings: (buildings) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...buildings]);
      return {
        buildings: [...buildings],
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedId: null,
      };
    });
  },
}));

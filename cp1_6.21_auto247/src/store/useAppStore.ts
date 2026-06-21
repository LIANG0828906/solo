import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Brick {
  id: string;
  type: string;
  color: string;
  position: { x: number; y: number; z: number };
}

export interface BrickType {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  shape: 'cube' | 'slope' | 'cylinder';
}

interface AppState {
  bricks: Brick[];
  selectedIds: string[];
  past: Brick[][];
  future: Brick[][];
  showTutorial: boolean;
  tutorialStep: number;
  brickTypes: BrickType[];
  isExporting: boolean;

  addBrick: (type: string, color: string, position: { x: number; y: number; z: number }) => void;
  removeBrick: (id: string) => void;
  removeSelected: () => void;
  moveBrick: (id: string, position: { x: number; y: number; z: number }) => void;
  moveSelected: (delta: { x: number; y: number; z: number }) => void;
  selectBrick: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  changeColor: (id: string, color: string) => void;
  undo: () => void;
  redo: () => void;
  nextTutorialStep: () => void;
  closeTutorial: () => void;
  setBrickTypes: (types: BrickType[]) => void;
  setExporting: (val: boolean) => void;
}

const BRICK_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#FACC15',
  '#22C55E',
  '#F8FAFC',
];

export { BRICK_COLORS };

export const useAppStore = create<AppState>((set, get) => ({
  bricks: [],
  selectedIds: [],
  past: [],
  future: [],
  showTutorial: typeof window !== 'undefined' ? !sessionStorage.getItem('tutorialDone') : true,
  tutorialStep: 0,
  brickTypes: [],
  isExporting: false,

  addBrick: (type, color, position) => {
    const { bricks, past } = get();
    if (bricks.length >= 100) return;
    const newBrick: Brick = {
      id: uuidv4(),
      type,
      color,
      position: { ...position },
    };
    set({
      bricks: [...bricks, newBrick],
      past: [...past, bricks],
      future: [],
    });
  },

  removeBrick: (id) => {
    const { bricks, past, selectedIds } = get();
    set({
      bricks: bricks.filter(b => b.id !== id),
      past: [...past, bricks],
      future: [],
      selectedIds: selectedIds.filter(sid => sid !== id),
    });
  },

  removeSelected: () => {
    const { bricks, selectedIds, past } = get();
    if (selectedIds.length === 0) return;
    set({
      bricks: bricks.filter(b => !selectedIds.includes(b.id)),
      past: [...past, bricks],
      future: [],
      selectedIds: [],
    });
  },

  moveBrick: (id, position) => {
    const { bricks, past } = get();
    set({
      bricks: bricks.map(b => b.id === id ? { ...b, position: { ...position } } : b),
      past: [...past, bricks],
      future: [],
    });
  },

  moveSelected: (delta) => {
    const { bricks, selectedIds, past } = get();
    if (selectedIds.length === 0) return;
    set({
      bricks: bricks.map(b => {
        if (selectedIds.includes(b.id)) {
          return {
            ...b,
            position: {
              x: b.position.x + delta.x,
              y: Math.max(0, b.position.y + delta.y),
              z: b.position.z + delta.z,
            },
          };
        }
        return b;
      }),
      past: [...past, bricks],
      future: [],
    });
  },

  selectBrick: (id, multi = false) => {
    const { selectedIds } = get();
    if (multi) {
      if (selectedIds.includes(id)) {
        set({ selectedIds: selectedIds.filter(sid => sid !== id) });
      } else {
        set({ selectedIds: [...selectedIds, id] });
      }
    } else {
      set({ selectedIds: [id] });
    }
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  changeColor: (id, color) => {
    const { bricks, past } = get();
    set({
      bricks: bricks.map(b => b.id === id ? { ...b, color } : b),
      past: [...past, bricks],
      future: [],
    });
  },

  undo: () => {
    const { past, future, bricks } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({
      past: newPast,
      future: [bricks, ...future],
      bricks: previous,
      selectedIds: [],
    });
  },

  redo: () => {
    const { past, future, bricks } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      past: [...past, bricks],
      future: newFuture,
      bricks: next,
      selectedIds: [],
    });
  },

  nextTutorialStep: () => {
    const { tutorialStep } = get();
    if (tutorialStep < 2) {
      set({ tutorialStep: tutorialStep + 1 });
    } else {
      sessionStorage.setItem('tutorialDone', 'true');
      set({ showTutorial: false });
    }
  },

  closeTutorial: () => {
    sessionStorage.setItem('tutorialDone', 'true');
    set({ showTutorial: false });
  },

  setBrickTypes: (types) => {
    set({ brickTypes: types });
  },

  setExporting: (val) => {
    set({ isExporting: val });
  },
}));

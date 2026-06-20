import { create } from 'zustand';
import { ResumeComponent, COMPONENT_DEFAULTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

interface ResumeState {
  components: ResumeComponent[];
  selectedId: string | null;
  history: ResumeComponent[][];
  historyIndex: number;

  addComponent: (type: ResumeComponent['type'], x: number, y: number) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ResumeComponent>) => void;
  updateComponentStyle: (id: string, styleUpdates: Partial<ResumeComponent['style']>) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  resizeComponent: (id: string, width: number, height: number) => void;
  selectComponent: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useResumeStore = create<ResumeState>((set, get) => ({
  components: [],
  selectedId: null,
  history: [[]],
  historyIndex: 0,

  addComponent: (type, x, y) => {
    const defaults = COMPONENT_DEFAULTS[type];
    const newComp: ResumeComponent = {
      id: generateId(),
      type,
      x: Math.max(0, Math.min(x - defaults.width / 2, CANVAS_WIDTH - defaults.width)),
      y: Math.max(0, Math.min(y - defaults.height / 2, CANVAS_HEIGHT - defaults.height)),
      width: defaults.width,
      height: defaults.height,
      content: defaults.content,
      style: { ...defaults.style },
    };
    set((state) => {
      const newComponents = [...state.components, newComp];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newComponents);
      return {
        components: newComponents,
        selectedId: newComp.id,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  removeComponent: (id) => {
    set((state) => {
      const newComponents = state.components.filter((c) => c.id !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newComponents);
      return {
        components: newComponents,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  updateComponent: (id, updates) => {
    set((state) => ({
      components: state.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  updateComponentStyle: (id, styleUpdates) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, style: { ...c.style, ...styleUpdates } } : c
      ),
    }));
  },

  moveComponent: (id, x, y) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id
          ? {
              ...c,
              x: Math.max(0, Math.min(x, CANVAS_WIDTH - c.width)),
              y: Math.max(0, Math.min(y, CANVAS_HEIGHT - c.height)),
            }
          : c
      ),
    }));
  },

  resizeComponent: (id, width, height) => {
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id
          ? {
              ...c,
              width: Math.max(60, Math.min(width, CANVAS_WIDTH - c.x)),
              height: Math.max(30, Math.min(height, CANVAS_HEIGHT - c.y)),
            }
          : c
      ),
    }));
  },

  selectComponent: (id) => {
    set({ selectedId: id });
  },

  pushHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([...state.components]);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        components: [...history[newIndex]],
        historyIndex: newIndex,
        selectedId: null,
      });
    }
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        components: [...history[newIndex]],
        historyIndex: newIndex,
        selectedId: null,
      });
    }
  },
}));

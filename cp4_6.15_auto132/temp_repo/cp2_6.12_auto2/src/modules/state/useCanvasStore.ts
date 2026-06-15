import { create } from 'zustand';
import type { CanvasElement } from '../canvas/types';

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
  editingTextId: string | null;
  nextZIndex: number;
  targetZoom: number;
  targetOffsetX: number;
  targetOffsetY: number;

  addElement: (element: Omit<CanvasElement, 'id' | 'zIndex'> & { id?: string; zIndex?: number }) => string;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setZoom: (zoom: number, animate?: boolean) => void;
  setOffset: (x: number, y: number, animate?: boolean) => void;
  setEditingTextId: (id: string | null) => void;
  reorderElements: (draggedId: string, targetId: string, position: 'before' | 'after') => void;
  moveElementToFront: (id: string) => void;
  resetView: () => void;
  getMaxZIndex: () => number;
}

let idCounter = 0;
const generateId = () => `el_${Date.now()}_${++idCounter}`;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedId: null,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  editingTextId: null,
  nextZIndex: 1,
  targetZoom: 1,
  targetOffsetX: 0,
  targetOffsetY: 0,

  addElement: (element) => {
    const id = element.id || generateId();
    const zIndex = element.zIndex || get().nextZIndex;
    set((state) => ({
      elements: [...state.elements, { ...(element as CanvasElement), id, zIndex }],
      selectedId: id,
      nextZIndex: Math.max(state.nextZIndex, zIndex) + 1,
    }));
    return id;
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as CanvasElement) : el
      ),
    }));
  },

  removeElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      editingTextId: state.editingTextId === id ? null : state.editingTextId,
    }));
  },

  setSelectedId: (id) => set({ selectedId: id, editingTextId: null }),

  setZoom: (zoom, animate = false) => {
    const clamped = Math.max(0.5, Math.min(3, zoom));
    if (animate) {
      set({ targetZoom: clamped });
    } else {
      set({ zoom: clamped, targetZoom: clamped });
    }
  },

  setOffset: (x, y, animate = false) => {
    if (animate) {
      set({ targetOffsetX: x, targetOffsetY: y });
    } else {
      set({ offsetX: x, offsetY: y, targetOffsetX: x, targetOffsetY: y });
    }
  },

  setEditingTextId: (id) => set({ editingTextId: id }),

  reorderElements: (draggedId, targetId, position) => {
    set((state) => {
      const elements = [...state.elements];
      const draggedIdx = elements.findIndex((e) => e.id === draggedId);
      if (draggedIdx === -1) return {};
      const [dragged] = elements.splice(draggedIdx, 1);
      const targetIdx = elements.findIndex((e) => e.id === targetId);
      if (targetIdx === -1) return {};
      const insertAt = position === 'after' ? targetIdx + 1 : targetIdx;
      elements.splice(insertAt, 0, dragged);
      const reordered = elements.map((el, i) => ({ ...el, zIndex: i + 1 }));
      return { elements: reordered, nextZIndex: reordered.length + 1 };
    });
  },

  moveElementToFront: (id) => {
    set((state) => {
      const maxZ = state.nextZIndex;
      return {
        elements: state.elements.map((el) =>
          el.id === id ? ({ ...el, zIndex: maxZ } as CanvasElement) : el
        ),
        nextZIndex: maxZ + 1,
      };
    });
  },

  resetView: () => set({ zoom: 1, offsetX: 0, offsetY: 0, targetZoom: 1, targetOffsetX: 0, targetOffsetY: 0 }),

  getMaxZIndex: () => get().nextZIndex - 1,
}));

export const getElementById = (id: string): CanvasElement | undefined => {
  return useCanvasStore.getState().elements.find((e) => e.id === id);
};

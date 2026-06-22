import { create } from 'zustand';
import type { BoardElement } from '@/canvasItem';

interface BoardState {
  boardId: string | null;
  shareCode: string | null;
  elements: BoardElement[];
  selectedId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  isExporting: boolean;
  sidebarOpen: boolean;

  setBoard: (id: string, shareCode: string, elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  reorderElement: (id: string, action: 'up' | 'down' | 'top' | 'bottom') => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setExporting: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  syncElements: (elements: BoardElement[]) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  boardId: null,
  shareCode: null,
  elements: [],
  selectedId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  isExporting: false,
  sidebarOpen: false,

  setBoard: (id, shareCode, elements) => set({ boardId: id, shareCode, elements }),

  addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),

  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map((el) => el.id === id ? { ...el, ...updates } : el),
  })),

  removeElement: (id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
  })),

  moveElement: (id, x, y) => set((state) => ({
    elements: state.elements.map((el) => el.id === id ? { ...el, x, y } : el),
  })),

  resizeElement: (id, width, height) => set((state) => ({
    elements: state.elements.map((el) => el.id === id ? { ...el, width, height } : el),
  })),

  reorderElement: (id, action) => set((state) => {
    const idx = state.elements.findIndex((el) => el.id === id);
    if (idx === -1) return state;

    const element = state.elements[idx];
    const currentZ = element.style.zIndex;

    switch (action) {
      case 'up': {
        const updated = state.elements.map((el) =>
          el.id === id ? { ...el, style: { ...el.style, zIndex: currentZ + 1 } } : el,
        );
        return { elements: updated };
      }
      case 'down': {
        const newZ = Math.max(0, currentZ - 1);
        const updated = state.elements.map((el) =>
          el.id === id ? { ...el, style: { ...el.style, zIndex: newZ } } : el,
        );
        return { elements: updated };
      }
      case 'top': {
        const maxZ = state.elements.reduce((max, el) => Math.max(max, el.style.zIndex), 0);
        const updated = state.elements.map((el) =>
          el.id === id ? { ...el, style: { ...el.style, zIndex: maxZ + 1 } } : el,
        );
        return { elements: updated };
      }
      case 'bottom': {
        const updated = state.elements.map((el) => {
          if (el.id === id) {
            return { ...el, style: { ...el.style, zIndex: 0 } };
          }
          if (el.style.zIndex < currentZ) {
            return { ...el, style: { ...el.style, zIndex: el.style.zIndex + 1 } };
          }
          return el;
        });
        return { elements: updated };
      }
      default:
        return state;
    }
  }),

  selectElement: (id) => set({ selectedId: id }),

  setZoom: (zoom) => set({ zoom }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  setExporting: (v) => set({ isExporting: v }),

  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  syncElements: (elements) => set({ elements }),
}));

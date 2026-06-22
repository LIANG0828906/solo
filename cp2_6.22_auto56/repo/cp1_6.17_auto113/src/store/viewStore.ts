import { create } from 'zustand';
import { ViewTransform, MicrobeType } from '../types';

interface ViewState {
  transform: ViewTransform;
  selectedType: MicrobeType | null;
  isDragging: boolean;
  mouseX: number;
  mouseY: number;
  mouseInSimArea: boolean;
  setTransform: (t: ViewTransform) => void;
  setOffset: (x: number, y: number) => void;
  setScale: (s: number) => void;
  setSelectedType: (t: MicrobeType | null) => void;
  setDragging: (d: boolean) => void;
  setMouse: (x: number, y: number) => void;
  setMouseInSimArea: (b: boolean) => void;
  reset: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  transform: { offsetX: 0, offsetY: 0, scale: 1 },
  selectedType: null,
  isDragging: false,
  mouseX: 0,
  mouseY: 0,
  mouseInSimArea: false,

  setTransform: (t) => set({ transform: t }),
  setOffset: (offsetX, offsetY) =>
    set((state) => ({
      transform: { ...state.transform, offsetX, offsetY },
    })),
  setScale: (scale) =>
    set((state) => ({
      transform: { ...state.transform, scale },
    })),
  setSelectedType: (t) => set({ selectedType: t }),
  setDragging: (d) => set({ isDragging: d }),
  setMouse: (mouseX, mouseY) => set({ mouseX, mouseY }),
  setMouseInSimArea: (b) => set({ mouseInSimArea: b }),
  reset: () =>
    set({
      transform: { offsetX: 0, offsetY: 0, scale: 1 },
      selectedType: null,
    }),
}));

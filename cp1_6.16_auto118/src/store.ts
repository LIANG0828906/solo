import { create } from 'zustand'

export interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  opacity: number;
  width: number;
  height: number;
}

export interface CardSettings {
  backgroundColor: string;
  blessingText: string;
}

interface AppState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  cardSettings: CardSettings;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  addElement: (type: string) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setCardSettings: (settings: Partial<CardSettings>) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const useStore = create<AppState>((set) => ({
  elements: [],
  selectedElementId: null,
  cardSettings: { backgroundColor: '#FFFFFF', blessingText: '' },
  leftPanelOpen: true,
  rightPanelOpen: true,
  addElement: (type) =>
    set((state) => ({
      elements: [
        ...state.elements,
        {
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          type,
          x: 400,
          y: 300,
          rotation: 0,
          scale: 1,
          color: '#D40000',
          opacity: 1,
          width: 150,
          height: 150,
        },
      ],
    })),
  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
    })),
  selectElement: (id) => set({ selectedElementId: id }),
  setCardSettings: (settings) =>
    set((state) => ({
      cardSettings: { ...state.cardSettings, ...settings },
    })),
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
}));

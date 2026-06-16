import { create } from 'zustand';
import type { ColorScheme } from '../utils/colorUtils';
import { PRESET_SCHEMES } from '../utils/colorUtils';

export type FanShape = 'circle' | 'begonia';

export interface PatternElement {
  id: string;
  type: 'peony' | 'plum' | 'butterfly';
  x: number;
  y: number;
  scale: number;
  rotation: number;
  colors: string[];
  draggable: boolean;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  thumbnail: string;
  scheme: ColorScheme;
  elements: PatternElement[];
  fanShape: FanShape;
}

interface AppState {
  currentScheme: ColorScheme;
  fanShape: FanShape;
  customPalette: string[];
  history: HistoryRecord[];
  selectedElementId: string | null;
  elements: PatternElement[];
  isBreathing: boolean;

  setFanShape: (shape: FanShape) => void;
  applyScheme: (scheme: ColorScheme) => void;
  setCustomPaletteSlot: (index: number, color: string) => void;
  addHistory: (record: HistoryRecord) => void;
  removeHistory: (id: string) => void;
  restoreHistory: (record: HistoryRecord) => void;
  selectElement: (id: string | null) => void;
  updateElementColor: (id: string, colorIndex: number, color: string) => void;
  updateElementPosition: (id: string, x: number, y: number) => void;
  setIsBreathing: (breathing: boolean) => void;
}

const defaultElements: PatternElement[] = [
  {
    id: 'peony-center',
    type: 'peony',
    x: 300,
    y: 300,
    scale: 1,
    rotation: 0,
    colors: ['#C41E3A', '#D9A05B', '#F0C987', '#FFF1B8'],
    draggable: false,
  },
  {
    id: 'plum-1',
    type: 'plum',
    x: 180,
    y: 180,
    scale: 0.6,
    rotation: 0,
    colors: ['#F5B7B1', '#C41E3A'],
    draggable: true,
  },
  {
    id: 'plum-2',
    type: 'plum',
    x: 420,
    y: 200,
    scale: 0.5,
    rotation: 30,
    colors: ['#F5B7B1', '#C41E3A'],
    draggable: true,
  },
  {
    id: 'plum-3',
    type: 'plum',
    x: 200,
    y: 420,
    scale: 0.55,
    rotation: -15,
    colors: ['#F5B7B1', '#C41E3A'],
    draggable: true,
  },
  {
    id: 'plum-4',
    type: 'plum',
    x: 400,
    y: 400,
    scale: 0.45,
    rotation: 45,
    colors: ['#E4C2D4', '#9D2933'],
    draggable: true,
  },
  {
    id: 'butterfly-1',
    type: 'butterfly',
    x: 150,
    y: 300,
    scale: 0.7,
    rotation: -20,
    colors: ['#78A29B', '#0072B5', '#D9A05B'],
    draggable: true,
  },
  {
    id: 'butterfly-2',
    type: 'butterfly',
    x: 450,
    y: 320,
    scale: 0.6,
    rotation: 25,
    colors: ['#D9A05B', '#C41E3A', '#F0C987'],
    draggable: true,
  },
  {
    id: 'butterfly-3',
    type: 'butterfly',
    x: 300,
    y: 130,
    scale: 0.5,
    rotation: 10,
    colors: ['#E4C2D4', '#9D2933', '#D9A05B'],
    draggable: true,
  },
];

export const useAppStore = create<AppState>((set) => ({
  currentScheme: PRESET_SCHEMES[0],
  fanShape: 'circle',
  customPalette: Array(12).fill(''),
  history: [],
  selectedElementId: null,
  elements: defaultElements,
  isBreathing: false,

  setFanShape: (shape: FanShape) => set({ fanShape: shape }),

  applyScheme: (scheme: ColorScheme) =>
    set((state) => {
      const newElements = state.elements.map((el) => {
        const newColors = el.colors.map((_, i) => scheme.colors[i % scheme.colors.length]);
        return { ...el, colors: newColors };
      });
      return { currentScheme: scheme, elements: newElements };
    }),

  setCustomPaletteSlot: (index: number, color: string) =>
    set((state) => {
      const newPalette = [...state.customPalette];
      newPalette[index] = color;
      return { customPalette: newPalette };
    }),

  addHistory: (record: HistoryRecord) =>
    set((state) => {
      const newHistory = [record, ...state.history].slice(0, 15);
      return { history: newHistory };
    }),

  removeHistory: (id: string) =>
    set((state) => ({
      history: state.history.filter((r) => r.id !== id),
    })),

  restoreHistory: (record: HistoryRecord) =>
    set({
      currentScheme: record.scheme,
      fanShape: record.fanShape,
      elements: record.elements,
    }),

  selectElement: (id: string | null) => set({ selectedElementId: id }),

  updateElementColor: (id: string, colorIndex: number, color: string) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id
          ? {
              ...el,
              colors: el.colors.map((c, i) => (i === colorIndex ? color : c)),
            }
          : el
      ),
    })),

  updateElementPosition: (id: string, x: number, y: number) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    })),

  setIsBreathing: (breathing: boolean) => set({ isBreathing: breathing }),
}));

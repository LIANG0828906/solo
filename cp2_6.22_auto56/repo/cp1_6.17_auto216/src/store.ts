import { create } from 'zustand';
import { analyzeColorPalette } from './utils/colorUtils';

export interface ColorItem {
  id: string;
  color: string;
}

export interface AnalysisResult {
  primary: string;
  secondary: string;
  hueAngle: number;
  warmCoolIndex: number;
  emotionTag: string;
}

interface UIState {
  isMobile: boolean;
  editingColorId: string | null;
  draggedColorId: string | null;
}

interface ColorBoardState {
  colors: ColorItem[];
  analysis: AnalysisResult;
  ui: UIState;
  addColor: (color: string) => void;
  removeColor: (id: string) => void;
  updateColor: (id: string, color: string) => void;
  swapColors: (index1: number, index2: number) => void;
  moveColor: (fromIndex: number, toIndex: number) => void;
  setIsMobile: (isMobile: boolean) => void;
  setEditingColorId: (id: string | null) => void;
  setDraggedColorId: (id: string | null) => void;
  recalculateAnalysis: () => void;
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const initialColors: ColorItem[] = [
  { id: generateId(), color: '#6366F1' },
  { id: generateId(), color: '#EC4899' },
  { id: generateId(), color: '#10B981' },
];

export const useColorBoardStore = create<ColorBoardState>((set, get) => ({
  colors: initialColors,
  analysis: analyzeColorPalette(initialColors.map((c) => c.color)),
  ui: {
    isMobile: false,
    editingColorId: null,
    draggedColorId: null,
  },

  addColor: (color: string) => {
    const newColor: ColorItem = { id: generateId(), color };
    const newColors = [...get().colors, newColor];
    set({
      colors: newColors,
      analysis: analyzeColorPalette(newColors.map((c) => c.color)),
    });
  },

  removeColor: (id: string) => {
    const newColors = get().colors.filter((c) => c.id !== id);
    set({
      colors: newColors,
      analysis: analyzeColorPalette(newColors.map((c) => c.color)),
    });
  },

  updateColor: (id: string, color: string) => {
    const newColors = get().colors.map((c) =>
      c.id === id ? { ...c, color } : c
    );
    set({
      colors: newColors,
      analysis: analyzeColorPalette(newColors.map((c) => c.color)),
    });
  },

  swapColors: (index1: number, index2: number) => {
    const colors = [...get().colors];
    const temp = colors[index1];
    colors[index1] = colors[index2];
    colors[index2] = temp;
    set({
      colors,
      analysis: analyzeColorPalette(colors.map((c) => c.color)),
    });
  },

  moveColor: (fromIndex: number, toIndex: number) => {
    const colors = [...get().colors];
    const [removed] = colors.splice(fromIndex, 1);
    colors.splice(toIndex, 0, removed);
    set({
      colors,
      analysis: analyzeColorPalette(colors.map((c) => c.color)),
    });
  },

  setIsMobile: (isMobile: boolean) => {
    set((state) => ({ ui: { ...state.ui, isMobile } }));
  },

  setEditingColorId: (id: string | null) => {
    set((state) => ({ ui: { ...state.ui, editingColorId: id } }));
  },

  setDraggedColorId: (id: string | null) => {
    set((state) => ({ ui: { ...state.ui, draggedColorId: id } }));
  },

  recalculateAnalysis: () => {
    const colors = get().colors;
    set({
      analysis: analyzeColorPalette(colors.map((c) => c.color)),
    });
  },
}));

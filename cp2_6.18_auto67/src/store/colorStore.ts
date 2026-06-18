import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RGB, HSL } from '../utils/colorUtils';

export interface ColorItem {
  id: string;
  hex: string;
  rgb: RGB;
  hsl: HSL;
  percentage: number;
  locked: boolean;
}

type ExtractedColorInput = Omit<ColorItem, 'id' | 'locked'>;
type ManualColorInput = Omit<ColorItem, 'id' | 'locked' | 'percentage'>;

interface ColorStore {
  extractedColors: ColorItem[];
  manualColors: ColorItem[];
  selectedIndex: number | null;

  setExtractedColors: (colors: ExtractedColorInput[]) => void;
  addManualColor: (color: ManualColorInput) => void;
  toggleLock: (id: string) => void;
  removeColor: (id: string) => void;
  reorderColors: (fromId: string, toId: string) => void;
  setSelectedIndex: (index: number | null) => void;
  getAllColors: () => ColorItem[];
}

export const useColorStore = create<ColorStore>((set, get) => ({
  extractedColors: [],
  manualColors: [],
  selectedIndex: null,

  setExtractedColors: (colors) => {
    const { manualColors } = get();
    const lockedManual = manualColors.filter(c => c.locked);
    const newExtracted: ColorItem[] = colors.map(c => ({
      ...c,
      id: uuidv4(),
      locked: false,
    }));
    set({
      extractedColors: newExtracted,
      manualColors: lockedManual,
      selectedIndex: null,
    });
  },

  addManualColor: (color) => {
    const item: ColorItem = {
      ...color,
      id: uuidv4(),
      locked: false,
      percentage: 0,
    };
    set(state => ({ manualColors: [...state.manualColors, item] }));
  },

  toggleLock: (id) => {
    set(state => ({
      extractedColors: state.extractedColors.map(c =>
        c.id === id ? { ...c, locked: !c.locked } : c
      ),
      manualColors: state.manualColors.map(c =>
        c.id === id ? { ...c, locked: !c.locked } : c
      ),
    }));
  },

  removeColor: (id) => {
    set(state => {
      const inExtracted = state.extractedColors.some(c => c.id === id);
      if (inExtracted) {
        return { extractedColors: state.extractedColors.filter(c => c.id !== id) };
      }
      return { manualColors: state.manualColors.filter(c => c.id !== id) };
    });
  },

  reorderColors: (fromId, toId) => {
    const { getAllColors } = get();
    const all = getAllColors();
    const fromIdx = all.findIndex(c => c.id === fromId);
    const toIdx = all.findIndex(c => c.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const reordered = [...all];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const extractedIds = new Set(get().extractedColors.map(c => c.id));
    const newExtracted: ColorItem[] = [];
    const newManual: ColorItem[] = [];
    for (const c of reordered) {
      if (extractedIds.has(c.id)) newExtracted.push(c);
      else newManual.push(c);
    }
    set({ extractedColors: newExtracted, manualColors: newManual });
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  getAllColors: () => {
    const { extractedColors, manualColors } = get();
    return [...extractedColors, ...manualColors];
  },
}));

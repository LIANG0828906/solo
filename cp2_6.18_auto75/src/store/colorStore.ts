import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { RGB, HSL } from "../utils/colorUtils";

export interface ColorItem {
  id: string;
  hex: string;
  rgb: RGB;
  hsl: HSL;
  percentage: number;
  locked: boolean;
  isManual: boolean;
}

interface ExtractedColorInput {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  percentage: number;
}

interface PaletteState {
  extractedColors: ColorItem[];
  manualColors: ColorItem[];
  selectedIndex: number | null;
  expandedCardId: string | null;
  setExtractedColors: (colors: ExtractedColorInput[]) => void;
  addManualColor: (color: ExtractedColorInput) => void;
  removeColor: (id: string) => void;
  toggleLock: (id: string) => void;
  reorderColors: (fromIndex: number, toIndex: number) => void;
  setSelectedIndex: (index: number | null) => void;
  setExpandedCardId: (id: string | null) => void;
  getAllColors: () => ColorItem[];
}

const isSameColor = (c1: ExtractedColorInput, c2: ColorItem): boolean => {
  return (
    Math.abs(c1.rgb.r - c2.rgb.r) < 10 &&
    Math.abs(c1.rgb.g - c2.rgb.g) < 10 &&
    Math.abs(c1.rgb.b - c2.rgb.b) < 10
  );
};

export const useColorStore = create<PaletteState>((set, get) => ({
  extractedColors: [],
  manualColors: [],
  selectedIndex: null,
  expandedCardId: null,

  setExtractedColors: (colors: ExtractedColorInput[]) => {
    const state = get();
    const existingLockedColors = state.extractedColors.filter((c) => c.locked);
    const newColors: ColorItem[] = [];
    for (const color of colors) {
      const lockedMatch = existingLockedColors.find((lc) =>
        isSameColor(color, lc)
      );
      if (lockedMatch) {
        newColors.push(lockedMatch);
      } else {
        newColors.push({
          id: uuidv4(),
          hex: color.hex,
          rgb: color.rgb,
          hsl: color.hsl,
          percentage: color.percentage,
          locked: false,
          isManual: false,
        });
      }
    }
    for (const lc of existingLockedColors) {
      if (!newColors.find((nc) => nc.id === lc.id)) {
        newColors.push(lc);
      }
    }
    set({
      extractedColors: newColors,
      expandedCardId: null,
      selectedIndex: null,
    });
  },

  addManualColor: (color: ExtractedColorInput) => {
    const state = get();
    const newColor: ColorItem = {
      id: uuidv4(),
      hex: color.hex,
      rgb: color.rgb,
      hsl: color.hsl,
      percentage: color.percentage || 0,
      locked: true,
      isManual: true,
    };
    set({
      manualColors: [...state.manualColors, newColor],
      expandedCardId: newColor.id,
    });
  },

  removeColor: (id: string) => {
    const state = get();
    const foundInExtracted = state.extractedColors.find((c) => c.id === id);
    if (foundInExtracted) {
      set({
        extractedColors: state.extractedColors.filter((c) => c.id !== id),
        expandedCardId: state.expandedCardId === id ? null : state.expandedCardId,
      });
      return;
    }
    const foundInManual = state.manualColors.find((c) => c.id === id);
    if (foundInManual) {
      set({
        manualColors: state.manualColors.filter((c) => c.id !== id),
        expandedCardId: state.expandedCardId === id ? null : state.expandedCardId,
      });
    }
  },

  toggleLock: (id: string) => {
    const state = get();
    const extractedIdx = state.extractedColors.findIndex((c) => c.id === id);
    if (extractedIdx >= 0) {
      const newExtracted = [...state.extractedColors];
      newExtracted[extractedIdx] = {
        ...newExtracted[extractedIdx],
        locked: !newExtracted[extractedIdx].locked,
      };
      set({ extractedColors: newExtracted });
      return;
    }
    const manualIdx = state.manualColors.findIndex((c) => c.id === id);
    if (manualIdx >= 0) {
      const newManual = [...state.manualColors];
      newManual[manualIdx] = {
        ...newManual[manualIdx],
        locked: !newManual[manualIdx].locked,
      };
      set({ manualColors: newManual });
    }
  },

  reorderColors: (fromIndex: number, toIndex: number) => {
    const state = get();
    const all = [...state.extractedColors, ...state.manualColors];
    if (
      fromIndex < 0 ||
      fromIndex >= all.length ||
      toIndex < 0 ||
      toIndex >= all.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    const [removed] = all.splice(fromIndex, 1);
    all.splice(toIndex, 0, removed);
    const extractedEndIdx = state.extractedColors.length;
    const newExtracted = all.slice(0, extractedEndIdx);
    const newManual = all.slice(extractedEndIdx);
    set({
      extractedColors: newExtracted,
      manualColors: newManual,
    });
  },

  setSelectedIndex: (index: number | null) => {
    set({ selectedIndex: index });
  },

  setExpandedCardId: (id: string | null) => {
    set({ expandedCardId: id });
  },

  getAllColors: (): ColorItem[] => {
    const state = get();
    return [...state.extractedColors, ...state.manualColors];
  },
}));

import { create } from 'zustand';
import { hexToCMYK, generateId } from '../utils/colorUtils';

export interface ColorItem {
  hex: string;
  cmyk: [number, number, number, number];
  locked: boolean;
  id: string;
}

export interface FontPair {
  titleFont: string;
  bodyFont: string;
  id: string;
}

export type LayoutType = 'text-center' | 'image-top' | 'image-bg';

export interface LayoutOption {
  type: LayoutType;
  id: string;
}

interface DesignState {
  originalImage: string | null;
  croppedImage: string | null;
  primaryColors: ColorItem[];
  accentColors: ColorItem[];
  isExtracting: boolean;
  fontPairs: FontPair[];
  selectedLayout: string | null;
  expandedLayout: boolean;
  drawerExpanded: boolean;
  error: string | null;

  setOriginalImage: (img: string | null) => void;
  setCroppedImage: (img: string | null) => void;
  setColors: (primary: string[], accent: string[]) => void;
  toggleLockColor: (id: string, type: 'primary' | 'accent') => void;
  reorderColors: (type: 'primary' | 'accent', fromIndex: number, toIndex: number) => void;
  setFontPairs: (pairs: FontPair[]) => void;
  setSelectedLayout: (id: string | null) => void;
  setExpandedLayout: (expanded: boolean) => void;
  setDrawerExpanded: (expanded: boolean) => void;
  setIsExtracting: (extracting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const createColorItem = (hex: string, locked: boolean = false): ColorItem => ({
  hex: hex.toUpperCase(),
  cmyk: hexToCMYK(hex),
  locked,
  id: generateId()
});

const initialState: Omit<DesignState, keyof {
  setOriginalImage: never;
  setCroppedImage: never;
  setColors: never;
  toggleLockColor: never;
  reorderColors: never;
  setFontPairs: never;
  setSelectedLayout: never;
  setExpandedLayout: never;
  setDrawerExpanded: never;
  setIsExtracting: never;
  setError: never;
  reset: never;
}> = {
  originalImage: null,
  croppedImage: null,
  primaryColors: [],
  accentColors: [],
  isExtracting: false,
  fontPairs: [],
  selectedLayout: null,
  expandedLayout: false,
  drawerExpanded: false,
  error: null
};

export const useDesignStore = create<DesignState>((set, get) => ({
  ...initialState,

  setOriginalImage: (img) => set({ originalImage: img }),

  setCroppedImage: (img) => set({ croppedImage: img }),

  setColors: (primaryHexes, accentHexes) => {
    const state = get();
    const lockedPrimary = state.primaryColors.filter(c => c.locked);
    const lockedAccent = state.accentColors.filter(c => c.locked);

    const newPrimary = primaryHexes.map(hex => createColorItem(hex));
    const newAccent = accentHexes.map(hex => createColorItem(hex));

    for (let i = 0; i < lockedPrimary.length && i < newPrimary.length; i++) {
      const locked = lockedPrimary[i];
      if (locked && newPrimary[i]) {
        newPrimary[i] = { ...locked, id: newPrimary[i].id };
      }
    }

    for (let i = 0; i < lockedAccent.length && i < newAccent.length; i++) {
      const locked = lockedAccent[i];
      if (locked && newAccent[i]) {
        newAccent[i] = { ...locked, id: newAccent[i].id };
      }
    }

    set({
      primaryColors: newPrimary,
      accentColors: newAccent,
      isExtracting: false
    });
  },

  toggleLockColor: (id, type) => set(state => {
    const colors = type === 'primary' ? [...state.primaryColors] : [...state.accentColors];
    const index = colors.findIndex(c => c.id === id);
    if (index !== -1) {
      colors[index] = { ...colors[index], locked: !colors[index].locked };
    }
    return type === 'primary'
      ? { primaryColors: colors }
      : { accentColors: colors };
  }),

  reorderColors: (type, fromIndex, toIndex) => set(state => {
    const colors = type === 'primary' ? [...state.primaryColors] : [...state.accentColors];
    const [removed] = colors.splice(fromIndex, 1);
    colors.splice(toIndex, 0, removed);
    return type === 'primary'
      ? { primaryColors: colors }
      : { accentColors: colors };
  }),

  setFontPairs: (pairs) => set({ fontPairs: pairs }),

  setSelectedLayout: (id) => set({ selectedLayout: id }),

  setExpandedLayout: (expanded) => set({ expandedLayout: expanded }),

  setDrawerExpanded: (expanded) => set({ drawerExpanded: expanded }),

  setIsExtracting: (extracting) => set({ isExtracting: extracting }),

  setError: (error) => set({ error }),

  reset: () => set(initialState)
}));

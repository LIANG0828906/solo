import { create } from 'zustand';
import {
  ColorConfig,
  ProductPart,
  ProductType,
  HSL,
  DEFAULT_COLORS,
  hslToHex,
  hexToHsl,
  calculateColorDifferences
} from '../utils/colorUtils';

export interface SavedScheme {
  id: string;
  name: string;
  productType: ProductType;
  schemeA: ColorConfig;
  schemeB: ColorConfig;
  createdAt: number;
}

interface ColorStore {
  productType: ProductType;
  activeScheme: 'A' | 'B';
  schemeA: ColorConfig;
  schemeB: ColorConfig;
  savedSchemes: SavedScheme[];
  showDifference: boolean;
  selectedPart: ProductPart;
  isDrawerOpen: boolean;

  setProductType: (type: ProductType) => void;
  setActiveScheme: (scheme: 'A' | 'B') => void;
  setSelectedPart: (part: ProductPart) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;

  updateColor: (part: ProductPart, color: string, scheme?: 'A' | 'B') => void;
  updateColorHSL: (part: ProductPart, hsl: HSL, scheme?: 'A' | 'B') => void;
  updateHue: (part: ProductPart, hue: number, scheme?: 'A' | 'B') => void;
  updateSaturation: (part: ProductPart, saturation: number, scheme?: 'A' | 'B') => void;
  updateLightness: (part: ProductPart, lightness: number, scheme?: 'A' | 'B') => void;

  toggleDifference: () => void;
  setShowDifference: (show: boolean) => void;

  saveScheme: (name: string) => boolean;
  loadScheme: (id: string) => void;
  deleteScheme: (id: string) => void;

  getColorDifference: () => Record<ProductPart, number>;
  getCurrentScheme: () => ColorConfig;
  getCurrentColor: (part: ProductPart) => string;
  getCurrentHSL: (part: ProductPart) => HSL;
}

const STORAGE_KEY = 'color-configurator-schemes';

const loadSavedSchemes = (): SavedScheme[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load saved schemes:', e);
  }
  return [];
};

const persistSavedSchemes = (schemes: SavedScheme[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes));
  } catch (e) {
    console.error('Failed to save schemes:', e);
  }
};

export const useColorStore = create<ColorStore>((set, get) => ({
  productType: 'shoe',
  activeScheme: 'A',
  schemeA: { ...DEFAULT_COLORS.shoe },
  schemeB: { ...DEFAULT_COLORS.shoe },
  savedSchemes: loadSavedSchemes(),
  showDifference: false,
  selectedPart: 'body',
  isDrawerOpen: false,

  setProductType: (type) => {
    const defaults = DEFAULT_COLORS[type];
    set({
      productType: type,
      schemeA: { ...defaults },
      schemeB: { ...defaults }
    });
  },

  setActiveScheme: (scheme) => set({ activeScheme: scheme }),
  setSelectedPart: (part) => set({ selectedPart: part }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),

  updateColor: (part, color, scheme) => {
    const targetScheme = scheme || get().activeScheme;
    const schemeKey = targetScheme === 'A' ? 'schemeA' : 'schemeB';
    
    set((state) => ({
      [schemeKey]: {
        ...state[schemeKey],
        [part]: color
      }
    }));
  },

  updateColorHSL: (part, hsl, scheme) => {
    const hex = hslToHex(hsl.h, hsl.s, hsl.l);
    get().updateColor(part, hex, scheme);
  },

  updateHue: (part, hue, scheme) => {
    const state = get();
    const targetScheme = scheme || state.activeScheme;
    const schemeKey = targetScheme === 'A' ? 'schemeA' : 'schemeB';
    const currentColor = state[schemeKey][part];
    const currentHSL = hexToHsl(currentColor);
    const newHex = hslToHex(hue, currentHSL.s, currentHSL.l);
    
    set((st) => ({
      [schemeKey]: {
        ...st[schemeKey],
        [part]: newHex
      }
    }));
  },

  updateSaturation: (part, saturation, scheme) => {
    const state = get();
    const targetScheme = scheme || state.activeScheme;
    const schemeKey = targetScheme === 'A' ? 'schemeA' : 'schemeB';
    const currentColor = state[schemeKey][part];
    const currentHSL = hexToHsl(currentColor);
    const newHex = hslToHex(currentHSL.h, saturation, currentHSL.l);
    
    set((st) => ({
      [schemeKey]: {
        ...st[schemeKey],
        [part]: newHex
      }
    }));
  },

  updateLightness: (part, lightness, scheme) => {
    const state = get();
    const targetScheme = scheme || state.activeScheme;
    const schemeKey = targetScheme === 'A' ? 'schemeA' : 'schemeB';
    const currentColor = state[schemeKey][part];
    const currentHSL = hexToHsl(currentColor);
    const newHex = hslToHex(currentHSL.h, currentHSL.s, lightness);
    
    set((st) => ({
      [schemeKey]: {
        ...st[schemeKey],
        [part]: newHex
      }
    }));
  },

  toggleDifference: () => set((state) => ({ showDifference: !state.showDifference })),
  setShowDifference: (show) => set({ showDifference: show }),

  saveScheme: (name) => {
    const state = get();
    const { savedSchemes } = state;
    
    if (savedSchemes.length >= 10) {
      return false;
    }

    const newScheme: SavedScheme = {
      id: `scheme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim() || `方案 ${savedSchemes.length + 1}`,
      productType: state.productType,
      schemeA: { ...state.schemeA },
      schemeB: { ...state.schemeB },
      createdAt: Date.now()
    };

    const newSchemes = [...savedSchemes, newScheme];
    set({ savedSchemes: newSchemes });
    persistSavedSchemes(newSchemes);
    
    return true;
  },

  loadScheme: (id) => {
    const scheme = get().savedSchemes.find((s) => s.id === id);
    if (scheme) {
      set({
        productType: scheme.productType,
        schemeA: { ...scheme.schemeA },
        schemeB: { ...scheme.schemeB }
      });
    }
  },

  deleteScheme: (id) => {
    const newSchemes = get().savedSchemes.filter((s) => s.id !== id);
    set({ savedSchemes: newSchemes });
    persistSavedSchemes(newSchemes);
  },

  getColorDifference: () => {
    const state = get();
    return calculateColorDifferences(state.schemeA, state.schemeB);
  },

  getCurrentScheme: () => {
    const state = get();
    return state.activeScheme === 'A' ? state.schemeA : state.schemeB;
  },

  getCurrentColor: (part) => {
    const state = get();
    const schemeKey = state.activeScheme === 'A' ? 'schemeA' : 'schemeB';
    return state[schemeKey][part];
  },

  getCurrentHSL: (part) => {
    const color = get().getCurrentColor(part);
    return hexToHsl(color);
  }
}));

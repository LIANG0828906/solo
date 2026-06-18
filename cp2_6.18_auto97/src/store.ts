import { create } from 'zustand';
import {
  PaletteColor,
  ThemeScheme,
  ThemeMode,
  generatePalette,
  generateSchemes,
  isValidHex,
  copyToClipboard,
  generateExportJson
} from './utils/colorUtils';

interface AppState {
  baseColor: string;
  palette: PaletteColor[];
  currentMode: ThemeMode;
  schemes: Record<ThemeMode, ThemeScheme>;
  setBaseColor: (color: string) => void;
  toggleLock: (index: number) => void;
  setMode: (mode: ThemeMode) => void;
  copyColor: (hex: string) => Promise<void>;
  exportPalette: () => Promise<string>;
}

const initialBaseColor = '#FF6B35';
const initialPalette = generatePalette(initialBaseColor);
const initialSchemes = generateSchemes(initialPalette);

export const useStore = create<AppState>((set, get) => ({
  baseColor: initialBaseColor,
  palette: initialPalette,
  currentMode: 'light',
  schemes: initialSchemes,

  setBaseColor: (color: string) => {
    if (!isValidHex(color)) return;

    const startTime = performance.now();
    const { palette: existingPalette } = get();
    const newPalette = generatePalette(color, existingPalette);
    const newSchemes = generateSchemes(newPalette);

    set({
      baseColor: color.toUpperCase(),
      palette: newPalette,
      schemes: newSchemes
    });

    const endTime = performance.now();
    if (endTime - startTime > 80) {
      console.warn(`Color calculation took ${endTime - startTime}ms, exceeds 80ms target`);
    }
  },

  toggleLock: (index: number) => {
    set((state) => {
      const newPalette = [...state.palette];
      newPalette[index] = {
        ...newPalette[index],
        locked: !newPalette[index].locked
      };
      return { palette: newPalette };
    });
  },

  setMode: (mode: ThemeMode) => {
    set({ currentMode: mode });
  },

  copyColor: async (hex: string) => {
    await copyToClipboard(hex);
  },

  exportPalette: async () => {
    const { palette, schemes } = get();
    const json = generateExportJson(palette, schemes);
    await copyToClipboard(json);
    return json;
  }
}));

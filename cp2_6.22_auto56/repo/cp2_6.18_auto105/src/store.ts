import { create } from 'zustand';
import {
  generatePalette,
  generateScheme,
  Mode,
  ColorScheme,
} from './utils/colorUtils';

interface PaletteState {
  baseColor: string;
  palette: string[];
  locked: boolean[];
  currentMode: Mode;
  lightScheme: ColorScheme;
  darkScheme: ColorScheme;
  glassScheme: ColorScheme;

  setBaseColor: (color: string) => void;
  toggleLock: (index: number) => void;
  setMode: (mode: Mode) => void;
  getCurrentScheme: () => ColorScheme;
  exportJSON: () => string;
}

const DEFAULT_BASE_COLOR = '#FF6B35';
const initialPalette = generatePalette(DEFAULT_BASE_COLOR, 5);

export const usePaletteStore = create<PaletteState>((set, get) => ({
  baseColor: DEFAULT_BASE_COLOR,
  palette: initialPalette,
  locked: [false, false, false, false, false],
  currentMode: 'light',
  lightScheme: generateScheme(initialPalette, 'light'),
  darkScheme: generateScheme(initialPalette, 'dark'),
  glassScheme: generateScheme(initialPalette, 'glass'),

  setBaseColor: (color: string) => {
    const { locked } = get();
    const newPalette = generatePalette(color, 5);

    const finalPalette = newPalette.map((c, i) =>
      locked[i] ? get().palette[i] : c
    );

    set({
      baseColor: color,
      palette: finalPalette,
      lightScheme: generateScheme(finalPalette, 'light'),
      darkScheme: generateScheme(finalPalette, 'dark'),
      glassScheme: generateScheme(finalPalette, 'glass'),
    });
  },

  toggleLock: (index: number) => {
    set((state) => {
      const newLocked = [...state.locked];
      newLocked[index] = !newLocked[index];
      return { locked: newLocked };
    });
  },

  setMode: (mode: Mode) => {
    set({ currentMode: mode });
  },

  getCurrentScheme: () => {
    const { currentMode, lightScheme, darkScheme, glassScheme } = get();
    switch (currentMode) {
      case 'light':
        return lightScheme;
      case 'dark':
        return darkScheme;
      case 'glass':
        return glassScheme;
      default:
        return lightScheme;
    }
  },

  exportJSON: () => {
    const { baseColor, palette, locked, lightScheme, darkScheme, glassScheme } =
      get();
    const exportData = {
      baseColor,
      palette: palette.map((color, index) => ({
        color,
        locked: locked[index],
        index,
      })),
      schemes: {
        light: lightScheme,
        dark: darkScheme,
        glass: glassScheme,
      },
      exportTime: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  },
}));

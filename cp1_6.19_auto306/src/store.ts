import { create } from 'zustand';
import tinycolor from 'tinycolor2';

export interface PresetTheme {
  id: string;
  name: string;
  foreground: string;
  background: string;
}

export interface ContrastResult {
  ratio: number;
  aa: boolean;
  aaa: boolean;
  aaLarge: boolean;
  aaaLarge: boolean;
  level: 'AAA' | 'AA' | 'FAIL';
}

interface ColorStore {
  foreground: string;
  background: string;
  presets: PresetTheme[];
  contrastResult: ContrastResult;
  setForeground: (color: string) => void;
  setBackground: (color: string) => void;
  applyPreset: (preset: PresetTheme) => void;
  calculateContrast: () => ContrastResult;
}

const DEFAULT_PRESETS: PresetTheme[] = [
  { id: '1', name: 'Light Minimal', foreground: '#2C3E50', background: '#FFFFFF' },
  { id: '2', name: 'Dark Modern', foreground: '#E4E4E7', background: '#1A1A2E' },
  { id: '3', name: 'Sunset Warm', foreground: '#FFF1E6', background: '#C1440E' },
  { id: '4', name: 'Ocean Cool', foreground: '#E0F4FF', background: '#0E4C7B' },
  { id: '5', name: 'Forest Green', foreground: '#F0FFF0', background: '#1B5E20' },
  { id: '6', name: 'Cherry Blossom', foreground: '#5D4037', background: '#FCE4EC' },
  { id: '7', name: 'Cyberpunk Neon', foreground: '#00FFFF', background: '#0D0221' },
  { id: '8', name: 'Monochrome Gray', foreground: '#212121', background: '#E0E0E0' },
];

function computeContrast(fg: string, bg: string): ContrastResult {
  const fgColor = tinycolor(fg);
  const bgColor = tinycolor(bg);
  const ratio = tinycolor.readability(fgColor, bgColor);
  
  const aa = ratio >= 4.5;
  const aaa = ratio >= 7;
  const aaLarge = ratio >= 3;
  const aaaLarge = ratio >= 4.5;
  
  let level: 'AAA' | 'AA' | 'FAIL' = 'FAIL';
  if (aaa) level = 'AAA';
  else if (aa) level = 'AA';
  
  return { ratio, aa, aaa, aaLarge, aaaLarge, level };
}

export const useColorStore = create<ColorStore>((set, get) => ({
  foreground: '#FFFFFF',
  background: '#1A1A2E',
  presets: DEFAULT_PRESETS,
  contrastResult: computeContrast('#FFFFFF', '#1A1A2E'),

  setForeground: (color: string) => {
    const validColor = tinycolor(color);
    if (!validColor.isValid()) return;
    const hex = validColor.toHexString().toUpperCase();
    set((state) => {
      const newResult = computeContrast(hex, state.background);
      return { foreground: hex, contrastResult: newResult };
    });
  },

  setBackground: (color: string) => {
    const validColor = tinycolor(color);
    if (!validColor.isValid()) return;
    const hex = validColor.toHexString().toUpperCase();
    set((state) => {
      const newResult = computeContrast(state.foreground, hex);
      return { background: hex, contrastResult: newResult };
    });
  },

  applyPreset: (preset: PresetTheme) => {
    const fg = tinycolor(preset.foreground).toHexString().toUpperCase();
    const bg = tinycolor(preset.background).toHexString().toUpperCase();
    const newResult = computeContrast(fg, bg);
    set({ foreground: fg, background: bg, contrastResult: newResult });
  },

  calculateContrast: () => {
    const { foreground, background } = get();
    return computeContrast(foreground, background);
  },
}));

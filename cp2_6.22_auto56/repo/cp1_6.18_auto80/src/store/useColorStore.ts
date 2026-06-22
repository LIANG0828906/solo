import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  HSL,
  hslToHex,
  hexToHsl,
  isValidHex,
  normalizeHex,
} from '@/utils/colorUtils';

interface HistoryItem {
  id: string;
  hex: string;
  hsl: HSL;
}

interface PresetColor {
  id: string;
  name: string;
  hex: string;
  hsl: HSL;
}

interface ColorState {
  hsl: HSL;
  hex: string;
  history: HistoryItem[];
  presets: PresetColor[];

  setHSL: (h: number, s: number, l: number) => void;
  setHex: (hex: string) => boolean;
  setHue: (h: number) => void;
  setSaturation: (s: number) => void;
  setLightness: (l: number) => void;
  addToHistory: (hex: string, hsl: HSL) => void;
  selectHistory: (id: string) => void;
  applyPreset: (id: string) => void;
}

const PRESET_COLORS: Array<{ name: string; hex: string }> = [
  { name: '珊瑚红', hex: '#FF6B6B' },
  { name: '活力橙', hex: '#FF9F43' },
  { name: '明黄色', hex: '#FECA57' },
  { name: '青草绿', hex: '#1DD1A1' },
  { name: '翡翠绿', hex: '#00D2D3' },
  { name: '天空蓝', hex: '#54A0FF' },
  { name: '皇家蓝', hex: '#5F27CD' },
  { name: '紫罗兰', hex: '#A55EEA' },
  { name: '玫红色', hex: '#FF6B9D' },
  { name: '象牙白', hex: '#F5F6FA' },
  { name: '石墨灰', hex: '#576574' },
  { name: '深空黑', hex: '#222F3E' },
];

const DEFAULT_HSL: HSL = { h: 210, s: 70, l: 50 };
const DEFAULT_HEX = hslToHex(DEFAULT_HSL.h, DEFAULT_HSL.s, DEFAULT_HSL.l);

const buildPresets = (): PresetColor[] =>
  PRESET_COLORS.map((p) => {
    const hsl = hexToHsl(p.hex);
    return {
      id: uuidv4(),
      name: p.name,
      hex: p.hex,
      hsl: hsl || DEFAULT_HSL,
    };
  });

export const useColorStore = create<ColorState>((set, get) => ({
  hsl: DEFAULT_HSL,
  hex: DEFAULT_HEX,
  history: [],
  presets: buildPresets(),

  setHSL: (h, s, l) => {
    const clampedH = ((h % 360) + 360) % 360;
    const clampedS = Math.max(0, Math.min(100, s));
    const clampedL = Math.max(0, Math.min(100, l));
    const hex = hslToHex(clampedH, clampedS, clampedL);
    set({ hsl: { h: clampedH, s: clampedS, l: clampedL }, hex });
  },

  setHue: (h) => {
    const { hsl } = get();
    get().setHSL(h, hsl.s, hsl.l);
  },

  setSaturation: (s) => {
    const { hsl } = get();
    get().setHSL(hsl.h, s, hsl.l);
  },

  setLightness: (l) => {
    const { hsl } = get();
    get().setHSL(hsl.h, hsl.s, l);
  },

  setHex: (hex) => {
    if (!isValidHex(hex)) return false;
    const normalized = normalizeHex(hex);
    const hsl = hexToHsl(normalized);
    if (!hsl) return false;
    set({ hex: normalized, hsl });
    return true;
  },

  addToHistory: (hex, hsl) => {
    const { history } = get();
    const exists = history.find((item) => item.hex === hex);
    if (exists) return;
    const newItem: HistoryItem = { id: uuidv4(), hex, hsl };
    const updated = [newItem, ...history].slice(0, 10);
    set({ history: updated });
  },

  selectHistory: (id) => {
    const { history, addToHistory, setHSL } = get();
    const item = history.find((h) => h.id === id);
    if (!item) return;
    const filtered = history.filter((h) => h.id !== id);
    const updated = [item, ...filtered].slice(0, 10);
    set({ history: updated, hex: item.hex, hsl: item.hsl });
    addToHistory(item.hex, item.hsl);
  },

  applyPreset: (id) => {
    const { presets, setHSL, addToHistory } = get();
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setHSL(preset.hsl.h, preset.hsl.s, preset.hsl.l);
    addToHistory(preset.hex, preset.hsl);
  },
}));

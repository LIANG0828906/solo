import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  ColorMode,
  RGB,
  LightState,
  FilterState,
  FavoriteColor,
  PickerState,
  MatchSuggestion,
} from '../types';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mixAdditive(colors: LightState[]): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  for (const c of colors) {
    r = clamp(r + c.r, 0, 255);
    g = clamp(g + c.g, 0, 255);
    b = clamp(b + c.b, 0, 255);
  }
  return { r, g, b };
}

export function filterToRGB(filter: FilterState): { c: RGB; m: RGB; y: RGB } {
  const cOpacity = filter.c / 100;
  const mOpacity = filter.m / 100;
  const yOpacity = filter.y / 100;
  return {
    c: {
      r: Math.round(255 * (1 - cOpacity)),
      g: 255,
      b: 255,
    },
    m: {
      r: 255,
      g: Math.round(255 * (1 - mOpacity)),
      b: 255,
    },
    y: {
      r: 255,
      g: 255,
      b: Math.round(255 * (1 - yOpacity)),
    },
  };
}

export function mixSubtractive(filters: FilterState): {
  c: RGB;
  m: RGB;
  y: RGB;
  cm: RGB;
  cy: RGB;
  my: RGB;
  cmy: RGB;
} {
  const { c, m, y } = filterToRGB(filters);
  const multiply = (a: RGB, b: RGB): RGB => ({
    r: Math.round((a.r * b.r) / 255),
    g: Math.round((a.g * b.g) / 255),
    b: Math.round((a.b * b.b) / 255),
  });
  const cm = multiply(c, m);
  const cy = multiply(c, y);
  const my = multiply(m, y);
  const cmy = multiply(cm, y);
  return { c, m, y, cm, cy, my, cmy };
}

export function deltaE(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function similarity(delta: number): number {
  const maxDelta = Math.sqrt(255 * 255 * 3);
  return Math.max(0, Math.min(100, (1 - delta / maxDelta) * 100));
}

export function findBestMatch(
  target: RGB,
  mode: ColorMode
): MatchSuggestion | null {
  let best: MatchSuggestion | null = null;
  const steps = 16;
  if (mode === 'additive') {
    for (let ri = 0; ri <= steps; ri++) {
      for (let gi = 0; gi <= steps; gi++) {
        for (let bi = 0; bi <= steps; bi++) {
          const r = Math.round((ri / steps) * 255);
          const g = Math.round((gi / steps) * 255);
          const b = Math.round((bi / steps) * 255);
          const params: LightState = { r, g, b };
          const result = mixAdditive([params]);
          const d = deltaE(result, target);
          const sim = similarity(d);
          if (!best || d < best.deltaE) {
            best = { params, result, deltaE: d, similarity: sim, mode };
          }
        }
      }
    }
  } else {
    for (let ci = 0; ci <= steps; ci++) {
      for (let mi = 0; mi <= steps; mi++) {
        for (let yi = 0; yi <= steps; yi++) {
          const c = Math.round((ci / steps) * 100);
          const m = Math.round((mi / steps) * 100);
          const y = Math.round((yi / steps) * 100);
          const params: FilterState = { c, m, y };
          const mix = mixSubtractive(params);
          const d = deltaE(mix.cmy, target);
          const sim = similarity(d);
          if (!best || d < best.deltaE) {
            best = {
              params,
              result: mix.cmy,
              deltaE: d,
              similarity: sim,
              mode,
            };
          }
        }
      }
    }
  }
  return best;
}

interface ColorStoreState {
  mode: ColorMode;
  lights: LightState;
  filters: FilterState;
  targetColor: RGB | null;
  suggestedMix: MatchSuggestion | null;
  favorites: FavoriteColor[];
  pickerState: PickerState | null;
  drawerOpen: boolean;
  fading: boolean;

  setMode: (mode: ColorMode) => void;
  setLight: (key: keyof LightState, value: number) => void;
  setFilter: (key: keyof FilterState, value: number) => void;
  setTargetColor: (rgb: RGB | null) => void;
  applySuggestion: () => void;
  addFavorite: (rgb: RGB, source?: FavoriteColor['source']) => void;
  removeFavorite: (id: string) => void;
  openPicker: (
    canvasX: number,
    canvasY: number,
    pixels: { x: number; y: number; rgb: RGB }[],
    centerColor: RGB
  ) => void;
  closePicker: () => void;
  confirmPicker: () => void;
  toggleDrawer: () => void;
  setFading: (f: boolean) => void;
}

export const useColorStore = create<ColorStoreState>((set, get) => ({
  mode: 'additive',
  lights: { r: 255, g: 255, b: 255 },
  filters: { c: 100, m: 100, y: 100 },
  targetColor: null,
  suggestedMix: null,
  favorites: [],
  pickerState: null,
  drawerOpen: false,
  fading: false,

  setMode: (mode) => {
    if (get().mode === mode) return;
    set({ fading: true });
    setTimeout(() => {
      set({ mode, fading: false });
      const { targetColor } = get();
      if (targetColor) {
        const suggestion = findBestMatch(targetColor, mode);
        set({ suggestedMix: suggestion });
      }
    }, 450);
  },

  setLight: (key, value) => {
    set((s) => ({ lights: { ...s.lights, [key]: clamp(value, 0, 255) } }));
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: clamp(value, 0, 100) } }));
  },

  setTargetColor: (rgb) => {
    if (!rgb) {
      set({ targetColor: null, suggestedMix: null });
      return;
    }
    const clamped: RGB = {
      r: clamp(rgb.r, 0, 255),
      g: clamp(rgb.g, 0, 255),
      b: clamp(rgb.b, 0, 255),
    };
    const suggestion = findBestMatch(clamped, get().mode);
    set({ targetColor: clamped, suggestedMix: suggestion });
  },

  applySuggestion: () => {
    const { suggestedMix, mode } = get();
    if (!suggestedMix) return;
    if (mode === 'additive') {
      set({ lights: suggestedMix.params as LightState });
    } else {
      set({ filters: suggestedMix.params as FilterState });
    }
  },

  addFavorite: (rgb, source = 'picker') => {
    set((s) => {
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const exists = s.favorites.some((f) => f.hex === hex);
      if (exists) return s;
      const fav: FavoriteColor = {
        id: uuidv4(),
        rgb,
        hex,
        timestamp: Date.now(),
        source,
      };
      let newFavs = [...s.favorites, fav];
      if (newFavs.length > 8) {
        newFavs = newFavs.slice(-8);
      }
      return { favorites: newFavs, drawerOpen: true };
    });
  },

  removeFavorite: (id) => {
    set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) }));
  },

  openPicker: (canvasX, canvasY, pixels, centerColor) => {
    set({
      pickerState: {
        visible: true,
        canvasX,
        canvasY,
        pixels,
        centerColor,
      },
    });
  },

  closePicker: () => {
    set({ pickerState: null });
  },

  confirmPicker: () => {
    const { pickerState } = get();
    if (pickerState) {
      get().addFavorite(pickerState.centerColor, 'picker');
    }
    set({ pickerState: null });
  },

  toggleDrawer: () => {
    set((s) => ({ drawerOpen: !s.drawerOpen }));
  },

  setFading: (f) => set({ fading: f }),
}));

import { create } from 'zustand';
import {
  ColorStop,
  GeneratedVariant,
  generateVariants,
  formatGradientCSS,
} from '../engine/gradientEngine';

export interface Theme {
  id: string;
  name: string;
  stops: ColorStop[];
}

interface GradientState {
  stops: ColorStop[];
  variants: GeneratedVariant[];
  selectedIds: string[];
  themes: Theme[];
  sidebarOpen: boolean;
  activeStopId: string | null;
  hueIncrement: number;

  updateSwatch: (id: string, updates: Partial<ColorStop>) => void;
  setStopColor: (id: string, h: number, s: number, l: number) => void;
  setStopPosition: (id: string, position: number) => void;
  setActiveStop: (id: string | null) => void;
  generateSeries: () => void;
  setHueIncrement: (increment: number) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  saveTheme: (name: string) => void;
  deleteTheme: (id: string) => void;
  reorderThemes: (fromIndex: number, toIndex: number) => void;
  loadTheme: (id: string) => void;
  toggleSidebar: () => void;
  exportSelected: () => string;
  exportAll: () => string;
}

const defaultStops: ColorStop[] = [
  { id: 'stop-1', position: 0, color: { h: 210, s: 80, l: 60 } },
  { id: 'stop-2', position: 0.5, color: { h: 280, s: 70, l: 50 } },
  { id: 'stop-3', position: 1, color: { h: 340, s: 75, l: 55 } },
];

export const useGradientStore = create<GradientState>((set, get) => ({
  stops: defaultStops,
  variants: [],
  selectedIds: [],
  themes: [],
  sidebarOpen: true,
  activeStopId: null,
  hueIncrement: 30,

  updateSwatch: (id, updates) =>
    set((state) => ({
      stops: state.stops.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  setStopColor: (id, h, s, l) =>
    set((state) => ({
      stops: state.stops.map((st) =>
        st.id === id ? { ...st, color: { h, s, l } } : st
      ),
    })),

  setStopPosition: (id, position) =>
    set((state) => ({
      stops: state.stops.map((s) =>
        s.id === id ? { ...s, position: Math.max(0, Math.min(1, position)) } : s
      ),
    })),

  setActiveStop: (id) => set({ activeStopId: id }),

  generateSeries: () => {
    const { stops, hueIncrement } = get();
    const variants = generateVariants(stops, hueIncrement, 6);
    set({ variants, selectedIds: [] });
  },

  setHueIncrement: (increment) => set({ hueIncrement: increment }),

  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),

  selectAll: () =>
    set((state) => ({ selectedIds: state.variants.map((v) => v.id) })),

  clearSelection: () => set({ selectedIds: [] }),

  saveTheme: (name) => {
    const { stops, themes } = get();
    const newTheme: Theme = {
      id: `theme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      stops: stops.map((s) => ({ ...s, color: { ...s.color } })),
    };
    set({ themes: [...themes, newTheme] });
  },

  deleteTheme: (id) =>
    set((state) => ({
      themes: state.themes.filter((t) => t.id !== id),
    })),

  reorderThemes: (fromIndex, toIndex) =>
    set((state) => {
      const themes = [...state.themes];
      const [removed] = themes.splice(fromIndex, 1);
      themes.splice(toIndex, 0, removed);
      return { themes };
    }),

  loadTheme: (id) => {
    const theme = get().themes.find((t) => t.id === id);
    if (theme) {
      set({
        stops: theme.stops.map((s) => ({ ...s, color: { ...s.color } })),
        activeStopId: null,
      });
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  exportSelected: () => {
    const { variants, selectedIds } = get();
    return JSON.stringify(
      variants.filter((v) => selectedIds.includes(v.id)).map((v) => v.cssValue)
    );
  },

  exportAll: () => {
    const { variants } = get();
    return JSON.stringify(variants.map((v) => v.cssValue));
  },
}));

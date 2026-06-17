import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ColorItem } from '@/types';

interface PaletteState {
  colors: ColorItem[];
  selectedColorId: string | null;
  secondSelectedColorId: string | null;
  history: ColorItem[][];
  addColor: (hex: string, name: string, role: string) => void;
  removeColor: (id: string) => void;
  updateColor: (id: string, updates: Partial<ColorItem>) => void;
  selectColor: (id: string) => void;
  clearSelection: () => void;
  undo: () => void;
}

const DEFAULT_COLORS: ColorItem[] = [
  { id: uuidv4(), hex: '#3F51B5', name: 'Indigo', role: 'Primary' },
  { id: uuidv4(), hex: '#E91E63', name: 'Pink', role: 'Accent' },
  { id: uuidv4(), hex: '#009688', name: 'Teal', role: 'Secondary' },
  { id: uuidv4(), hex: '#FFC107', name: 'Amber', role: 'Warning' },
  { id: uuidv4(), hex: '#4CAF50', name: 'Green', role: 'Success' },
  { id: uuidv4(), hex: '#F44336', name: 'Red', role: 'Error' },
  { id: uuidv4(), hex: '#212121', name: 'Dark', role: 'Text Primary' },
  { id: uuidv4(), hex: '#FFFFFF', name: 'White', role: 'Background' },
];

const MAX_HISTORY = 30;

export const usePaletteStore = create<PaletteState>((set, get) => ({
  colors: DEFAULT_COLORS,
  selectedColorId: null,
  secondSelectedColorId: null,
  history: [],

  addColor: (hex, name, role) => {
    const state = get();
    const newColor: ColorItem = { id: uuidv4(), hex, name, role };
    set({
      colors: [...state.colors, newColor],
      history: [...state.history.slice(-MAX_HISTORY), state.colors],
    });
  },

  removeColor: (id) => {
    const state = get();
    const updated = state.colors.filter((c) => c.id !== id);
    set({
      colors: updated,
      history: [...state.history.slice(-MAX_HISTORY), state.colors],
      selectedColorId: state.selectedColorId === id ? null : state.selectedColorId,
      secondSelectedColorId: state.secondSelectedColorId === id ? null : state.secondSelectedColorId,
    });
  },

  updateColor: (id, updates) => {
    const state = get();
    const updated = state.colors.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    set({
      colors: updated,
      history: [...state.history.slice(-MAX_HISTORY), state.colors],
    });
  },

  selectColor: (id) => {
    const state = get();
    if (state.selectedColorId === null) {
      set({ selectedColorId: id, secondSelectedColorId: null });
    } else if (state.selectedColorId === id) {
      set({ selectedColorId: null, secondSelectedColorId: null });
    } else if (state.secondSelectedColorId === id) {
      set({ secondSelectedColorId: null });
    } else {
      set({ secondSelectedColorId: id });
    }
  },

  clearSelection: () => {
    set({ selectedColorId: null, secondSelectedColorId: null });
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const previous = state.history[state.history.length - 1];
    set({
      colors: previous,
      history: state.history.slice(0, -1),
      selectedColorId: null,
      secondSelectedColorId: null,
    });
  },
}));

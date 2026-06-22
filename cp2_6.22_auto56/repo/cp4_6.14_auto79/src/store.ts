import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GradientStore, PaletteItem } from './types';

const DEFAULT_GRADIENT = {
  startColor: '#6366f1',
  endColor: '#ec4899',
  angle: 135
};

export const useGradientStore = create<GradientStore>((set, get) => ({
  currentGradient: { ...DEFAULT_GRADIENT },
  palettes: [] as PaletteItem[],

  setStartColor: (color: string) =>
    set((state) => ({
      currentGradient: { ...state.currentGradient, startColor: color }
    })),

  setEndColor: (color: string) =>
    set((state) => ({
      currentGradient: { ...state.currentGradient, endColor: color }
    })),

  setAngle: (angle: number) =>
    set((state) => ({
      currentGradient: { ...state.currentGradient, angle }
    })),

  setCurrentGradient: (g: Partial<typeof DEFAULT_GRADIENT>) =>
    set((state) => ({
      currentGradient: { ...state.currentGradient, ...g }
    })),

  saveToPalette: () => {
    const { currentGradient, palettes } = get();
    const newItem: PaletteItem = {
      id: uuidv4(),
      gradient: { ...currentGradient },
      createdAt: Date.now()
    };
    set({ palettes: [...palettes, newItem] });
  },

  deletePalette: (id: string) =>
    set((state) => ({
      palettes: state.palettes.filter((p) => p.id !== id)
    })),

  reorderPalettes: (fromIndex: number, toIndex: number) =>
    set((state) => {
      const list = [...state.palettes];
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return { palettes: list };
    })
}));

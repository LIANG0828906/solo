import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Color } from '../utils/types';
import {
  extractColorsFromImage,
  normalizeHex,
  isValidHex
} from '../utils/colorUtils';
import { useProjectStore } from '../project/store';

interface PaletteState {
  colors: Color[];
  isExtracting: boolean;
  extractionError: string | null;
  addColor: (hex: string) => Color | null;
  addColorsFromImage: (imageFile: File) => Promise<Color[]>;
  removeColor: (id: string) => void;
  setColors: (colors: Color[]) => void;
  clearColors: () => void;
  getPrimaryColors: () => Color[];
  getColorsByRole: (role: 'primary' | 'secondary' | 'accent') => Color[];
  getColorById: (id: string) => Color | undefined;
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  colors: [],
  isExtracting: false,
  extractionError: null,

  addColor: (hex: string) => {
    if (!isValidHex(hex)) return null;
    const normalizedHex = normalizeHex(hex);
    const exists = get().colors.some(c => c.hex.toUpperCase() === normalizedHex);
    if (exists) return null;

    const newColor: Color = {
      id: uuidv4(),
      hex: normalizedHex
    };

    set(state => ({ colors: [...state.colors, newColor] }));

    const projectState = useProjectStore.getState();
    const currentProject = projectState.getCurrentProject();
    if (currentProject && !projectState.isReadonly()) {
      useProjectStore.setState(state => ({
        projects: state.projects.map(p => {
          if (p.id !== currentProject.id) return p;
          return {
            ...p,
            colorIds: [...p.colorIds, newColor.id]
          };
        })
      }));
    }

    return newColor;
  },

  addColorsFromImage: async (imageFile: File) => {
    set({ isExtracting: true, extractionError: null });

    try {
      const extracted = await extractColorsFromImage(imageFile, 6);
      const newColors: Color[] = [];
      const existingHexes = new Set(get().colors.map(c => c.hex.toUpperCase()));

      for (const ext of extracted) {
        const normalizedHex = normalizeHex(ext.hex);
        if (!existingHexes.has(normalizedHex)) {
          newColors.push({
            id: uuidv4(),
            hex: normalizedHex,
            percentage: ext.percentage,
            role: ext.role
          });
          existingHexes.add(normalizedHex);
        }
      }

      set(state => ({
        colors: [...state.colors, ...newColors],
        isExtracting: false
      }));

      return newColors;
    } catch (error) {
      set({
        isExtracting: false,
        extractionError: error instanceof Error ? error.message : '提取失败'
      });
      return [];
    }
  },

  removeColor: (id: string) => {
    set(state => ({
      colors: state.colors.filter(c => c.id !== id)
    }));
  },

  setColors: (colors: Color[]) => {
    set({ colors });
  },

  clearColors: () => {
    set({ colors: [] });
  },

  getPrimaryColors: () => {
    return get().colors.filter(c => c.role === 'primary');
  },

  getColorsByRole: (role: 'primary' | 'secondary' | 'accent') => {
    return get().colors.filter(c => c.role === role);
  },

  getColorById: (id: string) => {
    return get().colors.find(c => c.id === id);
  }
}));

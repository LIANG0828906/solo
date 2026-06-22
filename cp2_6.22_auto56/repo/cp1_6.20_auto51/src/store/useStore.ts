import { create } from 'zustand';
import type { HSL, Palette, Project, HarmonyRule, ColorBlindMode } from '@/types';
import { generateAllHarmonyPalettes } from '@/utils/colorHarmony';
import { hslToHex } from '@/utils/colorUtils';

interface AppState {
  hsl: HSL;
  selectedRule: HarmonyRule;
  colorBlindMode: ColorBlindMode;
  generatedPalettes: { rule: HarmonyRule; colors: string[] }[];
  savedPalettes: Palette[];
  projects: Project[];
  activeTab: 'generator' | 'favorites' | 'projects';
  selectedProject: Project | null;
  drawerOpen: boolean;
  currentUser: { email: string };
  
  setHSL: (hsl: HSL) => void;
  setSelectedRule: (rule: HarmonyRule) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  generatePalettes: () => void;
  addSavedPalette: (palette: Omit<Palette, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeSavedPalette: (id: string) => void;
  updateSavedPalette: (id: string, data: Partial<Palette>) => void;
  setSavedPalettes: (palettes: Palette[]) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setActiveTab: (tab: 'generator' | 'favorites' | 'projects') => void;
  setSelectedProject: (project: Project | null) => void;
  setDrawerOpen: (open: boolean) => void;
  adjustPaletteColor: (paletteIndex: number, colorIndex: number, type: 'brightness' | 'saturation', value: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  hsl: { h: 210, s: 70, l: 50 },
  selectedRule: 'complementary',
  colorBlindMode: 'normal',
  generatedPalettes: [],
  savedPalettes: [],
  projects: [],
  activeTab: 'generator',
  selectedProject: null,
  drawerOpen: false,
  currentUser: { email: 'designer@example.com' },

  setHSL: (hsl) => {
    set({ hsl });
    get().generatePalettes();
  },

  setSelectedRule: (rule) => {
    set({ selectedRule: rule });
  },

  setColorBlindMode: (mode) => set({ colorBlindMode: mode }),

  generatePalettes: () => {
    const { hsl } = get();
    const palettes = generateAllHarmonyPalettes(hsl);
    set({ generatedPalettes: palettes });
  },

  addSavedPalette: (paletteData) => {
    const now = new Date().toISOString();
    const newPalette: Palette = {
      ...paletteData,
      id: `local-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    set((state) => ({
      savedPalettes: [newPalette, ...state.savedPalettes]
    }));
  },

  removeSavedPalette: (id) => {
    set((state) => ({
      savedPalettes: state.savedPalettes.filter(p => p.id !== id)
    }));
  },

  updateSavedPalette: (id, data) => {
    set((state) => ({
      savedPalettes: state.savedPalettes.map(p => 
        p.id === id 
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p
      )
    }));
  },

  setSavedPalettes: (palettes) => set({ savedPalettes: palettes }),

  setProjects: (projects) => set({ projects }),

  addProject: (project) => {
    set((state) => ({
      projects: [project, ...state.projects]
    }));
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedProject: (project) => set({ selectedProject: project }),

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  adjustPaletteColor: (paletteIndex, colorIndex, type, value) => {
    set((state) => {
      const newPalettes = [...state.generatedPalettes];
      const palette = { ...newPalettes[paletteIndex] };
      const colors = [...palette.colors];
      
      const hex = colors[colorIndex];
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      
      if (type === 'brightness') {
        const amount = Math.round(value * 2.55);
        colors[colorIndex] = '#' + 
          [r, g, b].map(c => 
            Math.max(0, Math.min(255, c + amount))
              .toString(16).padStart(2, '0')
          ).join('').toUpperCase();
      } else {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const gray = Math.round((r + g + b) / 3);
        
        const sat = value / 100;
        colors[colorIndex] = '#' + 
          [r, g, b].map(c => 
            Math.max(0, Math.min(255, Math.round(gray + (c - gray) * sat)))
              .toString(16).padStart(2, '0')
          ).join('').toUpperCase();
      }
      
      palette.colors = colors;
      newPalettes[paletteIndex] = palette;
      
      return { generatedPalettes: newPalettes };
    });
  }
}));

import { create } from 'zustand';
import type { Tool, ThemeName } from '../types/board';
import { loadTheme, saveTheme, getTheme } from '../utils/storageUtils';
import type { Theme } from '../types/board';

interface UIStore {
  currentTool: Tool;
  currentColor: string;
  currentStrokeWidth: number;
  themeName: ThemeName;
  theme: Theme;
  gridColor: string;
  gridOpacity: number;
  showPropertyPanel: boolean;
  showAssetLibrary: boolean;
  ripple: { x: number; y: number; active: boolean; progress: number } | null;
  snapFlash: { x: number; y: number; active: boolean } | null;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  toggleTheme: () => void;
  setTheme: (name: ThemeName) => void;
  setGridColor: (color: string) => void;
  setGridOpacity: (opacity: number) => void;
  togglePropertyPanel: (show?: boolean) => void;
  toggleAssetLibrary: (show?: boolean) => void;
  triggerRipple: (x: number, y: number) => void;
  triggerSnapFlash: (x: number, y: number) => void;
}

const initialThemeName = loadTheme() || 'light';

export const useUIStore = create<UIStore>((set, get) => ({
  currentTool: 'select',
  currentColor: '#2196F3',
  currentStrokeWidth: 3,
  themeName: initialThemeName,
  theme: getTheme(initialThemeName),
  gridColor: initialThemeName === 'dark' ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)',
  gridOpacity: initialThemeName === 'dark' ? 0.08 : 0.06,
  showPropertyPanel: false,
  showAssetLibrary: false,
  ripple: null,
  snapFlash: null,

  setTool: (tool) => set({ currentTool: tool }),

  setColor: (color) => set({ currentColor: color }),

  setStrokeWidth: (width) => set({ currentStrokeWidth: Math.max(1, Math.min(20, width)) }),

  toggleTheme: () => {
    const { themeName } = get();
    const newName: ThemeName = themeName === 'light' ? 'dark' : 'light';
    get().setTheme(newName);
  },

  setTheme: (name) => {
    const theme = getTheme(name);
    set({
      themeName: name,
      theme,
      gridColor: name === 'dark' ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)',
      gridOpacity: name === 'dark' ? 0.08 : 0.06,
    });
    document.body.classList.toggle('dark', name === 'dark');
    saveTheme(name);
  },

  setGridColor: (color) => set({ gridColor: color }),

  setGridOpacity: (opacity) => set({ gridOpacity: Math.max(0, Math.min(1, opacity)) }),

  togglePropertyPanel: (show) => {
    if (show === undefined) {
      set((state) => ({ showPropertyPanel: !state.showPropertyPanel }));
    } else {
      set({ showPropertyPanel: show });
    }
  },

  toggleAssetLibrary: (show) => {
    if (show === undefined) {
      set((state) => ({ showAssetLibrary: !state.showAssetLibrary }));
    } else {
      set({ showAssetLibrary: show });
    }
  },

  triggerRipple: (x, y) => {
    set({ ripple: { x, y, active: true, progress: 0 } });
    let progress = 0;
    const animate = () => {
      progress += 0.05;
      if (progress >= 1) {
        set({ ripple: null });
        return;
      }
      set((state) => ({
        ripple: state.ripple ? { ...state.ripple, progress } : null,
      }));
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },

  triggerSnapFlash: (x, y) => {
    set({ snapFlash: { x, y, active: true } });
    setTimeout(() => set({ snapFlash: null }), 200);
  },
}));

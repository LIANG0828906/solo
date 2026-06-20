import { create } from 'zustand';
import type { ITypographyParams, ISavedScheme } from '../typography/types';
import { DEFAULT_PARAMS } from '../typography/types';
import { generatePreviewUrl } from '../typography/engine';

interface TypographyStore {
  text: string;
  currentParams: ITypographyParams;
  schemes: ISavedScheme[];
  compareMode: boolean;
  selectedIndex: number;
  compareIndex: number;
  setText: (text: string) => void;
  setParams: (params: Partial<ITypographyParams>) => void;
  saveScheme: (name?: string) => void;
  deleteScheme: (id: string) => void;
  toggleCompareMode: () => void;
  setSelectedIndex: (index: number) => void;
  setCompareIndex: (index: number) => void;
  applyScheme: (index: number) => void;
}

export const useStore = create<TypographyStore>((set, get) => ({
  text: 'FontLab排版工坊是一款专业的在线字体设计工具，帮助设计师快速尝试不同的排版组合。Typography is the art and technique of arranging type to make written language legible, readable, and appealing when displayed.',
  currentParams: { ...DEFAULT_PARAMS },
  schemes: [],
  compareMode: false,
  selectedIndex: -1,
  compareIndex: -1,

  setText: (text: string) => set({ text: text.slice(0, 500) }),

  setParams: (params: Partial<ITypographyParams>) =>
    set((state) => ({
      currentParams: { ...state.currentParams, ...params },
    })),

  saveScheme: (name?: string) => {
    const { text, currentParams, schemes } = get();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const schemeName = name || `方案 ${schemes.length + 1}`;
    const thumbnail = generatePreviewUrl(text, currentParams, 200, 60);

    const newScheme: ISavedScheme = {
      id,
      name: schemeName,
      createdAt: Date.now(),
      text,
      params: { ...currentParams },
      thumbnail,
    };

    set({ schemes: [...schemes, newScheme] });
  },

  deleteScheme: (id: string) =>
    set((state) => ({
      schemes: state.schemes.filter((s) => s.id !== id),
    })),

  toggleCompareMode: () => {
    const { compareMode, schemes, selectedIndex } = get();
    if (!compareMode && schemes.length < 2) return;
    set((state) => ({
      compareMode: !state.compareMode,
      compareIndex: !state.compareMode
        ? state.selectedIndex >= 0
          ? (state.selectedIndex + 1) % schemes.length
          : schemes.length > 1
            ? 1
            : 0
        : state.compareIndex,
    }));
  },

  setSelectedIndex: (index: number) => set({ selectedIndex: index }),

  setCompareIndex: (index: number) => set({ compareIndex: index }),

  applyScheme: (index: number) => {
    const { schemes } = get();
    if (index >= 0 && index < schemes.length) {
      const scheme = schemes[index];
      set({
        text: scheme.text,
        currentParams: { ...scheme.params },
      });
    }
  },
}));

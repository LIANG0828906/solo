import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  ThemeMode,
  Color,
  CurrentPalettes,
  PaletteType,
  GeneratedPaletteType,
  SavedPalette,
  Palette,
  Palettes,
  LockedIndices,
} from '@/types';

const STORAGE_KEY = 'palette-master-saved';

interface AppState {
  themeMode: ThemeMode;
  imageData: ImageData | null;
  imageUrl: string | null;
  imagePreview: string | null;
  extractedColors: Color[];
  currentPalettes: CurrentPalettes | null;
  palettes: Palettes;
  lockedIndices: LockedIndices;
  savedPalettes: SavedPalette[];
  activePaletteType: PaletteType;
  activeType: GeneratedPaletteType;
  searchKeyword: string;
  filterTag: string;
  showExportModal: boolean;
  exportModalOpen: boolean;
  exportPalette: Palette | null;

  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setImage: (imageData: ImageData, imageUrl: string) => void;
  setImagePreview: (url: string | null) => void;
  setExtractedColors: (colors: Color[]) => void;
  setCurrentPalettes: (palettes: CurrentPalettes) => void;
  setPalettes: (palettes: Palettes) => void;
  setActivePaletteType: (type: PaletteType) => void;
  setActiveType: (type: GeneratedPaletteType) => void;
  updatePaletteColor: (type: PaletteType, index: number, color: Color) => void;
  lockColor: (type: GeneratedPaletteType, index: number) => void;
  onColorClick: (type: GeneratedPaletteType, index: number) => void;
  onColorChange: (type: GeneratedPaletteType, index: number, color: Color) => void;
  onActiveTypeChange: (type: GeneratedPaletteType) => void;
  unlockColor: (type: GeneratedPaletteType) => void;
  savePalette: (name: string, tags: string[]) => void;
  deletePalette: (id: string) => void;
  deleteSavedPalette: (id: string) => void;
  setSearchKeyword: (keyword: string) => void;
  setFilterTag: (tag: string) => void;
  setShowExportModal: (show: boolean) => void;
  setExportModalOpen: (show: boolean) => void;
  setExportPalette: (palette: Palette | null) => void;
  loadSavedPalette: (palette: SavedPalette) => void;
  onLoad: (palette: SavedPalette) => void;
  onDelete: (id: string) => void;
  onSearch: (keyword: string) => void;
  onFilterTag: (tag: string) => void;
  initFromLocalStorage: () => void;
}

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = localStorage.getItem('theme') as ThemeMode;
  if (savedTheme) return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialLockedIndices: LockedIndices = {
  monochromatic: null,
  complementary: null,
  triadic: null,
};

const initialPalettes: Palettes = {
  extracted: [],
  monochromatic: [],
  complementary: [],
  triadic: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  themeMode: getInitialTheme(),
  imageData: null,
  imageUrl: null,
  imagePreview: null,
  extractedColors: [],
  currentPalettes: null,
  palettes: initialPalettes,
  lockedIndices: initialLockedIndices,
  savedPalettes: [],
  activePaletteType: 'extracted',
  activeType: 'monochromatic',
  searchKeyword: '',
  filterTag: '',
  showExportModal: false,
  exportModalOpen: false,
  exportPalette: null,

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', mode);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(mode);
    }
  },

  toggleTheme: () => {
    const current = get().themeMode;
    const next = current === 'light' ? 'dark' : 'light';
    get().setThemeMode(next);
  },

  setImage: (imageData, imageUrl) => {
    set({ imageData, imageUrl, imagePreview: imageUrl });
  },

  setImagePreview: (url) => {
    set({ imagePreview: url });
  },

  setExtractedColors: (colors) => {
    set((state) => ({
      extractedColors: colors,
      palettes: {
        ...state.palettes,
        extracted: colors,
      },
    }));
  },

  setCurrentPalettes: (palettes) => {
    set((state) => ({
      currentPalettes: palettes,
      palettes: {
        ...state.palettes,
        monochromatic: palettes.monochromatic,
        complementary: palettes.complementary,
        triadic: palettes.triadic,
      },
      lockedIndices: palettes.lockedIndices,
    }));
  },

  setPalettes: (palettes) => {
    const newCurrentPalettes: CurrentPalettes = {
      monochromatic: palettes.monochromatic,
      complementary: palettes.complementary,
      triadic: palettes.triadic,
      lockedIndices: initialLockedIndices,
    };
    set({
      extractedColors: palettes.extracted,
      palettes,
      currentPalettes: newCurrentPalettes,
      lockedIndices: initialLockedIndices,
    });
  },

  setActivePaletteType: (type) => {
    set({ activePaletteType: type });
  },

  setActiveType: (type) => {
    set({ activeType: type });
  },

  updatePaletteColor: (type, index, color) => {
    if (type === 'extracted') {
      const palette = [...get().palettes.extracted];
      palette[index] = color;
      set((state) => ({
        palettes: { ...state.palettes, extracted: palette },
        extractedColors: palette,
      }));
      return;
    }

    const current = get().currentPalettes;
    if (!current) return;

    const palette = [...current[type]];
    palette[index] = color;

    set((state) => ({
      currentPalettes: {
        ...current,
        [type]: palette,
      },
      palettes: {
        ...state.palettes,
        [type]: palette,
      },
    }));
  },

  lockColor: (type, index) => {
    const current = get().currentPalettes;
    set((state) => {
      const newLockedIndices = {
        ...state.lockedIndices,
        [type]: state.lockedIndices[type] === index ? null : index,
      };
      const newCurrentPalettes = current
        ? { ...current, lockedIndices: newLockedIndices }
        : null;
      return {
        lockedIndices: newLockedIndices,
        currentPalettes: newCurrentPalettes,
      };
    });
  },

  onColorClick: (type, index) => {
    get().lockColor(type, index);
  },

  onColorChange: (type, index, color) => {
    get().updatePaletteColor(type, index, color);
  },

  onActiveTypeChange: (type) => {
    get().setActiveType(type);
  },

  unlockColor: (type) => {
    const current = get().currentPalettes;
    set((state) => {
      const newLockedIndices = {
        ...state.lockedIndices,
        [type]: null,
      };
      const newCurrentPalettes = current
        ? { ...current, lockedIndices: newLockedIndices }
        : null;
      return {
        lockedIndices: newLockedIndices,
        currentPalettes: newCurrentPalettes,
      };
    });
  },

  savePalette: (name, tags) => {
    const { palettes, activePaletteType, savedPalettes } = get();

    const colors = palettes[activePaletteType] || [];

    const newPalette: SavedPalette = {
      id: uuidv4(),
      name,
      tags,
      colors,
      type: activePaletteType,
      createdAt: Date.now(),
    };

    const updated = [...savedPalettes, newPalette];
    set({ savedPalettes: updated });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  deletePalette: (id) => {
    const updated = get().savedPalettes.filter((p) => p.id !== id);
    set({ savedPalettes: updated });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  deleteSavedPalette: (id) => {
    get().deletePalette(id);
  },

  setSearchKeyword: (keyword) => {
    set({ searchKeyword: keyword });
  },

  setFilterTag: (tag) => {
    set({ filterTag: tag });
  },

  setShowExportModal: (show) => {
    set({ showExportModal: show, exportModalOpen: show });
  },

  setExportModalOpen: (show) => {
    set({ exportModalOpen: show, showExportModal: show });
  },

  setExportPalette: (palette) => {
    set({ exportPalette: palette });
  },

  loadSavedPalette: (palette) => {
    if (palette.type === 'extracted') {
      set((state) => ({
        extractedColors: palette.colors,
        palettes: { ...state.palettes, extracted: palette.colors },
        activePaletteType: 'extracted',
      }));
      return;
    }

    const generatedType = palette.type as GeneratedPaletteType;
    const current = get().currentPalettes;
    if (!current) {
      const newCurrentPalettes: CurrentPalettes = {
        monochromatic: [],
        complementary: [],
        triadic: [],
        lockedIndices: initialLockedIndices,
      };
      newCurrentPalettes[generatedType] = palette.colors;

      set((state) => ({
        currentPalettes: newCurrentPalettes,
        palettes: {
          ...state.palettes,
          [generatedType]: palette.colors,
        },
        activePaletteType: generatedType,
        activeType: generatedType,
      }));
    } else {
      set((state) => ({
        currentPalettes: {
          ...current,
          [generatedType]: palette.colors,
        },
        palettes: {
          ...state.palettes,
          [generatedType]: palette.colors,
        },
        activePaletteType: generatedType,
        activeType: generatedType,
      }));
    }
  },

  onLoad: (palette) => {
    get().loadSavedPalette(palette);
  },

  onDelete: (id) => {
    get().deletePalette(id);
  },

  onSearch: (keyword) => {
    get().setSearchKeyword(keyword);
  },

  onFilterTag: (tag) => {
    get().setFilterTag(tag);
  },

  initFromLocalStorage: () => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedPalette[];
        set({ savedPalettes: parsed });
      } catch {
        set({ savedPalettes: [] });
      }
    }
  },
}));

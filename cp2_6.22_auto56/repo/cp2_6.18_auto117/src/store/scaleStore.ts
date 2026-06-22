import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FontScaleLevel, GridBase } from '../types';

const DEFAULT_LEVELS: FontScaleLevel[] = [
  {
    id: uuidv4(),
    name: 'H1',
    fontFamily: 'Inter',
    fontSize: 48,
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: 0,
  },
  {
    id: uuidv4(),
    name: 'H2',
    fontFamily: 'Inter',
    fontSize: 32,
    lineHeight: 1.3,
    fontWeight: 600,
    letterSpacing: 0,
  },
  {
    id: uuidv4(),
    name: 'Body',
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 1.6,
    fontWeight: 400,
    letterSpacing: 0,
  },
];

const DEFAULT_NAMES = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

interface ScaleStore {
  levels: FontScaleLevel[];
  selectedLevelId: string | null;
  gridBase: GridBase;
  showExportModal: boolean;

  addLevel: () => void;
  updateLevel: (id: string, updates: Partial<FontScaleLevel>) => void;
  selectLevel: (id: string) => void;
  setGridBase: (base: GridBase) => void;
  toggleExportModal: () => void;
  getExportJSON: () => string;
  getExportCSS: () => string;
}

export const useScaleStore = create<ScaleStore>((set, get) => ({
  levels: DEFAULT_LEVELS,
  selectedLevelId: DEFAULT_LEVELS[0]?.id ?? null,
  gridBase: null,
  showExportModal: false,

  addLevel: () => {
    const { levels } = get();
    if (levels.length >= 6) return;

    const nextIndex = levels.length;
    const newLevel: FontScaleLevel = {
      id: uuidv4(),
      name: DEFAULT_NAMES[nextIndex] || `Level ${nextIndex + 1}`,
      fontFamily: 'Inter',
      fontSize: Math.max(16, 48 - nextIndex * 8),
      lineHeight: 1.2 + nextIndex * 0.1,
      fontWeight: 700 - nextIndex * 100,
      letterSpacing: 0,
    };

    set((state) => ({
      levels: [...state.levels, newLevel],
      selectedLevelId: newLevel.id,
    }));
  },

  updateLevel: (id, updates) => {
    set((state) => ({
      levels: state.levels.map((level) =>
        level.id === id ? { ...level, ...updates } : level
      ),
    }));
  },

  selectLevel: (id) => {
    set({ selectedLevelId: id });
  },

  setGridBase: (base) => {
    set({ gridBase: base });
  },

  toggleExportModal: () => {
    set((state) => ({ showExportModal: !state.showExportModal }));
  },

  getExportJSON: () => {
    const { levels } = get();
    const exportData = {
      levels: levels.map(({ id, ...rest }) => rest),
      generatedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportData, null, 2);
  },

  getExportCSS: () => {
    const { levels } = get();
    const cssVars = levels
      .map((level) => {
        const varName = level.name.toLowerCase().replace(/\s+/g, '-');
        return [
          `  --fs-${varName}: ${level.fontSize}px;`,
          `  --lh-${varName}: ${level.lineHeight};`,
          `  --fw-${varName}: ${level.fontWeight};`,
          `  --ls-${varName}: ${level.letterSpacing}em;`,
          `  --ff-${varName}: '${level.fontFamily}', sans-serif;`,
        ].join('\n');
      })
      .join('\n\n');

    return `:root {\n${cssVars}\n}`;
  },
}));

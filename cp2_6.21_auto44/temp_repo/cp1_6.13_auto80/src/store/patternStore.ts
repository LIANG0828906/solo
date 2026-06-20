import { create } from 'zustand';
import { PatternParams, SavedPattern, DEFAULT_PARAMS } from '@/types/pattern';

interface PatternState {
  params: PatternParams;
  savedPatterns: SavedPattern[];
  isGalleryOpen: boolean;
  isPanelOpen: boolean;
  setParams: (params: Partial<PatternParams>) => void;
  resetParams: () => void;
  setSavedPatterns: (patterns: SavedPattern[]) => void;
  addSavedPattern: (pattern: SavedPattern) => void;
  removeSavedPattern: (id: string) => void;
  loadPatternParams: (pattern: SavedPattern) => void;
  toggleGallery: () => void;
  togglePanel: () => void;
  randomizeParams: () => void;
}

const SYMMETRY_TYPES: PatternParams['symmetryType'][] = ['rotation', 'reflection', 'translation'];
const BASE_SHAPES: PatternParams['baseShape'][] = ['circle', 'triangle', 'hexagon', 'spiral'];
const COLOR_SCHEMES: PatternParams['colorScheme'][] = ['gradient', 'complementary', 'analogous'];
const COLORS = [
  '#ff6b6b', '#ee5a52', '#ff8e53', '#ffd93d',
  '#6bcb77', '#4ecdc4', '#45b7d1', '#6366f1',
  '#a855f7', '#ec4899', '#f472b6', '#38bdf8',
];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomColors(count: number): string[] {
  const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const usePatternStore = create<PatternState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  savedPatterns: [],
  isGalleryOpen: true,
  isPanelOpen: true,

  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  resetParams: () =>
    set(() => ({
      params: { ...DEFAULT_PARAMS },
    })),

  setSavedPatterns: (patterns) =>
    set(() => ({
      savedPatterns: patterns,
    })),

  addSavedPattern: (pattern) =>
    set((state) => ({
      savedPatterns: [pattern, ...state.savedPatterns],
    })),

  removeSavedPattern: (id) =>
    set((state) => ({
      savedPatterns: state.savedPatterns.filter((p) => p.id !== id),
    })),

  loadPatternParams: (pattern) =>
    set(() => ({
      params: { ...pattern.params },
    })),

  toggleGallery: () =>
    set((state) => ({
      isGalleryOpen: !state.isGalleryOpen,
    })),

  togglePanel: () =>
    set((state) => ({
      isPanelOpen: !state.isPanelOpen,
    })),

  randomizeParams: () => {
    const colorCount = Math.floor(Math.random() * 3) + 2;
    set(() => ({
      params: {
        symmetryType: randomFromArray(SYMMETRY_TYPES),
        baseShape: randomFromArray(BASE_SHAPES),
        colorScheme: randomFromArray(COLOR_SCHEMES),
        complexity: Math.floor(Math.random() * 20) + 1,
        rotationSpeed: Math.floor(Math.random() * 6),
        baseColors: generateRandomColors(colorCount),
        backgroundColor: '#1a1a2e',
      },
    }));
  },
}));

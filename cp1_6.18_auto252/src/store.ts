import { create } from 'zustand';

export const GRID_SIZE = 16;
export const INITIAL_COLOR = '#E8E8E8';

export interface ColorItem {
  name: string;
  value: string;
  category: 'warm' | 'cool' | 'neutral';
}

export const COLORS: ColorItem[] = [
  { name: '热情红', value: '#FF6B6B', category: 'warm' },
  { name: '乐观橙', value: '#FFA94D', category: 'warm' },
  { name: '欢乐黄', value: '#FFD93D', category: 'warm' },
  { name: '温和粉', value: '#FFB5E8', category: 'warm' },
  { name: '平静蓝', value: '#74B9FF', category: 'cool' },
  { name: '忧郁蓝紫', value: '#A29BFE', category: 'cool' },
  { name: '静谧青', value: '#55EFC4', category: 'cool' },
  { name: '专注翠', value: '#00B894', category: 'cool' },
  { name: '优雅灰', value: '#636E72', category: 'neutral' },
  { name: '知性棕', value: '#B2BEC3', category: 'neutral' },
  { name: '神秘黑', value: '#2D3436', category: 'neutral' },
  { name: '纯洁白', value: '#DFE6E9', category: 'neutral' },
];

export interface HistoryStep {
  index: number;
  color: string;
  previousColor: string;
}

interface TapestryState {
  grid: string[];
  selectedColor: string;
  history: HistoryStep[];
  isPlaying: boolean;
  playIndex: number;
  playbackGrid: string[] | null;
  setSelectedColor: (color: string) => void;
  setCellColor: (index: number) => void;
  undo: () => void;
  clear: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackGrid: (grid: string[] | null) => void;
  setPlayIndex: (index: number) => void;
}

const createInitialGrid = (): string[] => {
  return Array(GRID_SIZE * GRID_SIZE).fill(INITIAL_COLOR);
};

export const useTapestryStore = create<TapestryState>((set, get) => ({
  grid: createInitialGrid(),
  selectedColor: COLORS[0].value,
  history: [],
  isPlaying: false,
  playIndex: 0,
  playbackGrid: null,

  setSelectedColor: (color: string) => {
    set({ selectedColor: color });
  },

  setCellColor: (index: number) => {
    const { grid, selectedColor, history, isPlaying } = get();
    if (isPlaying) return;
    
    const previousColor = grid[index];
    if (previousColor === selectedColor) return;

    const newGrid = [...grid];
    newGrid[index] = selectedColor;

    set({
      grid: newGrid,
      history: [...history, { index, color: selectedColor, previousColor }],
    });
  },

  undo: () => {
    const { grid, history, isPlaying } = get();
    if (isPlaying || history.length === 0) return;

    const lastStep = history[history.length - 1];
    const newGrid = [...grid];
    newGrid[lastStep.index] = lastStep.previousColor;

    set({
      grid: newGrid,
      history: history.slice(0, -1),
    });
  },

  clear: () => {
    const { isPlaying } = get();
    if (isPlaying) return;
    set({
      grid: createInitialGrid(),
      history: [],
    });
  },

  startPlayback: () => {
    const { history } = get();
    if (history.length === 0) return;
    set({
      isPlaying: true,
      playIndex: 0,
      playbackGrid: createInitialGrid(),
    });
  },

  stopPlayback: () => {
    set({
      isPlaying: false,
      playIndex: 0,
      playbackGrid: null,
    });
  },

  setPlaybackGrid: (grid: string[] | null) => {
    set({ playbackGrid: grid });
  },

  setPlayIndex: (index: number) => {
    set({ playIndex: index });
  },
}));

export type PixelGrid = string[][];

export const GRID_SIZE = 8;

export const DEFAULT_COLOR = '#000';

export const PALETTE = [
  '#FF4444',
  '#FF8844',
  '#FFDD44',
  '#44BB44',
  '#4444FF',
  '#8844FF',
  '#FF44AA',
  '#FFFFFF',
];

function createEmptyGrid(): PixelGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => DEFAULT_COLOR)
  );
}

interface PixelGridState {
  grid: PixelGrid;
  selectedColor: string;
  setPixel: (row: number, col: number, color: string) => void;
  clearPixel: (row: number, col: number) => void;
  setSelectedColor: (color: string) => void;
  resetGrid: () => void;
  loadGrid: (grid: PixelGrid) => void;
}

import { create } from 'zustand';

export const usePixelGrid = create<PixelGridState>((set) => ({
  grid: createEmptyGrid(),
  selectedColor: PALETTE[0],
  setPixel: (row, col, color) =>
    set((state) => {
      const newGrid = state.grid.map((r) => [...r]);
      newGrid[row][col] = color;
      return { grid: newGrid };
    }),
  clearPixel: (row, col) =>
    set((state) => {
      const newGrid = state.grid.map((r) => [...r]);
      newGrid[row][col] = DEFAULT_COLOR;
      return { grid: newGrid };
    }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  resetGrid: () => set({ grid: createEmptyGrid() }),
  loadGrid: (grid) => set({ grid }),
}));

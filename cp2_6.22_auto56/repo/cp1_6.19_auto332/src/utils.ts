import { PixelColor, GRID_BG_COLOR } from './types';

export const colorToHex = (color: PixelColor): string => {
  if (color.startsWith('#')) {
    return color;
  }
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return color;
  ctx.fillStyle = color;
  return ctx.fillStyle as string;
};

export const createEmptyGrid = (width: number, height: number, fillColor: PixelColor = GRID_BG_COLOR): PixelColor[][] => {
  return Array(height).fill(null).map(() => Array(width).fill(fillColor));
};

export const cloneGrid = (grid: PixelColor[][]): PixelColor[][] => {
  return grid.map(row => [...row]);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.floor(value / gridSize) * gridSize;
};

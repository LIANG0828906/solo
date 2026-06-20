import type { ColorBlindMode } from '@/types';
import { hexToRgb, rgbToHex } from './colorUtils';

function applyColorMatrix(
  r: number, g: number, b: number,
  matrix: number[][]
): { r: number; g: number; b: number } {
  return {
    r: matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b,
    g: matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b,
    b: matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b
  };
}

const COLOR_MATRICES: Record<ColorBlindMode, number[][]> = {
  normal: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ],
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758]
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7]
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525]
  ],
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114]
  ]
};

export function simulateColorBlindness(hex: string, mode: ColorBlindMode): string {
  if (mode === 'normal') return hex;
  
  const { r, g, b } = hexToRgb(hex);
  const matrix = COLOR_MATRICES[mode];
  const result = applyColorMatrix(r, g, b, matrix);
  
  return rgbToHex(result.r, result.g, result.b);
}

export function simulatePaletteColorBlindness(
  colors: string[],
  mode: ColorBlindMode
): string[] {
  if (mode === 'normal') return colors;
  return colors.map(color => simulateColorBlindness(color, mode));
}

export function getColorBlindFilterStyle(mode: ColorBlindMode): string {
  switch (mode) {
    case 'protanopia':
      return 'url("#protanopia-filter")';
    case 'deuteranopia':
      return 'url("#deuteranopia-filter")';
    case 'tritanopia':
      return 'url("#tritanopia-filter")';
    case 'achromatopsia':
      return 'grayscale(100%)';
    default:
      return 'none';
  }
}

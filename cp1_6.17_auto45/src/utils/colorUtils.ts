import type { ContrastResult, SimulationType } from '@/types';

export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      case bn:
        h = ((rn - gn) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = h / 360;
  const sn = s / 100;
  const ln = l / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  ];
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const srgb = [r, g, b].map((c) => {
    const cn = c / 255;
    return cn <= 0.03928 ? cn / 12.92 : Math.pow((cn + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(hex1: string, hex2: string): ContrastResult {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: Math.round(ratio * 10) / 10,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}

const PROTAN_MATRIX = [
  [0.56667, 0.43333, 0],
  [0.55833, 0.44167, 0],
  [0, 0.24167, 0.75833],
];

const DEUTER_MATRIX = [
  [0.625, 0.375, 0],
  [0.7, 0.3, 0],
  [0, 0.3, 0.7],
];

const TRITAN_MATRIX = [
  [0.95, 0.05, 0],
  [0, 0.43333, 0.56667],
  [0, 0.475, 0.525],
];

function applyMatrix(
  rgb: [number, number, number],
  matrix: number[][]
): [number, number, number] {
  return [
    Math.min(255, Math.max(0, Math.round(
      rgb[0] * matrix[0][0] + rgb[1] * matrix[0][1] + rgb[2] * matrix[0][2]
    ))),
    Math.min(255, Math.max(0, Math.round(
      rgb[0] * matrix[1][0] + rgb[1] * matrix[1][1] + rgb[2] * matrix[1][2]
    ))),
    Math.min(255, Math.max(0, Math.round(
      rgb[0] * matrix[2][0] + rgb[1] * matrix[2][1] + rgb[2] * matrix[2][2]
    ))),
  ];
}

const simulationCache = new Map<string, string>();

function getCacheKey(hex: string, type: SimulationType): string {
  return `${hex}-${type}`;
}

export function simulateColorBlindness(hex: string, type: SimulationType): string {
  if (type === 'normal') return hex;

  const cacheKey = getCacheKey(hex, type);
  if (simulationCache.has(cacheKey)) {
    return simulationCache.get(cacheKey)!;
  }

  const rgb = hexToRgb(hex);
  let matrix: number[][];

  switch (type) {
    case 'protanopia':
      matrix = PROTAN_MATRIX;
      break;
    case 'deuteranopia':
      matrix = DEUTER_MATRIX;
      break;
    case 'tritanopia':
      matrix = TRITAN_MATRIX;
      break;
    default:
      return hex;
  }

  const simulated = applyMatrix(rgb, matrix);
  const result = rgbToHex(simulated[0], simulated[1], simulated[2]);

  if (simulationCache.size < 5000) {
    simulationCache.set(cacheKey, result);
  }

  return result;
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function getContrastLevel(result: ContrastResult): {
  label: string;
  color: string;
} {
  if (result.aaNormal) return { label: 'AA', color: '#4CAF50' };
  if (result.aaLarge) return { label: 'A', color: '#FFC107' };
  return { label: '未通过', color: '#F44336' };
}

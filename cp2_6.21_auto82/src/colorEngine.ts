export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export type BlendMode = 'multiply' | 'screen' | 'overlay' | 'softLight';
export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia';

const hexCache = new Map<string, RGB>();
const rgbCache = new Map<string, string>();
const hslCache = new Map<string, HSL>();

function rgbKey(rgb: RGB): string {
  return `${rgb.r},${rgb.g},${rgb.b}`;
}

function clamp(v: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, v));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '').trim();
  const cacheKey = clean;
  if (hexCache.has(cacheKey)) return hexCache.get(cacheKey)!;

  let full = clean;
  if (clean.length === 3) {
    full = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(full, 16);
  const result: RGB = {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
  hexCache.set(cacheKey, result);
  return result;
}

export function rgbToHex(rgb: RGB): string {
  const key = rgbKey(rgb);
  if (rgbCache.has(key)) return rgbCache.get(key)!;
  const toHex = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0');
  const result = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  rgbCache.set(key, result);
  return result;
}

export function rgbToHsl(rgb: RGB): HSL {
  const key = rgbKey(rgb);
  if (hslCache.has(key)) return hslCache.get(key)!;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const result: HSL = {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
  hslCache.set(key, result);
  return result;
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0;
  let g = 0;
  let b = 0;

  switch (i % 6) {
    case 0:
      r = v; g = t; b = p; break;
    case 1:
      r = q; g = v; b = p; break;
    case 2:
      r = p; g = v; b = t; break;
    case 3:
      r = p; g = q; b = v; break;
    case 4:
      r = t; g = p; b = v; break;
    case 5:
      r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

export function hexToHsv(hex: string): HSV {
  return rgbToHsv(hexToRgb(hex));
}

export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv));
}

function normalizeHue(hue: number): number {
  let h = hue % 360;
  if (h < 0) h += 360;
  return h;
}

export function getMonochromatic(base: string, count = 3): string[] {
  const hsl = hexToHsl(base);
  const result: string[] = [];
  const step = 20;
  const startL = Math.max(20, hsl.l - step * Math.floor(count / 2));
  for (let i = 0; i < count; i++) {
    result.push(
      hslToHex({
        h: hsl.h,
        s: hsl.s,
        l: clamp(startL + step * i, 10, 92),
      })
    );
  }
  return result;
}

export function getComplementary(base: string, count = 2): string[] {
  const hsl = hexToHsl(base);
  const result: string[] = [];
  const compH = normalizeHue(hsl.h + 180);
  result.push(hslToHex({ h: compH, s: hsl.s, l: hsl.l }));
  if (count >= 2) {
    result.push(
      hslToHex({
        h: normalizeHue(compH + 15),
        s: clamp01(hsl.s / 100 + 0.1) * 100,
        l: clamp(hsl.l - 10, 15, 85),
      })
    );
  }
  return result;
}

export function getTriadic(base: string): string[] {
  const hsl = hexToHsl(base);
  return [
    base,
    hslToHex({ h: normalizeHue(hsl.h + 120), s: hsl.s, l: hsl.l }),
    hslToHex({ h: normalizeHue(hsl.h + 240), s: hsl.s, l: hsl.l }),
  ];
}

export function getAnalogous(base: string, count = 3): string[] {
  const hsl = hexToHsl(base);
  const result: string[] = [];
  const step = 30;
  for (let i = 0; i < count; i++) {
    const offset = (i - Math.floor(count / 2)) * step;
    result.push(
      hslToHex({
        h: normalizeHue(hsl.h + offset),
        s: hsl.s,
        l: hsl.l,
      })
    );
  }
  return result;
}

export function hueDistance(h1: number, h2: number): number {
  const diff = Math.abs(normalizeHue(h1) - normalizeHue(h2));
  return Math.min(diff, 360 - diff);
}

function blendChannel(c1: number, c2: number, mode: BlendMode): number {
  const a = c1 / 255;
  const b = c2 / 255;
  let r = 0;
  switch (mode) {
    case 'multiply':
      r = a * b;
      break;
    case 'screen':
      r = 1 - (1 - a) * (1 - b);
      break;
    case 'overlay':
      r = a < 0.5 ? 2 * a * b : 1 - 2 * (1 - a) * (1 - b);
      break;
    case 'softLight': {
      if (b < 0.5) {
        r = a - (1 - 2 * b) * a * (1 - a);
      } else {
        r = a + (2 * b - 1) * (Math.sqrt(a) - a);
      }
      break;
    }
  }
  return clamp01(r) * 255;
}

export function blendColors(hex1: string, hex2: string, mode: BlendMode): string {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  return rgbToHex({
    r: blendChannel(rgb1.r, rgb2.r, mode),
    g: blendChannel(rgb1.g, rgb2.g, mode),
    b: blendChannel(rgb1.b, rgb2.b, mode),
  });
}

export function hslDistance(hex1: string, hex2: string): number {
  const h1 = hexToHsl(hex1);
  const h2 = hexToHsl(hex2);
  const dH = hueDistance(h1.h, h2.h) / 180;
  const dS = Math.abs(h1.s - h2.s) / 100;
  const dL = Math.abs(h1.l - h2.l) / 100;
  const dist = Math.sqrt(dH * dH + dS * dS + dL * dL);
  return Math.min(100, Math.round(dist * 100 / Math.sqrt(3)));
}

function sRGBtoLin(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb: RGB): number {
  return (
    0.2126 * sRGBtoLin(rgb.r) +
    0.7152 * sRGBtoLin(rgb.g) +
    0.0722 * sRGBtoLin(rgb.b)
  );
}

export function wcagContrast(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  const ratio = (a + 0.05) / (b + 0.05);
  return Math.round(ratio * 100) / 100;
}

export function wcagLevel(ratio: number, isLargeText = false): 'AAA' | 'AA' | 'Fail' {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'Fail';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Fail';
}

function applyMatrix(rgb: RGB, m: number[][]): RGB {
  const r = rgb.r;
  const g = rgb.g;
  const b = rgb.b;
  return {
    r: clamp(r * m[0][0] + g * m[0][1] + b * m[0][2]),
    g: clamp(r * m[1][0] + g * m[1][1] + b * m[1][2]),
    b: clamp(r * m[2][0] + g * m[2][1] + b * m[2][2]),
  };
}

const PROTANOPIA_MATRIX: number[][] = [
  [0.567, 0.433, 0],
  [0.558, 0.442, 0],
  [0, 0.242, 0.758],
];

const DEUTERANOPIA_MATRIX: number[][] = [
  [0.625, 0.375, 0],
  [0.7, 0.3, 0],
  [0, 0.3, 0.7],
];

const TRITANOPIA_MATRIX: number[][] = [
  [0.95, 0.05, 0],
  [0, 0.433, 0.567],
  [0, 0.475, 0.525],
];

export function simulateColorBlindness(
  hex: string,
  type: ColorBlindnessType
): string {
  const rgb = hexToRgb(hex);
  let result: RGB;
  switch (type) {
    case 'protanopia':
      result = applyMatrix(rgb, PROTANOPIA_MATRIX);
      break;
    case 'deuteranopia':
      result = applyMatrix(rgb, DEUTERANOPIA_MATRIX);
      break;
    case 'tritanopia':
      result = applyMatrix(rgb, TRITANOPIA_MATRIX);
      break;
  }
  return rgbToHex(result);
}

export function simulatePaletteColorBlindness(
  colors: string[],
  type: ColorBlindnessType
): string[] {
  return colors.map((c) => simulateColorBlindness(c, type));
}

export interface EmotionTagGroup {
  range: [number, number];
  tags: string[];
}

const EMOTION_MAP: EmotionTagGroup[] = [
  { range: [0, 10], tags: ['激情', '活力', '温暖'] },
  { range: [340, 360], tags: ['激情', '活力', '温暖'] },
  { range: [10, 40], tags: ['热情', '创意', '友善'] },
  { range: [40, 70], tags: ['快乐', '乐观', '希望'] },
  { range: [70, 100], tags: ['清新', '自然', '生机'] },
  { range: [100, 160], tags: ['平静', '和谐', '治愈'] },
  { range: [160, 190], tags: ['清爽', '灵动', '青春'] },
  { range: [190, 230], tags: ['专业', '稳重', '信任'] },
  { range: [230, 260], tags: ['平静', '专业', '冷漠'] },
  { range: [260, 290], tags: ['神秘', '奢华', '创意'] },
  { range: [290, 320], tags: ['浪漫', '优雅', '梦幻'] },
  { range: [320, 340], tags: ['甜美', '柔软', '可爱'] },
];

export function getEmotionTags(hue: number): string[] {
  const h = normalizeHue(hue);
  for (const group of EMOTION_MAP) {
    const [start, end] = group.range;
    if (start < end) {
      if (h >= start && h < end) return [...group.tags];
    } else {
      if (h >= start || h < end) return [...group.tags];
    }
  }
  return ['现代', '简约', '平衡'];
}

export function findDominantColor(hexColors: string[]): string | null {
  const valid = hexColors.filter((c) => c && c !== '');
  if (valid.length === 0) return null;

  let best = valid[0];
  let bestScore = -Infinity;

  for (const hex of valid) {
    const hsl = hexToHsl(hex);
    const sScore = hsl.s;
    const lScore = 100 - Math.abs(hsl.l - 50);
    const score = sScore * 0.6 + lScore * 0.4;
    if (score > bestScore) {
      bestScore = score;
      best = hex;
    }
  }
  return best;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function exportCSSVariables(hexColors: string[], prefix = 'color'): string {
  const names = ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'danger', 'neutral-1', 'neutral-2', 'neutral-3', 'neutral-4', 'neutral-5'];
  return hexColors
    .map((hex, i) => `  --${prefix}-${names[i] || `color-${i + 1}`}: ${hex};`)
    .join('\n');
}

export function exportJSON(hexColors: string[]): string {
  return JSON.stringify(hexColors, null, 2);
}

export function generateSVGSwatch(hexColors: string[], width = 1200, height = 200): string {
  if (hexColors.length === 0) return '';
  const cellWidth = width / hexColors.length;
  const fontSize = Math.max(10, Math.min(14, Math.floor(cellWidth / 8)));
  const cells = hexColors
    .map((hex, i) => {
      const x = i * cellWidth;
      const hsl = hexToHsl(hex);
      const textColor = hsl.l > 55 ? '#1a1a2e' : '#ffffff';
      return `
  <rect x="${x}" y="0" width="${cellWidth}" height="${height}" fill="${hex}" />
  <text x="${x + cellWidth / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle"
        font-family="monospace" font-size="${fontSize}" fill="${textColor}" font-weight="bold">
    ${hex}
  </text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${cells}
</svg>`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  return new Promise((resolve) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

export interface ColorPairDistance {
  index1: number;
  index2: number;
  distance: number;
  warning: boolean;
}

export function calculatePaletteDistances(hexColors: string[]): ColorPairDistance[] {
  const result: ColorPairDistance[] = [];
  for (let i = 0; i < hexColors.length; i++) {
    for (let j = i + 1; j < hexColors.length; j++) {
      if (!hexColors[i] || !hexColors[j]) continue;
      const dist = hslDistance(hexColors[i], hexColors[j]);
      result.push({
        index1: i,
        index2: j,
        distance: dist,
        warning: dist < 30,
      });
    }
  }
  return result;
}

import { ColorScheme } from '../types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
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

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  return rgbToHex(r, g, b);
}

export function mapColorToScheme(baseColor: string, scheme: ColorScheme): string {
  const baseHsl = rgbToHsl(hexToRgb(baseColor).r, hexToRgb(baseColor).g, hexToRgb(baseColor).b);
  const hueFactor = baseHsl.h / 360;
  return interpolateColor(scheme.startColor, scheme.endColor, hueFactor);
}

export function getSaturation(color: string): number {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hsl.s;
}

export function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return hsl.l;
}

export function calculateAvgSaturation(colors: string[]): number {
  if (colors.length === 0) return 0;
  const total = colors.reduce((sum, color) => sum + getSaturation(color), 0);
  return Math.round(total / colors.length);
}

export function calculateContrastScore(colors: string[]): number {
  if (colors.length < 2) return 0;
  let totalDiff = 0;
  let count = 0;

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const hsl1 = rgbToHsl(
        hexToRgb(colors[i]).r,
        hexToRgb(colors[i]).g,
        hexToRgb(colors[i]).b
      );
      const hsl2 = rgbToHsl(
        hexToRgb(colors[j]).r,
        hexToRgb(colors[j]).g,
        hexToRgb(colors[j]).b
      );
      const hueDiff = Math.abs(hsl1.h - hsl2.h);
      const normalizedDiff = Math.min(hueDiff, 360 - hueDiff) / 180;
      totalDiff += normalizedDiff;
      count++;
    }
  }

  return count > 0 ? Math.round((totalDiff / count) * 100) : 0;
}

export function snapToGrid(
  x: number,
  y: number,
  gridSize: number,
  snapDistance: number
): { x: number; y: number } {
  const snapX = Math.round(x / gridSize) * gridSize;
  const snapY = Math.round(y / gridSize) * gridSize;
  return {
    x: Math.abs(x - snapX) <= snapDistance ? snapX : x,
    y: Math.abs(y - snapY) <= snapDistance ? snapY : y,
  };
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

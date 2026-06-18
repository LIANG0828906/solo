export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorScheme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  cardBg: string;
  inputBg: string;
  border: string;
}

export type Mode = 'light' | 'dark' | 'glass';

export function hexToHsl(hex: string): HSL {
  let r = 0;
  let g = 0;
  let b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255;
    g = parseInt(hex[2] + hex[2], 16) / 255;
    b = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16) / 255;
    g = parseInt(hex[3] + hex[4], 16) / 255;
    b = parseInt(hex[5] + hex[6], 16) / 255;
  }

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(hsl: HSL): string {
  const { h, s, l } = hsl;
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function generatePalette(baseHex: string, count: number = 5): string[] {
  const normalizedHex = baseHex.length === 4
    ? '#' + baseHex[1] + baseHex[1] + baseHex[2] + baseHex[2] + baseHex[3] + baseHex[3]
    : baseHex;
  const baseHsl = hexToHsl(normalizedHex);

  const midIndex = Math.floor(count / 2);
  const step = 15;
  const baseLightness = baseHsl.l;
  const minSaturation = 90;

  const palette: string[] = [];

  for (let i = 0; i < count; i++) {
    const offset = i - midIndex;
    let lightness = baseLightness + offset * step;
    lightness = Math.max(5, Math.min(95, lightness));

    let colorHsl: HSL = {
      h: baseHsl.h,
      s: Math.max(baseHsl.s, minSaturation),
      l: Math.round(lightness),
    };

    const hexColor = hslToHex(colorHsl);
    const verifyHsl = hexToHsl(hexColor);
    if (verifyHsl.s < minSaturation) {
      colorHsl = {
        h: colorHsl.h,
        s: minSaturation,
        l: colorHsl.l,
      };
    }

    palette.push(hslToHex(colorHsl));
  }

  return palette;
}

export function generateScheme(
  palette: string[],
  mode: Mode
): ColorScheme {
  const primary = palette[2];
  const darker = palette[3];
  const lighter = palette[1];

  switch (mode) {
    case 'light':
      return {
        background: '#FFFFFF',
        text: '#1A1A1A',
        primary,
        secondary: darker,
        accent: lighter,
        cardBg: '#FFFFFF',
        inputBg: '#F5F5F5',
        border: '#E0E0E0',
      };
    case 'dark':
      return {
        background: '#1E1E2E',
        text: '#E0E0E0',
        primary,
        secondary: lighter,
        accent: darker,
        cardBg: '#2A2A3E',
        inputBg: '#333347',
        border: '#3D3D52',
      };
    case 'glass':
      return {
        background: 'transparent',
        text: '#FFFFFF',
        primary,
        secondary: lighter,
        accent: darker,
        cardBg: 'rgba(255, 255, 255, 0.15)',
        inputBg: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.2)',
      };
    default:
      return {
        background: '#FFFFFF',
        text: '#1A1A1A',
        primary,
        secondary: darker,
        accent: lighter,
        cardBg: '#FFFFFF',
        inputBg: '#F5F5F5',
        border: '#E0E0E0',
      };
  }
}

export function isValidHex(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function darkenColor(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToHex(hsl);
}

export function lightenColor(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  hsl.l = Math.min(100, hsl.l + amount);
  return hslToHex(hsl);
}

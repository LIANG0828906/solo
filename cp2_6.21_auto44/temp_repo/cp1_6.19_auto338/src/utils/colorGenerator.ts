import { v4 as uuidv4 } from 'uuid';
import { ColorScheme } from '@/types';

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { h: 0, s: 0, l: 0 };
  }
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

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

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function adjustBrightness(hex: string, percent: number): string {
  const { h, s, l } = hexToHsl(hex);
  const newL = Math.max(0, Math.min(100, l + percent));
  return hslToHex(h, s, newL);
}

export function generateColorScheme(primaryColor: string): ColorScheme {
  const { h, s, l } = hexToHsl(primaryColor);
  
  const complementary: string[] = [];
  for (let i = 0; i < 4; i++) {
    const hueOffset = 180 + (i - 1.5) * 15;
    const newH = (h + hueOffset + 360) % 360;
    const newS = Math.max(20, Math.min(90, s + (i - 2) * 10));
    const newL = Math.max(25, Math.min(75, l + (i - 2) * 12));
    complementary.push(hslToHex(newH, newS, newL));
  }
  
  const auxiliary: string[] = [];
  for (let i = 0; i < 3; i++) {
    const hueOffset = (i - 1) * 30;
    const newH = (h + hueOffset + 360) % 360;
    const newS = Math.max(30, Math.min(85, s - i * 10));
    const newL = Math.max(35, Math.min(70, l + (i - 1) * 15));
    auxiliary.push(hslToHex(newH, newS, newL));
  }
  
  return {
    id: uuidv4(),
    primary: primaryColor,
    complementary,
    auxiliary,
    createdAt: Date.now(),
  };
}

export function getRandomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 30);
  const l = 45 + Math.floor(Math.random() * 20);
  return hslToHex(h, s, l);
}

import type { ColorCard, TagFrequency } from '../types';

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

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

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function generateAnalogousColor(hex: string, index: number, total: number): string {
  const hsl = hexToHsl(hex);
  const hueShift = (index / total) * 60 - 30;
  const saturationShift = (index % 2 === 0 ? 1 : -1) * (index * 5);
  const newH = (hsl.h + hueShift + 360) % 360;
  const newS = Math.min(100, Math.max(20, hsl.s + saturationShift));
  const newL = Math.min(80, Math.max(30, hsl.l + (index % 3) * 8 - 8));
  return hslToHex(newH, newS, newL);
}

export function analyzeTagFrequency(cards: ColorCard[], baseColor: string = '#E67E22'): TagFrequency[] {
  const tagMap = new Map<string, number>();

  for (const card of cards) {
    for (const tag of card.tags) {
      const trimmed = tag.trim();
      if (trimmed) {
        tagMap.set(trimmed, (tagMap.get(trimmed) || 0) + 1);
      }
    }
  }

  const result: TagFrequency[] = [];
  const entries = Array.from(tagMap.entries()).sort((a, b) => b[1] - a[1]);

  for (let i = 0; i < entries.length; i++) {
    const [tag, count] = entries[i];
    result.push({
      tag,
      count,
      color: generateAnalogousColor(baseColor, i, entries.length),
    });
  }

  return result;
}

export function getAllTags(cards: ColorCard[]): string[] {
  const tagSet = new Set<string>();
  for (const card of cards) {
    for (const tag of card.tags) {
      const trimmed = tag.trim();
      if (trimmed) {
        tagSet.add(trimmed);
      }
    }
  }
  return Array.from(tagSet).sort();
}

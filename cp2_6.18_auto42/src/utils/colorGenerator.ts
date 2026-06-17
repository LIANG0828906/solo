import type { CardColors } from '@/constants/templates';

function hexToHsl(hex: string): [number, number, number] {
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

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (v: number) => {
    const hex = Math.round((v + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureContrast(fg: string, bg: string, targetRatio: number = 4.5): string {
  const [fh, fs, fl] = hexToHsl(fg);
  const bgLum = getLuminance(bg);
  const isBgLight = bgLum > 0.5;

  let curS = fs;
  let curL = fl;
  let curRatio = getContrastRatio(fg, bg);

  if (curRatio >= targetRatio) {
    return fg;
  }

  const maxIterations = 60;
  const initialSearchRadius = 15;
  const minSearchRadius = 0.5;
  let searchRadius = initialSearchRadius;

  for (let iter = 0; iter < maxIterations; iter++) {
    const progress = iter / maxIterations;
    searchRadius = Math.max(
      minSearchRadius,
      initialSearchRadius * (1 - progress * 0.95)
    );
    const satStep = searchRadius * 0.4;

    const candidates: Array<{ s: number; l: number; ratio: number }> = [];
    const lightDir = isBgLight ? -1 : 1;

    for (let sIdx = -2; sIdx <= 2; sIdx++) {
      for (let lIdx = 1; lIdx <= 4; lIdx++) {
        const s = Math.max(0, Math.min(100, curS + sIdx * satStep));
        const l = Math.max(0, Math.min(100, curL + lightDir * lIdx * searchRadius * 0.5));
        const candidate = hslToHex(fh, s, l);
        const ratio = getContrastRatio(candidate, bg);
        candidates.push({ s, l, ratio });

        if (ratio >= targetRatio) {
          return candidate;
        }
      }
    }

    candidates.sort((a, b) => b.ratio - a.ratio);
    const best = candidates[0];

    if (best.ratio > curRatio) {
      curS = best.s;
      curL = best.l;
      curRatio = best.ratio;
    } else {
      const jump = Math.max(5, searchRadius * 2);
      const fallbackL = Math.max(0, Math.min(100, curL + lightDir * jump));
      const fallback = hslToHex(fh, curS, fallbackL);
      const fallbackRatio = getContrastRatio(fallback, bg);

      if (fallbackRatio > curRatio) {
        curL = fallbackL;
        curRatio = fallbackRatio;
        if (fallbackRatio >= targetRatio) {
          return fallback;
        }
      }
    }
  }

  if (curRatio < targetRatio) {
    return isBgLight ? '#000000' : '#FFFFFF';
  }

  return hslToHex(fh, curS, curL);
}

export function generateColorSchemes(baseColors: CardColors): CardColors[] {
  const [baseH, baseS, baseL] = hexToHsl(baseColors.accent);

  const schemes: CardColors[] = [];
  const hueOffsets = [30, 120, 210];

  for (const offset of hueOffsets) {
    const accentH = (baseH + offset) % 360;
    const accentS = Math.min(100, baseS + Math.random() * 20 - 10);
    const accentL = Math.min(80, Math.max(30, baseL + Math.random() * 20 - 10));

    const accent = hslToHex(accentH, accentS, accentL);

    const bgH = (accentH + 180) % 360;
    const bgS = Math.max(5, accentS - 40);
    const bgL = 88 + Math.random() * 6;
    const background = hslToHex(bgH, bgS, bgL);

    const titleH = accentH;
    const titleS = Math.min(100, accentS + 10);
    const titleL = 22 + Math.random() * 10;
    const titleRaw = hslToHex(titleH, titleS, titleL);
    // 标题色对比度目标 4.5 (WCAG AA 级标准)
    const title = ensureContrast(titleRaw, background, 4.5);

    const bodyH = accentH;
    const bodyS = Math.max(10, accentS - 15);
    const bodyL = 35 + Math.random() * 10;
    const bodyRaw = hslToHex(bodyH, bodyS, bodyL);
    // 正文色对比度目标 4.5 (WCAG AA 级标准)
    const body = ensureContrast(bodyRaw, background, 4.5);

    schemes.push({
      background,
      title,
      body,
      accent,
    });
  }

  return schemes;
}

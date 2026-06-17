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

  let bestS = fs;
  let bestL = fl;
  let bestRatio = getContrastRatio(fg, bg);

  if (bestRatio >= targetRatio) {
    return fg;
  }

  const maxIterations = 50;
  let stepLightness = 5;
  let stepSaturation = 2;
  let improved = true;

  for (let iter = 0; iter < maxIterations && improved; iter++) {
    improved = false;
    const progress = iter / maxIterations;
    stepLightness = 5 - 4.5 * progress;
    stepSaturation = 2 - 1.5 * progress;

    for (let s = -1; s <= 1; s += 1) {
      for (let l = 1; l <= 3; l += 1) {
        const satOffset = s * stepSaturation;
        const lightOffset = isBgLight ? -l * stepLightness : l * stepLightness;

        const newS = Math.max(0, Math.min(100, bestS + satOffset));
        const newL = Math.max(0, Math.min(100, bestL + lightOffset));

        const candidate = hslToHex(fh, newS, newL);
        const ratio = getContrastRatio(candidate, bg);

        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestS = newS;
          bestL = newL;
          improved = true;

          if (ratio >= targetRatio) {
            return candidate;
          }
        }
      }
    }
  }

  if (bestRatio < targetRatio) {
    return isBgLight ? '#000000' : '#FFFFFF';
  }

  return hslToHex(fh, bestS, bestL);
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

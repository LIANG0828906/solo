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

function ensureContrast(fg: string, bg: string, minRatio: number = 4.5): string {
  const [fh, fs, fl] = hexToHsl(fg);
  const bgLum = getLuminance(bg);
  let lightness = fl;

  for (let i = 0; i < 20; i++) {
    const candidate = hslToHex(fh, fs, lightness);
    const fgLum = getLuminance(candidate);
    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    if (ratio >= minRatio) {
      return candidate;
    }

    if (bgLum > 0.5) {
      lightness -= 3;
    } else {
      lightness += 3;
    }

    lightness = Math.max(5, Math.min(95, lightness));
  }

  return hslToHex(fh, fs, lightness);
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
    const title = ensureContrast(titleRaw, background, 7);

    const bodyH = accentH;
    const bodyS = Math.max(10, accentS - 15);
    const bodyL = 35 + Math.random() * 10;
    const bodyRaw = hslToHex(bodyH, bodyS, bodyL);
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

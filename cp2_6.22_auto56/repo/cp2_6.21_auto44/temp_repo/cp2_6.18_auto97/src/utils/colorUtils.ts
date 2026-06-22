export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface PaletteColor {
  hex: string;
  hsl: HSL;
  locked: boolean;
}

export interface ThemeScheme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  cardBg: string;
  inputBg: string;
}

export type ThemeMode = 'light' | 'dark' | 'glass';

const colorCache = new Map<string, string>();

export function hexToHsl(hex: string): HSL {
  const cacheKey = `hexToHsl_${hex}`;
  if (colorCache.has(cacheKey)) {
    return JSON.parse(colorCache.get(cacheKey)!);
  }

  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16) / 255;
    g = parseInt(hex[2] + hex[2], 16) / 255;
    b = parseInt(hex[3] + hex[3], 16) / 255;
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16) / 255;
    g = parseInt(hex[3] + hex[4], 16) / 255;
    b = parseInt(hex[5] + hex[6], 16) / 255;
  }

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
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

  const result: HSL = {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };

  colorCache.set(cacheKey, JSON.stringify(result));
  return result;
}

export function hslToHex(hsl: HSL): string {
  const cacheKey = `hslToHex_${hsl.h}_${hsl.s}_${hsl.l}`;
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)!;
  }

  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const result = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  colorCache.set(cacheKey, result);
  return result;
}

export function generatePalette(baseHex: string, existingPalette: PaletteColor[] = []): PaletteColor[] {
  const baseHsl = hexToHsl(baseHex);
  const lightnessSteps = [90, 70, 50, 30, 10];

  return lightnessSteps.map((l, index) => {
    if (existingPalette[index]?.locked) {
      return existingPalette[index];
    }

    const saturation = Math.max(baseHsl.s, 90);
    const hsl: HSL = { h: baseHsl.h, s: saturation, l };
    return {
      hex: hslToHex(hsl),
      hsl,
      locked: false
    };
  });
}

export function generateSchemes(palette: PaletteColor[]): Record<ThemeMode, ThemeScheme> {
  const primary = palette[2].hex;
  const secondary = palette[1].hex;
  const accent = palette[3].hex;

  return {
    light: {
      background: '#FFFFFF',
      text: '#1A1A1A',
      primary,
      secondary,
      accent,
      border: '#E5E7EB',
      cardBg: '#FFFFFF',
      inputBg: '#F9FAFB'
    },
    dark: {
      background: '#1E1E2E',
      text: '#E0E0E0',
      primary,
      secondary,
      accent,
      border: '#374151',
      cardBg: '#2D2D3F',
      inputBg: '#37374A'
    },
    glass: {
      background: '#1A1A2E',
      text: '#FFFFFF',
      primary,
      secondary,
      accent,
      border: 'rgba(255,255,255,0.1)',
      cardBg: 'rgba(255,255,255,0.1)',
      inputBg: 'rgba(255,255,255,0.05)'
    }
  };
}

export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generateExportJson(
  palette: PaletteColor[],
  schemes: Record<ThemeMode, ThemeScheme>
): string {
  const exportData = {
    palette: palette.map(p => ({
      hex: p.hex,
      hsl: `hsl(${p.hsl.h}, ${p.hsl.s}%, ${p.hsl.l}%)`,
      locked: p.locked
    })),
    schemes: {
      light: schemes.light,
      dark: schemes.dark,
      glass: schemes.glass
    },
    exportedAt: new Date().toISOString()
  };
  return JSON.stringify(exportData, null, 2);
}

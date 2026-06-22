import chroma from 'chroma-js';

export interface TonalPalette {
  [tone: number]: string;
}

export interface TonalPalettes {
  primary: TonalPalette;
  secondary: TonalPalette;
  tertiary: TonalPalette;
  error: TonalPalette;
  neutral: TonalPalette;
  neutralVariant: TonalPalette;
}

export interface ColorGroup {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  neutral: string;
  onNeutral: string;
  neutralContainer: string;
  onNeutralContainer: string;
  neutralVariant: string;
  onNeutralVariant: string;
  neutralVariantContainer: string;
  onNeutralVariantContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  shadow: string;
}

const TONES = [0, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100];

function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return '#' + h.toUpperCase();
}

function generateSingleTonalPalette(sourceHex: string): TonalPalette {
  const palette: TonalPalette = {};
  const [h, s] = chroma(sourceHex).hsl();
  const hue = isNaN(h) ? 0 : h;
  const sat = isNaN(s) ? 0.4 : s;

  for (const tone of TONES) {
    const lightness = 100 - tone;
    const chromaSat = tone === 0 ? 0 : tone === 100 ? 0 : sat * (tone < 50 ? 0.85 : 0.7);
    try {
      palette[tone] = chroma.hsl(hue, chromaSat, lightness / 100).hex().toUpperCase();
    } catch {
      palette[tone] = lightness >= 50 ? '#FFFFFF' : '#000000';
    }
  }
  return palette;
}

export function generateTonalPalette(hex: string): TonalPalettes {
  const normalizedHex = normalizeHex(hex);
  const primaryColor = chroma(normalizedHex);
  const [h, s] = primaryColor.hsl();
  const hue = isNaN(h) ? 260 : h;
  const sat = isNaN(s) || s < 0.05 ? 0.48 : s;

  const secondaryHue = (hue + 28) % 360;
  const secondarySat = Math.max(0.08, sat * 0.45);
  const secondaryHex = chroma.hsl(secondaryHue, secondarySat, 0.5).hex();

  const tertiaryHue = (hue + 60) % 360;
  const tertiarySat = Math.max(0.12, sat * 0.6);
  const tertiaryHex = chroma.hsl(tertiaryHue, tertiarySat, 0.5).hex();

  const errorHex = chroma.hsl(0, 0.8, 0.4).hex();

  const neutralHue = hue;
  const neutralSat = Math.max(0, Math.min(0.04, sat * 0.06));
  const neutralHex = chroma.hsl(neutralHue, neutralSat, 0.5).hex();

  const neutralVarHue = hue;
  const neutralVarSat = Math.max(0.04, Math.min(0.12, sat * 0.18));
  const neutralVarHex = chroma.hsl(neutralVarHue, neutralVarSat, 0.5).hex();

  return {
    primary: generateSingleTonalPalette(normalizedHex),
    secondary: generateSingleTonalPalette(secondaryHex),
    tertiary: generateSingleTonalPalette(tertiaryHex),
    error: generateSingleTonalPalette(errorHex),
    neutral: generateSingleTonalPalette(neutralHex),
    neutralVariant: generateSingleTonalPalette(neutralVarHex),
  };
}

export function buildColorGroup(palettes: TonalPalettes): ColorGroup {
  const p = palettes.primary;
  const s = palettes.secondary;
  const t = palettes.tertiary;
  const e = palettes.error;
  const n = palettes.neutral;
  const nv = palettes.neutralVariant;

  return {
    primary: p[40],
    onPrimary: p[100],
    primaryContainer: p[90],
    onPrimaryContainer: p[10],
    secondary: s[40],
    onSecondary: s[100],
    secondaryContainer: s[90],
    onSecondaryContainer: s[10],
    tertiary: t[40],
    onTertiary: t[100],
    tertiaryContainer: t[90],
    onTertiaryContainer: t[10],
    error: e[40],
    onError: e[100],
    errorContainer: e[90],
    onErrorContainer: e[10],
    neutral: n[50],
    onNeutral: n[0],
    neutralContainer: n[90],
    onNeutralContainer: n[10],
    neutralVariant: nv[50],
    onNeutralVariant: nv[0],
    neutralVariantContainer: nv[90],
    onNeutralVariantContainer: nv[10],
    background: n[99],
    onBackground: n[10],
    surface: n[98],
    onSurface: n[10],
    surfaceVariant: nv[90],
    onSurfaceVariant: nv[30],
    outline: nv[50],
    shadow: '#000000',
  };
}

export function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex.trim()) || /^#?[0-9A-Fa-f]{3}$/.test(hex.trim());
}

import type { ColorGroup, ColorCard } from '../types';

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(colorA: string, colorB: string): number {
  const l1 = luminance(colorA);
  const l2 = luminance(colorB);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function formatContrast(ratio: number): string {
  return `对比度${ratio.toFixed(1)}:1`;
}

export function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex.trim()) || /^#?[0-9A-Fa-f]{3}$/.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  return '#' + h.toUpperCase();
}

export const PRESET_COLORS = [
  { hex: '#6750A4', name: '品牌紫' },
  { hex: '#006D40', name: '生态绿' },
  { hex: '#BA1A1A', name: '活力红' },
  { hex: '#0267C1', name: '科技蓝' },
  { hex: '#7C5800', name: '暖金' },
];

export interface ColorFamily {
  name: string;
  cards: ColorCard[];
}

export function buildColorFamilies(palette: ColorGroup): ColorFamily[] {
  return [
    {
      name: 'Primary',
      cards: [
        { key: 'primary', label: 'Primary', color: palette.primary, onColor: palette.onPrimary },
        { key: 'onPrimary', label: 'On Primary', color: palette.onPrimary, onColor: palette.primary },
        { key: 'primaryContainer', label: 'Primary Container', color: palette.primaryContainer, onColor: palette.onPrimaryContainer },
        { key: 'onPrimaryContainer', label: 'On Primary Container', color: palette.onPrimaryContainer, onColor: palette.primaryContainer },
      ],
    },
    {
      name: 'Secondary',
      cards: [
        { key: 'secondary', label: 'Secondary', color: palette.secondary, onColor: palette.onSecondary },
        { key: 'onSecondary', label: 'On Secondary', color: palette.onSecondary, onColor: palette.secondary },
        { key: 'secondaryContainer', label: 'Secondary Container', color: palette.secondaryContainer, onColor: palette.onSecondaryContainer },
        { key: 'onSecondaryContainer', label: 'On Secondary Container', color: palette.onSecondaryContainer, onColor: palette.secondaryContainer },
      ],
    },
    {
      name: 'Tertiary',
      cards: [
        { key: 'tertiary', label: 'Tertiary', color: palette.tertiary, onColor: palette.onTertiary },
        { key: 'onTertiary', label: 'On Tertiary', color: palette.onTertiary, onColor: palette.tertiary },
        { key: 'tertiaryContainer', label: 'Tertiary Container', color: palette.tertiaryContainer, onColor: palette.onTertiaryContainer },
        { key: 'onTertiaryContainer', label: 'On Tertiary Container', color: palette.onTertiaryContainer, onColor: palette.tertiaryContainer },
      ],
    },
    {
      name: 'Error',
      cards: [
        { key: 'error', label: 'Error', color: palette.error, onColor: palette.onError },
        { key: 'onError', label: 'On Error', color: palette.onError, onColor: palette.error },
        { key: 'errorContainer', label: 'Error Container', color: palette.errorContainer, onColor: palette.onErrorContainer },
        { key: 'onErrorContainer', label: 'On Error Container', color: palette.onErrorContainer, onColor: palette.errorContainer },
      ],
    },
    {
      name: 'Neutral',
      cards: [
        { key: 'neutral', label: 'Neutral', color: palette.neutral, onColor: palette.onNeutral },
        { key: 'onNeutral', label: 'On Neutral', color: palette.onNeutral, onColor: palette.neutral },
        { key: 'neutralContainer', label: 'Neutral Container', color: palette.neutralContainer, onColor: palette.onNeutralContainer },
        { key: 'onNeutralContainer', label: 'On Neutral Container', color: palette.onNeutralContainer, onColor: palette.neutralContainer },
      ],
    },
    {
      name: 'Neutral Variant',
      cards: [
        { key: 'neutralVariant', label: 'Neutral Variant', color: palette.neutralVariant, onColor: palette.onNeutralVariant },
        { key: 'onNeutralVariant', label: 'On Neutral Variant', color: palette.onNeutralVariant, onColor: palette.neutralVariant },
        { key: 'neutralVariantContainer', label: 'Neutral Variant Container', color: palette.neutralVariantContainer, onColor: palette.onNeutralVariantContainer },
        { key: 'onNeutralVariantContainer', label: 'On Neutral Variant Container', color: palette.onNeutralVariantContainer, onColor: palette.neutralVariantContainer },
      ],
    },
  ];
}

export function generateCssTokens(palette: ColorGroup): string {
  const entries = Object.entries(palette) as [keyof ColorGroup, string][];
  const lines = entries.map(([key, value]) => {
    const cssVar = `--md-sys-color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    return `  ${cssVar}: ${value};`;
  });
  return `:root {\n${lines.join('\n')}\n}`;
}

export function generateJsonTokens(palette: ColorGroup): string {
  return JSON.stringify(palette, null, 2);
}

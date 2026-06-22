import type { LayoutScheme, DecorElement } from './types';
import { AVAILABLE_FONTS, COLOR_THEMES } from './types';

interface TemplatePool {
  name: string;
  layoutType: LayoutScheme['layoutType'];
  positionBase: { x: number; y: number };
  textAlign: LayoutScheme['textAlign'];
  fontSizeBase: number;
  rotationBase: number;
  decorFactory: (accent: string) => DecorElement[];
}

const TEMPLATES: TemplatePool[] = [
  {
    name: '诗意留白',
    layoutType: 'center',
    positionBase: { x: 540, y: 480 },
    textAlign: 'center',
    fontSizeBase: 64,
    rotationBase: 0,
    decorFactory: (accent) => [
      {
        type: 'line',
        position: { x: 540, y: 600 },
        size: { width: 120, height: 2 },
        color: accent,
      },
    ],
  },
  {
    name: '几何冲击',
    layoutType: 'left',
    positionBase: { x: 320, y: 520 },
    textAlign: 'left',
    fontSizeBase: 72,
    rotationBase: -5,
    decorFactory: (accent) => [
      {
        type: 'rect',
        position: { x: 800, y: 200 },
        size: { width: 220, height: 220 },
        color: accent,
        rotation: 15,
      },
      {
        type: 'circle',
        position: { x: 150, y: 850 },
        size: { width: 100, height: 100 },
        color: accent,
      },
    ],
  },
  {
    name: '渐变聚焦',
    layoutType: 'center',
    positionBase: { x: 540, y: 540 },
    textAlign: 'center',
    fontSizeBase: 80,
    rotationBase: 0,
    decorFactory: () => [],
  },
  {
    name: '左对齐留白',
    layoutType: 'left',
    positionBase: { x: 200, y: 500 },
    textAlign: 'left',
    fontSizeBase: 56,
    rotationBase: 0,
    decorFactory: (accent) => [
      {
        type: 'line',
        position: { x: 200, y: 680 },
        size: { width: 80, height: 4 },
        color: accent,
      },
    ],
  },
  {
    name: '斜向文字',
    layoutType: 'diagonal',
    positionBase: { x: 540, y: 540 },
    textAlign: 'center',
    fontSizeBase: 68,
    rotationBase: -12,
    decorFactory: (accent) => [
      {
        type: 'line',
        position: { x: 540, y: 300 },
        size: { width: 600, height: 1 },
        color: accent,
        rotation: -12,
      },
      {
        type: 'line',
        position: { x: 540, y: 780 },
        size: { width: 600, height: 1 },
        color: accent,
        rotation: -12,
      },
    ],
  },
];

const POETIC_KEYWORDS = ['月', '风', '花', '雪', '诗', '梦', '心', '爱', '云', '雨', '山', '水', '夜', '春', '秋'];

function analyzeText(text: string): { length: 'short' | 'medium' | 'long'; isPoetic: boolean } {
  const len = text.length;
  const length = len < 30 ? 'short' : len < 100 ? 'medium' : 'long';
  const isPoetic = POETIC_KEYWORDS.some((k) => text.includes(k));
  return { length, isPoetic };
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFont(preferPoetic: boolean, index: number): string {
  const poeticFonts = [0, 2];
  const idx = preferPoetic ? poeticFonts[index % 2] : index % AVAILABLE_FONTS.length;
  return AVAILABLE_FONTS[idx].family;
}

function pickTheme(index: number) {
  return COLOR_THEMES[index % COLOR_THEMES.length];
}

function adjustFontSize(base: number, textLength: 'short' | 'medium' | 'long'): number {
  if (textLength === 'short') return Math.min(96, base + 12);
  if (textLength === 'long') return Math.max(36, base - 20);
  return base;
}

export function generateLayoutSchemes(text: string, seed?: number): LayoutScheme[] {
  if (seed !== undefined) {
    let s = seed;
    Math.random = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const { length: textLen, isPoetic } = analyzeText(text);
  const schemes: LayoutScheme[] = [];

  for (let i = 0; i < 5; i++) {
    const template = TEMPLATES[i % TEMPLATES.length];
    const theme = pickTheme(i);
    const preferPoetic = isPoetic && (i === 0 || i === 3);
    const fontFamily = pickFont(preferPoetic, i);
    const fontSize = adjustFontSize(template.fontSizeBase, textLen);
    const jitterX = randomInRange(-30, 30);
    const jitterY = randomInRange(-30, 30);
    const rotation = template.rotationBase + randomInRange(-3, 3);

    const bgColor =
      i === 2
        ? `linear-gradient(135deg, ${theme.primary}22, ${theme.secondary}44)`
        : theme.suggestedBg;

    schemes.push({
      id: `scheme-${i}-${Date.now()}`,
      name: template.name,
      layoutType: template.layoutType,
      textPosition: {
        x: Math.max(100, Math.min(980, template.positionBase.x + jitterX)),
        y: Math.max(100, Math.min(980, template.positionBase.y + jitterY)),
      },
      textAlign: template.textAlign,
      fontFamily,
      fontSize,
      textColor: theme.suggestedText,
      backgroundColor: bgColor,
      rotation,
      opacity: 1,
      accentColor: theme.accent,
      decorElements: template.decorFactory(theme.primary),
    });
  }

  return schemes;
}

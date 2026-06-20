import type { HSLColor, HarmonyType } from '../types/color';
import { clampHsl } from './colorUtils';

const normalizeHue = (h: number): number => ((h % 360) + 360) % 360;

export const generateMonochromatic = (base: HSLColor, count: number = 5): HSLColor[] => {
  const colors: HSLColor[] = [];
  const lStep = 80 / (count - 1 || 1);
  const startL = Math.max(15, base.l - 40);

  for (let i = 0; i < count; i++) {
    colors.push(clampHsl({
      h: base.h,
      s: Math.max(30, base.s - i * 10),
      l: Math.min(90, startL + lStep * i),
    }));
  }

  return colors;
};

export const generateComplementary = (base: HSLColor, count: number = 5): HSLColor[] => {
  const complement = normalizeHue(base.h + 180);
  const colors: HSLColor[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    const hue = t < 0.5 ? base.h : complement;
    const lVariation = (i - 2) * 12;

    colors.push(clampHsl({
      h: hue,
      s: Math.max(40, base.s - Math.abs(i - 2) * 8),
      l: clampHsl({ h: 0, s: 0, l: base.l + lVariation }).l,
    }));
  }

  return colors;
};

export const generateAnalogous = (base: HSLColor, count: number = 5): HSLColor[] => {
  const angle = 30;
  const colors: HSLColor[] = [];
  const startOffset = -Math.floor(count / 2) * angle;

  for (let i = 0; i < count; i++) {
    const offset = startOffset + i * angle;
    const lVariation = Math.abs(i - Math.floor(count / 2)) * 10;

    colors.push(clampHsl({
      h: normalizeHue(base.h + offset),
      s: Math.max(40, base.s - lVariation * 0.5),
      l: clampHsl({ h: 0, s: 0, l: base.l + (i % 2 === 0 ? -lVariation : lVariation * 0.5) }).l,
    }));
  }

  return colors;
};

export const generateTriadic = (base: HSLColor, count: number = 5): HSLColor[] => {
  const hues = [
    normalizeHue(base.h),
    normalizeHue(base.h + 120),
    normalizeHue(base.h + 240),
  ];

  const colors: HSLColor[] = [];
  const variations = [
    { hueIdx: 0, lOffset: -15, sOffset: 0 },
    { hueIdx: 1, lOffset: 10, sOffset: -5 },
    { hueIdx: 2, lOffset: -5, sOffset: 5 },
    { hueIdx: 0, lOffset: 15, sOffset: -10 },
    { hueIdx: 1, lOffset: 0, sOffset: 0 },
  ];

  for (let i = 0; i < Math.min(count, variations.length); i++) {
    const v = variations[i];
    colors.push(clampHsl({
      h: hues[v.hueIdx],
      s: Math.max(35, base.s + v.sOffset),
      l: clampHsl({ h: 0, s: 0, l: base.l + v.lOffset }).l,
    }));
  }

  return colors;
};

export const generateTetradic = (base: HSLColor, count: number = 5): HSLColor[] => {
  const hues = [
    normalizeHue(base.h),
    normalizeHue(base.h + 90),
    normalizeHue(base.h + 180),
    normalizeHue(base.h + 270),
  ];

  const colors: HSLColor[] = [];
  const variations = [
    { hueIdx: 0, lOffset: 0, sOffset: 0 },
    { hueIdx: 2, lOffset: 0, sOffset: 0 },
    { hueIdx: 1, lOffset: -10, sOffset: 5 },
    { hueIdx: 3, lOffset: 10, sOffset: -5 },
    { hueIdx: 0, lOffset: 20, sOffset: -15 },
  ];

  for (let i = 0; i < Math.min(count, variations.length); i++) {
    const v = variations[i];
    colors.push(clampHsl({
      h: hues[v.hueIdx],
      s: Math.max(35, base.s + v.sOffset),
      l: clampHsl({ h: 0, s: 0, l: base.l + v.lOffset }).l,
    }));
  }

  return colors;
};

export const generateHarmony = (
  type: HarmonyType,
  base: HSLColor,
  lockedColors: (HSLColor | null)[],
  count: number = 5
): HSLColor[] => {
  let generated: HSLColor[];

  switch (type) {
    case 'monochromatic':
      generated = generateMonochromatic(base, count);
      break;
    case 'complementary':
      generated = generateComplementary(base, count);
      break;
    case 'analogous':
      generated = generateAnalogous(base, count);
      break;
    case 'triadic':
      generated = generateTriadic(base, count);
      break;
    case 'tetradic':
      generated = generateTetradic(base, count);
      break;
    default:
      generated = generateMonochromatic(base, count);
  }

  return generated.map((color, idx) => lockedColors[idx] || color);
};

export const generateAllHarmonies = (
  base: HSLColor,
  lockedMap: Record<HarmonyType, (HSLColor | null)[]>,
  count: number = 5
): Record<HarmonyType, HSLColor[]> => {
  const types: HarmonyType[] = ['monochromatic', 'complementary', 'analogous', 'triadic', 'tetradic'];

  return types.reduce((acc, type) => {
    acc[type] = generateHarmony(type, base, lockedMap[type] || [], count);
    return acc;
  }, {} as Record<HarmonyType, HSLColor[]>);
};

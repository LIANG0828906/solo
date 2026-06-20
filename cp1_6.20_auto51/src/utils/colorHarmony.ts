import type { HSL, HarmonyRule } from '@/types';
import { hslToHex } from './colorUtils';

function generateShades(baseHsl: HSL, count: number = 5): string[] {
  const colors: string[] = [];
  const lightnessStep = 15;
  const startL = Math.max(20, baseHsl.l - (count - 1) * lightnessStep / 2);
  
  for (let i = 0; i < count; i++) {
    const l = Math.min(90, startL + i * lightnessStep);
    colors.push(hslToHex(baseHsl.h, baseHsl.s, l));
  }
  
  return colors;
}

function generatePaletteFromHues(
  baseHsl: HSL,
  hues: number[],
  shadesPerHue: number = 1
): string[] {
  const colors: string[] = [];
  
  for (const hue of hues) {
    const normalizedHue = ((hue % 360) + 360) % 360;
    if (shadesPerHue === 1) {
      colors.push(hslToHex(normalizedHue, baseHsl.s, baseHsl.l));
    } else {
      for (let i = 0; i < shadesPerHue; i++) {
        const lAdjust = (i - Math.floor(shadesPerHue / 2)) * 15;
        const l = Math.max(20, Math.min(85, baseHsl.l + lAdjust));
        colors.push(hslToHex(normalizedHue, baseHsl.s, l));
      }
    }
  }
  
  return colors;
}

export function generateComplementary(baseHsl: HSL): string[] {
  const hues = [baseHsl.h, baseHsl.h + 180];
  return generatePaletteFromHues(baseHsl, hues, 3).slice(0, 5);
}

export function generateAnalogous(baseHsl: HSL): string[] {
  const hues = [
    baseHsl.h - 30,
    baseHsl.h - 15,
    baseHsl.h,
    baseHsl.h + 15,
    baseHsl.h + 30
  ];
  return generatePaletteFromHues(baseHsl, hues);
}

export function generateTriadic(baseHsl: HSL): string[] {
  const hues = [
    baseHsl.h,
    baseHsl.h + 120,
    baseHsl.h + 240
  ];
  const colors = generatePaletteFromHues(baseHsl, hues, 2);
  return [
    colors[0],
    hslToHex(baseHsl.h, baseHsl.s, Math.min(90, baseHsl.l + 20)),
    colors[1],
    colors[2],
    hslToHex(baseHsl.h + 240, baseHsl.s, Math.max(30, baseHsl.l - 15))
  ];
}

export function generateSplitComplementary(baseHsl: HSL): string[] {
  const complementary = baseHsl.h + 180;
  const hues = [
    baseHsl.h,
    complementary - 30,
    complementary,
    complementary + 30,
    baseHsl.h
  ];
  const colors = generatePaletteFromHues(baseHsl, hues.slice(0, 4));
  colors.push(hslToHex(baseHsl.h, Math.max(30, baseHsl.s - 20), Math.min(90, baseHsl.l + 15)));
  return colors;
}

export function generateDoubleComplementary(baseHsl: HSL): string[] {
  const hues = [
    baseHsl.h,
    baseHsl.h + 30,
    baseHsl.h + 180,
    baseHsl.h + 210,
    baseHsl.h + 90
  ];
  return generatePaletteFromHues(baseHsl, hues);
}

export function generateHarmonyPalette(
  baseHsl: HSL,
  rule: HarmonyRule
): string[] {
  switch (rule) {
    case 'complementary':
      return generateComplementary(baseHsl);
    case 'analogous':
      return generateAnalogous(baseHsl);
    case 'triadic':
      return generateTriadic(baseHsl);
    case 'splitComplementary':
      return generateSplitComplementary(baseHsl);
    case 'doubleComplementary':
      return generateDoubleComplementary(baseHsl);
    default:
      return generateShades(baseHsl, 5);
  }
}

export function generateAllHarmonyPalettes(baseHsl: HSL): {
  rule: HarmonyRule;
  colors: string[];
}[] {
  const rules: HarmonyRule[] = [
    'complementary',
    'analogous',
    'triadic',
    'splitComplementary',
    'doubleComplementary'
  ];
  
  return rules.map(rule => ({
    rule,
    colors: generateHarmonyPalette(baseHsl, rule)
  }));
}

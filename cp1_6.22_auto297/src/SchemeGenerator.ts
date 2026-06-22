import { Color, HSL, Scheme, SchemeType } from './types';
import { PaletteManager, hslToHex } from './ColorPalette';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function normalizeHue(h: number): number {
  let result = h % 360;
  if (result < 0) result += 360;
  return Math.round(result);
}

function hslToColor(hsl: HSL): Color {
  return {
    id: generateId(),
    hex: hslToHex(hsl.h, hsl.s, hsl.l),
    hsl: { ...hsl },
  };
}

function varyLightness(base: HSL, offset: number): HSL {
  const l = Math.max(10, Math.min(90, base.l + offset));
  return { h: base.h, s: base.s, l: Math.round(l) };
}

function varySaturation(base: HSL, offset: number): HSL {
  const s = Math.max(20, Math.min(95, base.s + offset));
  return { h: base.h, s: Math.round(s), l: base.l };
}

function generateComplementary(base: HSL): Color[] {
  const colors: Color[] = [];
  const compH = normalizeHue(base.h + 180);

  colors.push(hslToColor({ h: base.h, s: base.s, l: base.l }));
  colors.push(hslToColor(varyLightness(base, -15)));
  colors.push(hslToColor(varyLightness(base, 15)));

  const compHSL: HSL = { h: compH, s: base.s, l: base.l };
  colors.push(hslToColor(varySaturation(compHSL, -10)));
  colors.push(hslToColor(varyLightness(compHSL, 10)));

  return colors;
}

function generateAnalogous(base: HSL): Color[] {
  const colors: Color[] = [];
  const offsets = [-60, -30, 0, 30, 60];

  for (const offset of offsets) {
    const h = normalizeHue(base.h + offset);
    const lightnessOffset = offset === 0 ? 0 : (Math.abs(offset) === 30 ? 5 : -5);
    colors.push(hslToColor(varyLightness({ h, s: base.s, l: base.l }, lightnessOffset)));
  }

  return colors;
}

function generateTriadic(base: HSL): Color[] {
  const colors: Color[] = [];
  const h1 = normalizeHue(base.h);
  const h2 = normalizeHue(base.h + 120);
  const h3 = normalizeHue(base.h + 240);

  colors.push(hslToColor({ h: h1, s: base.s, l: base.l }));
  colors.push(hslToColor(varyLightness({ h: h1, s: base.s, l: base.l }, 12)));
  colors.push(hslToColor({ h: h2, s: base.s, l: base.l }));
  colors.push(hslToColor(varySaturation({ h: h3, s: base.s, l: base.l }, -8)));
  colors.push(hslToColor(varyLightness({ h: h3, s: base.s, l: base.l }, -10)));

  return colors;
}

function generateSplitComplementary(base: HSL): Color[] {
  const colors: Color[] = [];
  const compH = normalizeHue(base.h + 180);
  const split1 = normalizeHue(compH - 30);
  const split2 = normalizeHue(compH + 30);

  colors.push(hslToColor({ h: base.h, s: base.s, l: base.l }));
  colors.push(hslToColor(varyLightness({ h: base.h, s: base.s, l: base.l }, -12)));
  colors.push(hslToColor({ h: split1, s: base.s, l: base.l }));
  colors.push(hslToColor({ h: split2, s: base.s, l: base.l }));
  colors.push(hslToColor(varyLightness({ h: split2, s: base.s, l: base.l }, 10)));

  return colors;
}

export function generateScheme(
  paletteManager: PaletteManager,
  schemeType: SchemeType,
  baseColorId?: string
): Scheme | null {
  const baseColor = baseColorId
    ? paletteManager.getColorById(baseColorId)
    : paletteManager.getSelectedColor();

  if (!baseColor) {
    return null;
  }

  const baseHSL: HSL = { ...baseColor.hsl };
  let colors: Color[];

  switch (schemeType) {
    case 'complementary':
      colors = generateComplementary(baseHSL);
      break;
    case 'analogous':
      colors = generateAnalogous(baseHSL);
      break;
    case 'triadic':
      colors = generateTriadic(baseHSL);
      break;
    case 'split-complementary':
      colors = generateSplitComplementary(baseHSL);
      break;
    default:
      colors = generateAnalogous(baseHSL);
  }

  return {
    id: generateId(),
    name: '',
    type: schemeType,
    colors,
    baseColorId: baseColor.id,
    createdAt: Date.now(),
  };
}

export function pickContrastColor(colors: Color[], preferDark: boolean = true): Color {
  const sorted = [...colors].sort((a, b) =>
    preferDark ? a.hsl.l - b.hsl.l : b.hsl.l - a.hsl.l
  );
  return sorted[0];
}

export function pickBackgroundFromScheme(colors: Color[]): Color {
  return colors.reduce((prev, curr) =>
    Math.abs(curr.hsl.l - 85) < Math.abs(prev.hsl.l - 85) ? curr : prev
  );
}

export function pickTitleFromScheme(colors: Color[]): Color {
  return colors.reduce((prev, curr) =>
    Math.abs(curr.hsl.l - 25) < Math.abs(prev.hsl.l - 25) ? curr : prev
  );
}

export function pickBodyFromScheme(colors: Color[]): Color {
  return colors.reduce((prev, curr) =>
    Math.abs(curr.hsl.l - 40) < Math.abs(prev.hsl.l - 40) ? curr : prev
  );
}

export function pickButtonFromScheme(colors: Color[]): Color {
  return colors.reduce((prev, curr) =>
    curr.hsl.s > prev.hsl.s ? curr : prev
  );
}

export function pickBorderFromScheme(colors: Color[]): Color {
  return colors.reduce((prev, curr) =>
    Math.abs(curr.hsl.l - 55) < Math.abs(prev.hsl.l - 55) ? curr : prev
  );
}

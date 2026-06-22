import type { Color, HSL, RGB } from '@/types';
import { createColor, hslToRgb, rgbToHsl } from '@/utils/colorUtils';

export function createColorFromHSL(h: number, s: number, l: number): Color {
  const rgb = hslToRgb(h, s, l);
  return createColor(rgb);
}

export function interpolateColor(color1: Color, color2: Color, t: number): Color {
  t = Math.max(0, Math.min(1, t));

  const r = Math.round(color1.rgb.r + (color2.rgb.r - color1.rgb.r) * t);
  const g = Math.round(color1.rgb.g + (color2.rgb.g - color1.rgb.g) * t);
  const b = Math.round(color1.rgb.b + (color2.rgb.b - color1.rgb.b) * t);

  return createColor({ r, g, b });
}

export function generateMonochromatic(baseColor: Color): Color[] {
  const { h, s } = baseColor.hsl;
  const colors: Color[] = [];

  const lightnessValues = [15, 35, 50, 65, 85];

  for (const l of lightnessValues) {
    colors.push(createColorFromHSL(h, s, l));
  }

  return colors;
}

export function generateComplementary(baseColor: Color): Color[] {
  const { h, s, l } = baseColor.hsl;
  const colors: Color[] = [];

  const complementH = (h + 180) % 360;

  colors.push(createColorFromHSL(h, s, l));

  const midH1 = (h + 45) % 360;
  colors.push(createColorFromHSL(midH1, s, Math.min(90, l + 15)));

  const complementL = Math.max(10, Math.min(90, l));
  colors.push(createColorFromHSL(complementH, s, complementL));

  const midH2 = (h + 225) % 360;
  colors.push(createColorFromHSL(midH2, s, Math.max(10, l - 15)));

  colors.push(createColorFromHSL(complementH, Math.max(30, s - 20), Math.min(90, l + 20)));

  return colors;
}

export function generateTriadic(baseColor: Color): Color[] {
  const { h, s, l } = baseColor.hsl;
  const colors: Color[] = [];

  const h1 = h;
  const h2 = (h + 120) % 360;
  const h3 = (h + 240) % 360;

  colors.push(createColorFromHSL(h1, s, l));

  colors.push(createColorFromHSL(h1, s, Math.min(90, l + 20)));

  colors.push(createColorFromHSL(h2, s, l));

  colors.push(createColorFromHSL(h2, s, Math.max(10, l - 15)));

  colors.push(createColorFromHSL(h3, s, l));

  return colors;
}

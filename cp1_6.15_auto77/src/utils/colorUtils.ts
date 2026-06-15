import type { HSV, RGB, HSL, Palette, PaletteType } from './types';

export function hsvToRgb(hsv: HSV): RGB {
  const { h, s, v } = hsv;
  const sNorm = s / 100;
  const vNorm = v / 100;
  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vNorm - c;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToHsv(rgb: RGB): HSV {
  const { r, g, b } = rgb;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  if (delta !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, v };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv));
}

export function hexToHsv(hex: string): HSV {
  return rgbToHsv(hexToRgb(hex));
}

export function rgbToHsl(rgb: RGB): HSL {
  const { r, g, b } = rgb;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rNorm) h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
    else if (max === gNorm) h = ((bNorm - rNorm) / d + 2) / 6;
    else h = ((rNorm - gNorm) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  let r, g, b;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function adjustBrightness(hex: string, percent: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.max(0, Math.min(100, hsl.l + percent));
  return rgbToHex(hslToRgb(hsl));
}

export function adjustSaturation(hex: string, percent: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.s = Math.max(0, Math.min(100, hsl.s + percent));
  return rgbToHex(hslToRgb(hsl));
}

export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function generateComplementary(hsv: HSV): string[] {
  const colors: string[] = [];
  const baseHex = hsvToHex(hsv);
  const compHsv = { ...hsv, h: (hsv.h + 180) % 360 };
  const compHex = hsvToHex(compHsv);

  colors.push(adjustBrightness(baseHex, -20));
  colors.push(baseHex);
  colors.push(hsvToHex({ h: (hsv.h + 90) % 360, s: hsv.s, v: hsv.v }));
  colors.push(compHex);
  colors.push(adjustBrightness(compHex, -20));
  return colors;
}

export function generateAnalogous(hsv: HSV): string[] {
  const colors: string[] = [];
  const offsets = [-40, -20, 0, 20, 40];
  for (const offset of offsets) {
    const h = ((hsv.h + offset) % 360 + 360) % 360;
    colors.push(hsvToHex({ h, s: hsv.s, v: hsv.v }));
  }
  return colors;
}

export function generateTriadic(hsv: HSV): string[] {
  const colors: string[] = [];
  const h1 = hsv.h;
  const h2 = (hsv.h + 120) % 360;
  const h3 = (hsv.h + 240) % 360;

  colors.push(hsvToHex({ h: h1, s: hsv.s, v: Math.min(100, hsv.v + 10) }));
  colors.push(hsvToHex({ h: h1, s: hsv.s, v: hsv.v }));
  colors.push(hsvToHex({ h: h2, s: hsv.s, v: hsv.v }));
  colors.push(hsvToHex({ h: h3, s: hsv.s, v: hsv.v }));
  colors.push(hsvToHex({ h: h3, s: hsv.s, v: Math.max(0, hsv.v - 10) }));
  return colors;
}

export function generateMonochromatic(hsv: HSV): string[] {
  const colors: string[] = [];
  const vOffsets = [80, 60, 40, 25, 15];
  for (const vOffset of vOffsets) {
    const v = Math.max(10, Math.min(100, hsv.v - (40 - vOffset)));
    const s = Math.max(10, Math.min(100, hsv.s - (vOffset - 40) * 0.3));
    colors.push(hsvToHex({ h: hsv.h, s, v }));
  }
  return colors;
}

export function generateAllPalettes(hsv: HSV): Palette[] {
  const paletteConfig: { type: PaletteType; name: string; generator: (hsv: HSV) => string[] }[] = [
    { type: 'complementary', name: '互补色', generator: generateComplementary },
    { type: 'analogous', name: '类比色', generator: generateAnalogous },
    { type: 'triadic', name: '三分色', generator: generateTriadic },
    { type: 'monochromatic', name: '单色', generator: generateMonochromatic },
  ];

  return paletteConfig.map(config => ({
    type: config.type,
    name: config.name,
    colors: config.generator(hsv),
  }));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

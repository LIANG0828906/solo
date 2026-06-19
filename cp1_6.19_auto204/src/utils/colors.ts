export const EMOTION_COLORS = {
  joy: '#FFD700',
  sadness: '#4A90D9',
  anger: '#FF4500',
  calm: '#98FB98',
} as const;

export type EmotionType = keyof typeof EMOTION_COLORS;

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
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

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function mixEmotionColors(
  joy: number,
  sadness: number,
  anger: number,
  calm: number
): string {
  const total = joy + sadness + anger + calm;
  if (total === 0) return '#888888';

  const joyRgb = hexToRgb(EMOTION_COLORS.joy);
  const sadnessRgb = hexToRgb(EMOTION_COLORS.sadness);
  const angerRgb = hexToRgb(EMOTION_COLORS.anger);
  const calmRgb = hexToRgb(EMOTION_COLORS.calm);

  const r =
    (joyRgb.r * joy +
      sadnessRgb.r * sadness +
      angerRgb.r * anger +
      calmRgb.r * calm) /
    total;
  const g =
    (joyRgb.g * joy +
      sadnessRgb.g * sadness +
      angerRgb.g * anger +
      calmRgb.g * calm) /
    total;
  const b =
    (joyRgb.b * joy +
      sadnessRgb.b * sadness +
      angerRgb.b * anger +
      calmRgb.b * calm) /
    total;

  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}

export function adjustColor(
  hex: string,
  saturationMultiplier: number,
  redShift: number,
  hueOffset: number = 0
): string {
  const rgb = hexToRgb(hex);
  let hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  hsl.s = Math.max(0, Math.min(100, hsl.s * saturationMultiplier));
  hsl.h = (hsl.h + hueOffset + 360) % 360;

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);

  newRgb.r = Math.min(255, newRgb.r + redShift * 255);

  return rgbToHex(
    Math.round(Math.max(0, Math.min(255, newRgb.r))),
    Math.round(newRgb.g),
    Math.round(newRgb.b)
  );
}

export function offsetHue(hex: string, offset: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + offset + 360) % 360;
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

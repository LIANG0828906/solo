import { lerp } from './random';

export interface RGB {
  r: number;
  g: number;
  b: number;
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

export function rgbToHex(rgb: RGB): string {
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

export function rgbToString(rgb: RGB, alpha = 1): string {
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
}

export function brightnessToFilter(brightness: number): string {
  return `brightness(${brightness})`;
}

export function gradientColor(value: number): RGB {
  const v = Math.max(0, Math.min(1, value));
  const green: RGB = { r: 34, g: 197, b: 94 };
  const yellow: RGB = { r: 234, g: 179, b: 8 };
  const red: RGB = { r: 239, g: 68, b: 68 };
  if (v > 0.6) {
    return lerpColor(yellow, green, (v - 0.6) / 0.4);
  }
  return lerpColor(red, yellow, v / 0.6);
}

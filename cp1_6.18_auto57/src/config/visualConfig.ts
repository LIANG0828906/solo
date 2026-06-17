export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export const BG_COLOR = '#0A0A1A';
export const BG_COLOR_RGB: ColorRGB = { r: 10, g: 10, b: 26 };

export const COLOR_SEQUENCE: ColorRGB[] = [
  { r: 255, g: 107, b: 107 },
  { r: 78, g: 205, b: 196 },
  { r: 255, g: 217, b: 61 },
];

export const COLOR_SEQUENCE_HEX = ['#FF6B6B', '#4ECDC4', '#FFD93D'];

export const LIGHT_SPEED = 2;
export const LIGHT_MIN_RADIUS = 8;
export const LIGHT_MAX_RADIUS = 14;

export const TRAIL_DECAY = 0.2;
export const COLOR_TRANSITION_DURATION = 200;
export const BOUNCE_WHITE_DURATION = 100;

export const DEFLLECTION_PER_KEY = 15;
export const MAX_CUMULATIVE_DEFLECTION = 90;

export const BEAT_PULSE_DURATION_RATIO = 0.5;

export function lerpColor(a: ColorRGB, b: ColorRGB, t: number): ColorRGB {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(a.r + (b.r - a.r) * clamped),
    g: Math.round(a.g + (b.g - a.g) * clamped),
    b: Math.round(a.b + (b.b - a.b) * clamped),
  };
}

export function colorToCSS(c: ColorRGB, alpha: number = 1): string {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

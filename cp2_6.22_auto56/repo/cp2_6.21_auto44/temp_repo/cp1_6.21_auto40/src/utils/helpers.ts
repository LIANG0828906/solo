import type { ParticleSnapshot } from '@/types';

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpArray(
  a: Float32Array,
  b: Float32Array,
  t: number,
  out: Float32Array
): void {
  const len = Math.min(a.length, b.length, out.length);
  for (let i = 0; i < len; i++) {
    out[i] = lerp(a[i], b[i], t);
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateRandomColorArray(count: number, palette: string[]): Float32Array {
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const hex = palette[Math.floor(Math.random() * palette.length)];
    const rgb = hexToRgb(hex);
    colors[i * 3] = rgb.r;
    colors[i * 3 + 1] = rgb.g;
    colors[i * 3 + 2] = rgb.b;
  }
  return colors;
}

export function cubicBezier(t: number, p1: number, p2: number, p3: number, p4: number): number {
  const u = 1 - t;
  return u * u * u * p1 + 3 * u * u * t * p2 + 3 * u * t * t * p3 + t * t * t * p4;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerpSnapshots(
  a: ParticleSnapshot,
  b: ParticleSnapshot,
  t: number
): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(a.positions.length);
  const colors = new Float32Array(a.colors.length);
  lerpArray(a.positions, b.positions, t, positions);
  lerpArray(a.colors, b.colors, t, colors);
  return { positions, colors };
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const DEFAULT_COLOR_PALETTE = [
  '#e0d6c8',
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#ff9ff3',
  '#54a0ff',
  '#5f27cd',
  '#00d2d3',
  '#ff9f43',
];

export const DEFAULT_PARTICLE_COLOR = '#e0d6c8';

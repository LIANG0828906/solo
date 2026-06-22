import { FrequencyBands } from './audioProcessor';

export interface EffectConfig {
  particleEmitRate: number;
  particleColorLow: [number, number, number];
  particleColorMid: [number, number, number];
  particleColorHigh: [number, number, number];
  displacementX: number;
  displacementY: number;
  displacementZ: number;
  intensity: number;
  bassIntensity: number;
  midIntensity: number;
  highIntensity: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [r + m, g + m, b + m];
}

export function generateEffectConfig(bands: FrequencyBands): EffectConfig {
  const { low, mid, high } = bands;

  const particleColorLow: [number, number, number] = hslToRgb(
    lerp(0, 30, low),
    lerp(0.8, 1.0, low),
    lerp(0.3, 0.6, low)
  );

  const particleColorMid: [number, number, number] = hslToRgb(
    lerp(120, 220, mid),
    lerp(0.8, 1.0, mid),
    lerp(0.3, 0.6, mid)
  );

  const particleColorHigh: [number, number, number] = hslToRgb(
    lerp(270, 320, high),
    lerp(0.8, 1.0, high),
    lerp(0.3, 0.6, high)
  );

  const intensity = (low + mid + high) / 3;

  return {
    particleEmitRate: 0.5 + intensity * 2.0,
    particleColorLow,
    particleColorMid,
    particleColorHigh,
    displacementX: low * 8.0,
    displacementY: mid * 8.0,
    displacementZ: high * 8.0,
    intensity,
    bassIntensity: low,
    midIntensity: mid,
    highIntensity: high,
  };
}

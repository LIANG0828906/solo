import type { WeatherType, WeatherStatus, HSLColor } from './types';

export interface ParticleConfig {
  density: number;
  speedRange: [number, number];
  color: string;
  size: number;
  hasTrail: boolean;
  swayAmount: number;
  maxCount: number;
}

export type ParticleParams = ParticleConfig;

export const WEATHER_STATUS_MAP: Record<WeatherType, Omit<WeatherStatus, 'type'>> = {
  sunny: { temperature: 30, visibility: 95 },
  rainy: { temperature: 18, visibility: 60 },
  snowy: { temperature: -5, visibility: 35 },
  stormy: { temperature: 22, visibility: 40 },
};

export const WEATHER_BACKGROUND_COLORS: Record<WeatherType, HSLColor> = {
  sunny: { h: 210, s: 40, l: 55 },
  rainy: { h: 220, s: 25, l: 28 },
  snowy: { h: 210, s: 15, l: 75 },
  stormy: { h: 230, s: 30, l: 18 },
};

export function getParticleParams(weather: WeatherType): ParticleConfig {
  switch (weather) {
    case 'sunny':
      return {
        density: 30,
        speedRange: [0.3, 0.8],
        color: 'rgba(255, 220, 150, 0.5)',
        size: 2,
        hasTrail: false,
        swayAmount: 0.3,
        maxCount: 50,
      };
    case 'rainy':
      return {
        density: 200,
        speedRange: [3, 8],
        color: 'rgba(120, 180, 255, 0.7)',
        size: 1.5,
        hasTrail: true,
        swayAmount: 0,
        maxCount: 300,
      };
    case 'snowy':
      return {
        density: 100,
        speedRange: [1, 3],
        color: 'rgba(255, 255, 255, 0.9)',
        size: 3,
        hasTrail: false,
        swayAmount: 1.5,
        maxCount: 150,
      };
    case 'stormy':
      return {
        density: 250,
        speedRange: [5, 10],
        color: 'rgba(100, 160, 240, 0.75)',
        size: 1.5,
        hasTrail: true,
        swayAmount: 0.5,
        maxCount: 350,
      };
  }
}

export function getWeatherStatus(type: WeatherType): WeatherStatus {
  return {
    type,
    ...WEATHER_STATUS_MAP[type],
  };
}

export function lerpHSL(from: HSLColor, to: HSLColor, t: number): HSLColor {
  const easeT = t * t * (3 - 2 * t);
  return {
    h: from.h + (to.h - from.h) * easeT,
    s: from.s + (to.s - from.s) * easeT,
    l: from.l + (to.l - from.l) * easeT,
  };
}

export function hslToString(c: HSLColor): string {
  return `hsl(${c.h.toFixed(1)}, ${c.s.toFixed(1)}%, ${c.l.toFixed(1)}%)`;
}

export function getBackgroundGradient(weather: WeatherType): [HSLColor, HSLColor] {
  const base = WEATHER_BACKGROUND_COLORS[weather];
  const top: HSLColor = { h: base.h, s: base.s, l: Math.min(base.l + 10, 95) };
  const bottom: HSLColor = { h: base.h + 10, s: Math.max(base.s - 5, 5), l: Math.max(base.l - 20, 8) };
  return [top, bottom];
}

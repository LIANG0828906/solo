import type { RainType, RainParticleConfig } from '@/types';

export const RAIN_CONFIGS: Record<RainType, RainParticleConfig> = {
  frontal: {
    count: 800,
    speed: 60,
    angle: 0,
    color: '#A0B8FF',
    size: 0.15,
    bgColor: '#D3D3D3',
    rainfallMmPerHour: 8,
  },
  convective: {
    count: 3000,
    speed: 120,
    angle: 5,
    color: '#FF9966',
    size: 0.2,
    bgColor: '#A09B6F',
    rainfallMmPerHour: 35,
  },
  typhoon: {
    count: 6000,
    speed: 200,
    angle: 25,
    color: '#66E0E0',
    size: 0.12,
    bgColor: '#2F4F4F',
    rainfallMmPerHour: 80,
  },
};

export const RAIN_LABELS: Record<RainType, string> = {
  frontal: '锋面雨',
  convective: '对流雨',
  typhoon: '台风雨',
};

export const RAIN_BUTTON_GRADIENTS: Record<RainType, string> = {
  frontal: 'linear-gradient(135deg, #7B68EE 0%, #483D8B 100%)',
  convective: 'linear-gradient(135deg, #FF6347 0%, #CD5C5C 100%)',
  typhoon: 'linear-gradient(135deg, #008B8B 0%, #005555 100%)',
};

export function lerpConfig(
  a: RainParticleConfig,
  b: RainParticleConfig,
  t: number,
): RainParticleConfig {
  const clamp = Math.max(0, Math.min(1, t));
  return {
    count: Math.round(a.count + (b.count - a.count) * clamp),
    speed: a.speed + (b.speed - a.speed) * clamp,
    angle: a.angle + (b.angle - a.angle) * clamp,
    size: a.size + (b.size - a.size) * clamp,
    color: b.color,
    bgColor: b.bgColor,
    rainfallMmPerHour: a.rainfallMmPerHour + (b.rainfallMmPerHour - a.rainfallMmPerHour) * clamp,
  };
}

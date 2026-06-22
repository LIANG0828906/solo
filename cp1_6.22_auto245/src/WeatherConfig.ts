export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'thunder';

export interface ParticleConfig {
  count: number;
  size: [number, number];
  speedY: [number, number];
  speedX: [number, number];
  speedZ: [number, number];
  color: string;
  opacity: number;
  geometry: 'cylinder' | 'point' | 'sphere';
  spiralFactor?: number;
  floatAmplitude?: number;
  floatFrequency?: number;
}

export interface LightingConfig {
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
}

export interface BackgroundConfig {
  topColor: string;
  bottomColor: string;
  fogColor: string;
  fogDensity: number;
}

export interface WeatherPreset {
  id: WeatherType;
  name: string;
  icon: string;
  particles: ParticleConfig;
  lighting: LightingConfig;
  background: BackgroundConfig;
  hasThunder: boolean;
  thunderInterval?: [number, number];
}

export interface RuntimeParams {
  densityMultiplier: number;
  speedMultiplier: number;
  windAngle: number;
  sizeMultiplier: number;
  brightnessMultiplier: number;
}

export interface BlendConfig {
  enabled: boolean;
  weatherA: WeatherType;
  weatherB: WeatherType;
  ratio: number;
}

export const WEATHER_PRESETS: Record<WeatherType, WeatherPreset> = {
  clear: {
    id: 'clear',
    name: '晴空',
    icon: '☀️',
    hasThunder: false,
    particles: {
      count: 100,
      size: [0.1, 0.25],
      speedY: [-0.2, 0.2],
      speedX: [0, 0],
      speedZ: [0, 0],
      color: '#FFD700',
      opacity: 0.9,
      geometry: 'point',
      floatAmplitude: 2.0,
      floatFrequency: 0.5,
    },
    lighting: {
      ambientColor: '#FFFFFF',
      ambientIntensity: 0.7,
      directionalColor: '#FFF8E7',
      directionalIntensity: 1.2,
      directionalPosition: [10, 30, 10],
    },
    background: {
      topColor: '#4A90D9',
      bottomColor: '#87CEEB',
      fogColor: '#87CEEB',
      fogDensity: 0.005,
    },
  },
  rain: {
    id: 'rain',
    name: '雨',
    icon: '🌧️',
    hasThunder: false,
    particles: {
      count: 2000,
      size: [0.01, 0.01],
      speedY: [-18, -12],
      speedX: [0, 0],
      speedZ: [0, 0],
      color: '#6BB7E8',
      opacity: 0.55,
      geometry: 'cylinder',
    },
    lighting: {
      ambientColor: '#A0B4C8',
      ambientIntensity: 0.4,
      directionalColor: '#C0D0E0',
      directionalIntensity: 0.5,
      directionalPosition: [0, 20, 0],
    },
    background: {
      topColor: '#2C3E50',
      bottomColor: '#1A252C',
      fogColor: '#3A4A5A',
      fogDensity: 0.02,
    },
  },
  snow: {
    id: 'snow',
    name: '雪',
    icon: '❄️',
    hasThunder: false,
    particles: {
      count: 500,
      size: [0.12, 0.18],
      speedY: [-3, -1.5],
      speedX: [-0.8, 0.8],
      speedZ: [-0.8, 0.8],
      color: '#FFFFFF',
      opacity: 0.9,
      geometry: 'point',
      spiralFactor: 1.5,
    },
    lighting: {
      ambientColor: '#DCE8F5',
      ambientIntensity: 0.6,
      directionalColor: '#E8F0FF',
      directionalIntensity: 0.8,
      directionalPosition: [5, 20, 5],
    },
    background: {
      topColor: '#6B7B8D',
      bottomColor: '#9CAEBD',
      fogColor: '#B0C4DE',
      fogDensity: 0.035,
    },
  },
  fog: {
    id: 'fog',
    name: '雾',
    icon: '🌫️',
    hasThunder: false,
    particles: {
      count: 300,
      size: [0.8, 2.5],
      speedY: [-0.15, 0.15],
      speedX: [-0.3, 0.3],
      speedZ: [-0.3, 0.3],
      color: '#C8D8E8',
      opacity: 0.18,
      geometry: 'sphere',
    },
    lighting: {
      ambientColor: '#B8C4D0',
      ambientIntensity: 0.5,
      directionalColor: '#D0D8E0',
      directionalIntensity: 0.3,
      directionalPosition: [0, 10, 0],
    },
    background: {
      topColor: '#7A8A9A',
      bottomColor: '#A0B0C0',
      fogColor: '#B8C4D0',
      fogDensity: 0.08,
    },
  },
  thunder: {
    id: 'thunder',
    name: '雷暴',
    icon: '⛈️',
    hasThunder: true,
    thunderInterval: [2000, 5000],
    particles: {
      count: 2500,
      size: [0.01, 0.01],
      speedY: [-22, -14],
      speedX: [0, 0],
      speedZ: [0, 0],
      color: '#5A9FD8',
      opacity: 0.6,
      geometry: 'cylinder',
    },
    lighting: {
      ambientColor: '#4A3A6A',
      ambientIntensity: 0.25,
      directionalColor: '#6A4A9A',
      directionalIntensity: 0.3,
      directionalPosition: [0, 25, 0],
    },
    background: {
      topColor: '#1A0A2E',
      bottomColor: '#2A1A3E',
      fogColor: '#3A2A4E',
      fogDensity: 0.03,
    },
  },
};

export const DEFAULT_RUNTIME_PARAMS: RuntimeParams = {
  densityMultiplier: 1.0,
  speedMultiplier: 1.0,
  windAngle: 0,
  sizeMultiplier: 1.0,
  brightnessMultiplier: 1.0,
};

export const DEFAULT_BLEND_CONFIG: BlendConfig = {
  enabled: false,
  weatherA: 'rain',
  weatherB: 'snow',
  ratio: 0.5,
};

export const WEATHER_LIST: WeatherType[] = ['clear', 'rain', 'snow', 'fog', 'thunder'];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

export function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getBlendedPreset(
  presetA: WeatherPreset,
  presetB: WeatherPreset,
  ratio: number
): WeatherPreset {
  const t = clamp(ratio, 0, 1);
  const rgbA = hexToRgb(presetA.particles.color);
  const rgbB = hexToRgb(presetB.particles.color);
  const blendedColor = lerpColor(rgbA, rgbB, t);

  const bgTopA = hexToRgb(presetA.background.topColor);
  const bgTopB = hexToRgb(presetB.background.topColor);
  const bgBottomA = hexToRgb(presetA.background.bottomColor);
  const bgBottomB = hexToRgb(presetB.background.bottomColor);
  const fogA = hexToRgb(presetA.background.fogColor);
  const fogB = hexToRgb(presetB.background.fogColor);
  const ambA = hexToRgb(presetA.lighting.ambientColor);
  const ambB = hexToRgb(presetB.lighting.ambientColor);
  const dirA = hexToRgb(presetA.lighting.directionalColor);
  const dirB = hexToRgb(presetB.lighting.directionalColor);

  return {
    id: presetA.id,
    name: `${presetA.name}→${presetB.name}`,
    icon: `${presetA.icon}${presetB.icon}`,
    hasThunder: presetA.hasThunder || presetB.hasThunder,
    particles: {
      ...presetA.particles,
      count: Math.round(lerp(presetA.particles.count, presetB.particles.count, t)),
      speedY: [
        lerp(presetA.particles.speedY[0], presetB.particles.speedY[0], t),
        lerp(presetA.particles.speedY[1], presetB.particles.speedY[1], t),
      ],
      speedX: [
        lerp(presetA.particles.speedX[0], presetB.particles.speedX[0], t),
        lerp(presetA.particles.speedX[1], presetB.particles.speedX[1], t),
      ],
      speedZ: [
        lerp(presetA.particles.speedZ[0], presetB.particles.speedZ[0], t),
        lerp(presetA.particles.speedZ[1], presetB.particles.speedZ[1], t),
      ],
      color: rgbToHex(blendedColor.r, blendedColor.g, blendedColor.b),
      opacity: lerp(presetA.particles.opacity, presetB.particles.opacity, t),
      geometry: t < 0.5 ? presetA.particles.geometry : presetB.particles.geometry,
    },
    lighting: {
      ambientColor: rgbToHex(
        lerpColor(ambA, ambB, t).r,
        lerpColor(ambA, ambB, t).g,
        lerpColor(ambA, ambB, t).b
      ),
      ambientIntensity: lerp(
        presetA.lighting.ambientIntensity,
        presetB.lighting.ambientIntensity,
        t
      ),
      directionalColor: rgbToHex(
        lerpColor(dirA, dirB, t).r,
        lerpColor(dirA, dirB, t).g,
        lerpColor(dirA, dirB, t).b
      ),
      directionalIntensity: lerp(
        presetA.lighting.directionalIntensity,
        presetB.lighting.directionalIntensity,
        t
      ),
      directionalPosition: [
        lerp(
          presetA.lighting.directionalPosition[0],
          presetB.lighting.directionalPosition[0],
          t
        ),
        lerp(
          presetA.lighting.directionalPosition[1],
          presetB.lighting.directionalPosition[1],
          t
        ),
        lerp(
          presetA.lighting.directionalPosition[2],
          presetB.lighting.directionalPosition[2],
          t
        ),
      ],
    },
    background: {
      topColor: rgbToHex(
        lerpColor(bgTopA, bgTopB, t).r,
        lerpColor(bgTopA, bgTopB, t).g,
        lerpColor(bgTopA, bgTopB, t).b
      ),
      bottomColor: rgbToHex(
        lerpColor(bgBottomA, bgBottomB, t).r,
        lerpColor(bgBottomA, bgBottomB, t).g,
        lerpColor(bgBottomA, bgBottomB, t).b
      ),
      fogColor: rgbToHex(
        lerpColor(fogA, fogB, t).r,
        lerpColor(fogA, fogB, t).g,
        lerpColor(fogA, fogB, t).b
      ),
      fogDensity: lerp(
        presetA.background.fogDensity,
        presetB.background.fogDensity,
        t
      ),
    },
  };
}

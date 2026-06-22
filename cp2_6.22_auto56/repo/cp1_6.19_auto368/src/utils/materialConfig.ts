export type MaterialType = 'brushedMetal' | 'mirrorMetal' | 'glass' | 'burlap' | 'granite';

export interface MaterialPreset {
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  transmission?: number;
  ior?: number;
  opacity?: number;
  transparent?: boolean;
}

export const MATERIAL_PRESETS: Record<MaterialType, MaterialPreset> = {
  brushedMetal: {
    name: '磨砂金属',
    color: '#C0C0C0',
    roughness: 0.5,
    metalness: 0.9,
  },
  mirrorMetal: {
    name: '镜面金属',
    color: '#E8E8E8',
    roughness: 0.1,
    metalness: 1.0,
  },
  glass: {
    name: '清玻璃',
    color: '#FFFFFF',
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.7,
    ior: 1.5,
    opacity: 0.7,
    transparent: true,
  },
  burlap: {
    name: '粗麻布',
    color: '#A0826D',
    roughness: 0.9,
    metalness: 0.0,
  },
  granite: {
    name: '花岗岩',
    color: '#808080',
    roughness: 0.8,
    metalness: 0.0,
  },
};

export interface SunColorStop {
  time: number;
  color: string;
}

export const SUN_COLOR_STOPS: SunColorStop[] = [
  { time: 6, color: '#FFA07A' },
  { time: 12, color: '#FFFFFF' },
  { time: 18, color: '#FF4500' },
];

export function getSunColor(time: number): string {
  if (time <= 6) return SUN_COLOR_STOPS[0].color;
  if (time >= 18) return SUN_COLOR_STOPS[2].color;
  if (time <= 12) {
    const t = (time - 6) / 6;
    return lerpColor(SUN_COLOR_STOPS[0].color, SUN_COLOR_STOPS[1].color, t);
  } else {
    const t = (time - 12) / 6;
    return lerpColor(SUN_COLOR_STOPS[1].color, SUN_COLOR_STOPS[2].color, t);
  }
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function getSunPosition(time: number, radius: number = 10): { x: number; y: number; z: number } {
  const t = (time - 6) / 12;
  const angle = Math.PI * (1 - t);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.8 + 2;
  const z = Math.sin(angle * 0.3) * 2;
  return { x, y, z };
}

export function formatTime(time: number): string {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

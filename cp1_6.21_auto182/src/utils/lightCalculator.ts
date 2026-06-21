import type { LightParams, TimeOfDayLabel } from '../types';

interface KeyFrame {
  time: number;
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  shadowBlur: number;
  skyColor: string;
  moonIntensity: number;
  moonColor: string;
}

const KEY_FRAMES: KeyFrame[] = [
  {
    time: 0,
    sunPosition: [0, -10, 0],
    sunColor: '#000000',
    sunIntensity: 0,
    ambientColor: '#0F172A',
    ambientIntensity: 0.15,
    shadowBlur: 1.0,
    skyColor: '#0B0D17',
    moonIntensity: 0.3,
    moonColor: '#94A3B8'
  },
  {
    time: 5,
    sunPosition: [-8, -2, -10],
    sunColor: '#FF9F43',
    sunIntensity: 0.2,
    ambientColor: '#1E293B',
    ambientIntensity: 0.25,
    shadowBlur: 0.9,
    skyColor: '#1E293B',
    moonIntensity: 0.2,
    moonColor: '#94A3B8'
  },
  {
    time: 6,
    sunPosition: [-10, 0, -5],
    sunColor: '#FF9F43',
    sunIntensity: 0.8,
    ambientColor: '#FFEDD5',
    ambientIntensity: 0.4,
    shadowBlur: 0.5,
    skyColor: '#FFE4B5',
    moonIntensity: 0.05,
    moonColor: '#94A3B8'
  },
  {
    time: 8,
    sunPosition: [-8, 6, -8],
    sunColor: '#FFD89B',
    sunIntensity: 1.2,
    ambientColor: '#FEF3C7',
    ambientIntensity: 0.5,
    shadowBlur: 0.35,
    skyColor: '#FDE68A',
    moonIntensity: 0,
    moonColor: '#94A3B8'
  },
  {
    time: 12,
    sunPosition: [0, 15, 0],
    sunColor: '#FFFFFF',
    sunIntensity: 1.5,
    ambientColor: '#F8FAFC',
    ambientIntensity: 0.6,
    shadowBlur: 0.1,
    skyColor: '#87CEEB',
    moonIntensity: 0,
    moonColor: '#94A3B8'
  },
  {
    time: 15,
    sunPosition: [6, 10, -8],
    sunColor: '#FEF3C7',
    sunIntensity: 1.3,
    ambientColor: '#F0F9FF',
    ambientIntensity: 0.55,
    shadowBlur: 0.25,
    skyColor: '#A5F3FC',
    moonIntensity: 0,
    moonColor: '#94A3B8'
  },
  {
    time: 18,
    sunPosition: [10, 0, -5],
    sunColor: '#FF7B54',
    sunIntensity: 0.9,
    ambientColor: '#FED7AA',
    ambientIntensity: 0.45,
    shadowBlur: 0.8,
    skyColor: '#FF7B54',
    moonIntensity: 0,
    moonColor: '#94A3B8'
  },
  {
    time: 19,
    sunPosition: [8, -2, -10],
    sunColor: '#F97316',
    sunIntensity: 0.4,
    ambientColor: '#FDBA74',
    ambientIntensity: 0.3,
    shadowBlur: 0.95,
    skyColor: '#F97316',
    moonIntensity: 0.1,
    moonColor: '#94A3B8'
  },
  {
    time: 21,
    sunPosition: [2, -8, -5],
    sunColor: '#000000',
    sunIntensity: 0,
    ambientColor: '#0F172A',
    ambientIntensity: 0.2,
    shadowBlur: 1.0,
    skyColor: '#0B0D17',
    moonIntensity: 0.25,
    moonColor: '#94A3B8'
  },
  {
    time: 24,
    sunPosition: [0, -10, 0],
    sunColor: '#000000',
    sunIntensity: 0,
    ambientColor: '#0F172A',
    ambientIntensity: 0.15,
    shadowBlur: 1.0,
    skyColor: '#0B0D17',
    moonIntensity: 0.3,
    moonColor: '#94A3B8'
  }
];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(colorA: string, colorB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(colorA);
  const [r2, g2, b2] = hexToRgb(colorB);
  return rgbToHex(lerp(r1, r2, t), lerp(g1, g2, t), lerp(b1, b2, t));
}

function lerpPosition(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function findKeyFrames(time: number): [KeyFrame, KeyFrame, number] {
  const normalizedTime = ((time % 24) + 24) % 24;

  for (let i = 0; i < KEY_FRAMES.length - 1; i++) {
    const curr = KEY_FRAMES[i];
    const next = KEY_FRAMES[i + 1];
    if (normalizedTime >= curr.time && normalizedTime <= next.time) {
      const range = next.time - curr.time;
      const t = range === 0 ? 0 : (normalizedTime - curr.time) / range;
      return [curr, next, t];
    }
  }
  return [KEY_FRAMES[0], KEY_FRAMES[0], 0];
}

export function calculateLightParams(time: number): LightParams {
  const [curr, next, t] = findKeyFrames(time);

  return {
    sunPosition: lerpPosition(curr.sunPosition, next.sunPosition, t),
    sunColor: lerpColor(curr.sunColor, next.sunColor, t),
    sunIntensity: lerp(curr.sunIntensity, next.sunIntensity, t),
    ambientColor: lerpColor(curr.ambientColor, next.ambientColor, t),
    ambientIntensity: lerp(curr.ambientIntensity, next.ambientIntensity, t),
    shadowBlur: lerp(curr.shadowBlur, next.shadowBlur, t),
    skyColor: lerpColor(curr.skyColor, next.skyColor, t),
    moonIntensity: lerp(curr.moonIntensity, next.moonIntensity, t),
    moonColor: lerpColor(curr.moonColor, next.moonColor, t)
  };
}

export function formatTime(time: number): string {
  const normalizedTime = ((time % 24) + 24) % 24;
  const totalSeconds = Math.round(normalizedTime * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getTimeOfDayLabel(time: number): TimeOfDayLabel {
  const t = ((time % 24) + 24) % 24;
  if (t >= 5 && t < 7) return '清晨';
  if (t >= 7 && t < 11) return '早晨';
  if (t >= 11 && t < 13.5) return '正午';
  if (t >= 13.5 && t < 17) return '午后';
  if (t >= 17 && t < 20) return '黄昏';
  return '夜晚';
}

export const PRESET_CARDS = [
  { label: '清晨' as TimeOfDayLabel, time: 6 },
  { label: '早晨' as TimeOfDayLabel, time: 9 },
  { label: '正午' as TimeOfDayLabel, time: 12 },
  { label: '午后' as TimeOfDayLabel, time: 15 },
  { label: '黄昏' as TimeOfDayLabel, time: 18 },
  { label: '夜晚' as TimeOfDayLabel, time: 22 }
];

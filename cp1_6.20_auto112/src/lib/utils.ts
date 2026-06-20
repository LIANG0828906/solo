import * as THREE from 'three';

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export const lerpColor = (colorA: string, colorB: string, t: number): string => {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const r = Math.round(lerp(a.r, b.r, t) * 255);
  const g = Math.round(lerp(a.g, b.g, t) * 255);
  const bl = Math.round(lerp(a.b, b.b, t) * 255);
  return `rgb(${r}, ${g}, ${bl})`;
};

export const generateRandomColor = (): string =>
  `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

export const vec3ToArray = (v: THREE.Vector3): [number, number, number] => [v.x, v.y, v.z];

export const arrayToVec3 = (arr: [number, number, number]): THREE.Vector3 =>
  new THREE.Vector3(arr[0], arr[1], arr[2]);

export const distance3D = (a: [number, number, number], b: [number, number, number]): number =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

export const midpoint3D = (
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

export const Colors = {
  backboneBlue: '#3b82f6',
  backboneRed: '#ef4444',
  baseAT: '#10b981',
  baseGC: '#f59e0b',
  hydrogenBond: '#ffffff',
  highlight: '#60a5fa',
  backgroundStart: '#0a1628',
  backgroundEnd: '#000000',
  textPrimary: 'rgba(255, 255, 255, 0.85)',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  panelBg: 'rgba(10, 22, 40, 0.55)',
  panelBorder: 'rgba(255, 255, 255, 0.08)',
  buttonBg: 'rgba(15, 30, 55, 0.7)',
  buttonHover: 'rgba(59, 130, 246, 0.3)',
} as const;

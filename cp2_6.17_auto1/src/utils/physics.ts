export interface Medium {
  name: string;
  refractiveIndex: number;
  color: string;
}

export const MEDIA: Record<string, Medium> = {
  air: { name: '空气', refractiveIndex: 1.0, color: '#4A90D9' },
  water: { name: '水', refractiveIndex: 1.33, color: '#2C5282' },
  glass: { name: '玻璃', refractiveIndex: 1.52, color: '#4A5568' },
  diamond: { name: '钻石', refractiveIndex: 2.42, color: '#E2E8F0' },
};

export const PRESETS = [
  { id: 'air-water', medium1: 'air', medium2: 'water', label: '空气 → 水' },
  { id: 'air-glass', medium1: 'air', medium2: 'glass', label: '空气 → 玻璃' },
  { id: 'water-glass', medium1: 'water', medium2: 'glass', label: '水 → 玻璃' },
];

export const DISPERSION_WAVELENGTHS = [
  { color: '#FF0000', wavelength: 700, offset: -0.012 },
  { color: '#FF7F00', wavelength: 620, offset: -0.008 },
  { color: '#FFFF00', wavelength: 580, offset: -0.004 },
  { color: '#00FF00', wavelength: 530, offset: 0.0 },
  { color: '#0000FF', wavelength: 470, offset: 0.004 },
  { color: '#4B0082', wavelength: 440, offset: 0.008 },
  { color: '#9400D3', wavelength: 400, offset: 0.012 },
];

export function snellLaw(
  incidentAngle: number,
  n1: number,
  n2: number
): { reflectionAngle: number; refractionAngle: number | null; isTotalReflection: boolean } {
  const reflectionAngle = incidentAngle;

  const sinRefraction = (n1 * Math.sin(incidentAngle)) / n2;

  if (Math.abs(sinRefraction) > 1) {
    return {
      reflectionAngle,
      refractionAngle: null,
      isTotalReflection: true,
    };
  }

  return {
    reflectionAngle,
    refractionAngle: Math.asin(sinRefraction),
    isTotalReflection: false,
  };
}

export function totalReflection(n1: number, n2: number): number | null {
  if (n1 <= n2) return null;
  return Math.asin(n2 / n1);
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

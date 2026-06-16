export interface Medium {
  name: string;
  refractiveIndex: number;
  color: string;
  cauchyA: number;
  cauchyB: number;
}

export const MEDIA: Record<string, Medium> = {
  air: {
    name: '空气',
    refractiveIndex: 1.0003,
    color: '#4A90D9',
    cauchyA: 1.000293,
    cauchyB: 0.0052,
  },
  water: {
    name: '水',
    refractiveIndex: 1.333,
    color: '#2C5282',
    cauchyA: 1.3199,
    cauchyB: 6878,
  },
  glass: {
    name: '玻璃',
    refractiveIndex: 1.517,
    color: '#4A5568',
    cauchyA: 1.5046,
    cauchyB: 4200,
  },
  diamond: {
    name: '钻石',
    refractiveIndex: 2.417,
    color: '#E2E8F0',
    cauchyA: 2.3790,
    cauchyB: 6620,
  },
};

export const PRESETS = [
  { id: 'air-water', medium1: 'air', medium2: 'water', label: '空气 → 水' },
  { id: 'air-glass', medium1: 'air', medium2: 'glass', label: '空气 → 玻璃' },
  { id: 'water-glass', medium1: 'water', medium2: 'glass', label: '水 → 玻璃' },
];

export interface WavelengthData {
  color: string;
  wavelength: number;
}

export const DISPERSION_WAVELENGTHS: WavelengthData[] = [
  { color: '#FF2020', wavelength: 700 },
  { color: '#FF8C00', wavelength: 620 },
  { color: '#FFE500', wavelength: 580 },
  { color: '#00C850', wavelength: 530 },
  { color: '#2060FF', wavelength: 470 },
  { color: '#5A10A0', wavelength: 440 },
  { color: '#9C00D0', wavelength: 400 },
];

export const PIXEL_TO_THREE = 0.005;

export function cauchyDispersion(medium: Medium, wavelengthNm: number): number {
  const lambdaMicrom2 = (wavelengthNm / 1000) ** 2;
  return medium.cauchyA + medium.cauchyB / lambdaMicrom2;
}

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

export interface Earthquake {
  id: string;
  magnitude: number;
  year: number;
  depth: number;
  latitude: number;
  longitude: number;
  region: string;
}

export type SeismicBeltType = 'pacific' | 'eurasian' | 'midOceanRidge';

export interface SeismicBelt {
  id: SeismicBeltType;
  name: string;
  description: string;
}

export interface SceneConfig {
  earthRadius: number;
  markerMinRadius: number;
  markerMaxRadius: number;
  minMagnitude: number;
  maxMagnitude: number;
  startYear: number;
  endYear: number;
  floatAmplitude: number;
}

export const MAGNITUDE_COLORS: Record<string, string> = {
  '5-6': '#FCD34D',
  '6-7': '#F97316',
  '7-8': '#EF4444',
  '8+': '#991B1B',
};

export const SEISMIC_BELTS: SeismicBelt[] = [
  { id: 'pacific', name: '环太平洋地震带', description: '全球最大地震带，环绕太平洋一周' },
  { id: 'eurasian', name: '欧亚地震带', description: '横跨欧亚大陆的地震带' },
  { id: 'midOceanRidge', name: '洋中脊地震带', description: '沿大洋中脊分布的地震带' },
];

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  earthRadius: 10,
  markerMinRadius: 0.5,
  markerMaxRadius: 3.0,
  minMagnitude: 5.0,
  maxMagnitude: 9.5,
  startYear: 1970,
  endYear: 2024,
  floatAmplitude: 0.8,
};

export function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 8.0) return MAGNITUDE_COLORS['8+'];
  if (magnitude >= 7.0) return MAGNITUDE_COLORS['7-8'];
  if (magnitude >= 6.0) return MAGNITUDE_COLORS['6-7'];
  return MAGNITUDE_COLORS['5-6'];
}

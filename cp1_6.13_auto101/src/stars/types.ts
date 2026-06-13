export type SpectralType = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export interface StarData {
  id: string;
  name: string;
  spectralType: SpectralType;
  temperature: number;
  absoluteMagnitude: number;
  color: { r: number; g: number; b: number };
  size: number;
  position: { x: number; y: number; z: number };
}

export interface SceneConfig {
  brightness: number;
  activeFilters: SpectralType[];
  selectedStarId: string | null;
}

export const SPECTRAL_COLORS: Record<SpectralType, string> = {
  O: '#9bb0ff',
  B: '#aabfff',
  A: '#cad8ff',
  F: '#f8f7ff',
  G: '#fff4e8',
  K: '#ffd2a1',
  M: '#ffcc6f',
};

export const SPECTRAL_TYPES: SpectralType[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

export const TEMPERATURE_RANGES: Record<SpectralType, [number, number]> = {
  O: [30000, 60000],
  B: [10000, 30000],
  A: [7500, 10000],
  F: [6000, 7500],
  G: [5200, 6000],
  K: [3700, 5200],
  M: [2400, 3700],
};

export const SPECTRAL_DISTRIBUTION: Record<SpectralType, number> = {
  O: 0.0000003,
  B: 0.0013,
  A: 0.006,
  F: 0.03,
  G: 0.076,
  K: 0.121,
  M: 0.76,
};

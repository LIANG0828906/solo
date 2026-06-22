export type SpectralType = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'ALL';

export type EvolutionStage = 'main_sequence' | 'red_giant' | 'white_dwarf';

export interface Star {
  id: string;
  name: string;
  spectralType: Exclude<SpectralType, 'ALL'>;
  temperature: number;
  absoluteMagnitude: number;
  radius: number;
  evolutionStage: EvolutionStage;
  mass: number;
  luminosity: number;
}

export interface EvolutionPoint {
  position: { x: number; y: number; z: number };
  temperature: number;
  radius: number;
  spectralType: Exclude<SpectralType, 'ALL'>;
  stage: EvolutionStage;
}

export interface StarStoreState {
  stars: Star[];
  selectedStarId: string | null;
  filterType: SpectralType;
  isPlaying: boolean;
  evolutionProgress: number;
  evolutionPath: EvolutionPoint[];
  setSelectedStar: (id: string | null) => void;
  setFilterType: (type: SpectralType) => void;
  togglePlayback: () => void;
  setEvolutionProgress: (progress: number) => void;
  loadEvolutionPath: (starId: string) => void;
}

export const SPECTRAL_COLORS: Record<Exclude<SpectralType, 'ALL'>, string> = {
  O: '#7B9CFF',
  B: '#A8C4FF',
  A: '#F0F0F0',
  F: '#FFF8DC',
  G: '#FFD700',
  K: '#FF8C00',
  M: '#FF4500',
};

export const EVOLUTION_STAGE_NAMES: Record<EvolutionStage, string> = {
  main_sequence: '主序星',
  red_giant: '红巨星',
  white_dwarf: '白矮星',
};

export const SCALE_FACTOR = 0.02;

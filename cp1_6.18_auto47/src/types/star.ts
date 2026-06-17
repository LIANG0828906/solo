export type SpectralType = 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';

export interface StarData {
  id: string;
  name: string;
  temperature: number;
  spectralType: SpectralType;
  radius: number;
  position: { x: number; y: number; z: number };
  description: string;
}

export interface StarStoreState {
  stars: StarData[];
  selectedStarId: string | null;
  filterSpectralTypes: SpectralType[];
  isLoading: boolean;
}

export interface StarStoreActions {
  setStars: (stars: StarData[]) => void;
  selectStar: (id: string | null) => void;
  toggleSpectralFilter: (type: SpectralType) => void;
  clearFilters: () => void;
  fetchStars: () => Promise<void>;
  getFilteredStars: () => StarData[];
  isStarVisible: (starId: string) => boolean;
}

export const SPECTRAL_COLORS: Record<SpectralType, string> = {
  O: '#9BB0FF',
  B: '#A2C4FF',
  A: '#D4E2FF',
  F: '#FFF7E0',
  G: '#FFD93D',
  K: '#FF8C42',
  M: '#FF4C4C',
};

export const SPECTRAL_TYPES: SpectralType[] = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

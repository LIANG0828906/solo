export type StarType = 'red_dwarf' | 'yellow_dwarf' | 'blue_giant' | 'white_dwarf' | 'red_supergiant';

export interface StarLayer {
  name: string;
  color: string;
  opacity: number;
  radiusRatio: number;
  temperature: string;
  density: string;
  percentage: string;
  description: string;
}

export interface StarData {
  id: string;
  name: string;
  type: StarType;
  color: string;
  gradient: [string, string];
  radius: number;
  mass: number;
  temperature: number;
  spectralType: string;
  lifespan: string;
  rotationPeriod: number;
  layers: StarLayer[];
  description: string;
}

export interface StarStoreState {
  currentStar: StarType;
  isCrossSection: boolean;
  comparisonStars: StarType[];
  selectedLayer: string | null;
  showComparison: boolean;
  dragStarType: StarType | null;
}

export interface StarStoreActions {
  setStar: (type: StarType) => void;
  toggleCrossSection: () => void;
  addComparisonStar: (type: StarType, index?: number) => void;
  removeComparisonStar: (index: number) => void;
  clearComparison: () => void;
  setSelectedLayer: (layer: string | null) => void;
  setShowComparison: (show: boolean) => void;
  setDragStarType: (type: StarType | null) => void;
}

export type StarStore = StarStoreState & { actions: StarStoreActions };

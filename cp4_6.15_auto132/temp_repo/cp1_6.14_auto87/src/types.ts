export interface StarData {
  id: string;
  name: string;
  nameCn: string;
  x: number;
  y: number;
  z: number;
  apparentMagnitude: number;
  absoluteMagnitude?: number;
  spectralType: string;
  spectralClass: 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M';
  distance: number;
  temperature: number;
  luminosity?: number;
  constellation: string;
  constellationCn: string;
  color: string;
}

export interface StarCluster {
  id: string;
  name: string;
  color: string;
  starIds: string[];
  createdAt: number;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}

export interface StarStoreState {
  stars: StarData[];
  selectedStar: StarData | null;
  highlightedStarId: string | null;
  searchQuery: string;
  setSelectedStar: (star: StarData | null) => void;
  setHighlightedStarId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  flyToStar: (star: StarData) => void;
  isFlying: boolean;
  setIsFlying: (flying: boolean) => void;
  cameraTarget: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
  setCameraPosition: (pos: { x: number; y: number; z: number }) => void;
  setCameraTarget: (pos: { x: number; y: number; z: number }) => void;
}

export type { StarCluster as StarClusterType };

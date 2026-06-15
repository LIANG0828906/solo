export interface StarData {
  id: string;
  ancientName: string;
  modernName: string;
  x: number;
  y: number;
  magnitude: number;
  constellationId: string;
  color: string;
  size: number;
}

export interface ConstellationData {
  id: string;
  name: string;
  stars: string[];
  connections: [number, number][];
  guardian: string;
  division: string;
  starCount: number;
  description: string;
}

export interface StarTableItem {
  starId: string;
  order: number;
}

export interface StarMapState {
  selectedConstellation: string | null;
  hoveredStar: string | null;
  starTable: StarTableItem[];
  customConnections: [number, number][];
  setSelectedConstellation: (id: string | null) => void;
  setHoveredStar: (id: string | null) => void;
  addStarToTable: (starId: string) => void;
  removeStarFromTable: (starId: string) => void;
  reorderStarTable: (items: StarTableItem[]) => void;
  clearStarTable: () => void;
  updateCustomConnections: (connections: [number, number][]) => void;
}

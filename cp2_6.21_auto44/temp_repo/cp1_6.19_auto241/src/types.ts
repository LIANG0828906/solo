export type TerrainType = 'mountain' | 'plain' | 'depression';

export type ViewMode = 'normal' | 'heightmap' | 'vector';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  diameter: number;
  color: string;
  opacity: number;
  isEvaporating: boolean;
  isInfiltrated: boolean;
  terrainType: TerrainType | null;
  trail: { x: number; y: number; width: number }[];
  createdAt: number;
  lastEvaporationCheck: number;
}

export interface TerrainCell {
  type: TerrainType;
  height: number;
  permeability: number;
}

export type TerrainMap = TerrainCell[][];

export interface Statistics {
  totalRainfall: number;
  totalEvaporated: number;
  totalInfiltrated: number;
  activeParticles: number;
}

export interface SimulationParams {
  permeability: number;
  evaporationRate: number;
  rainfallIntensity: number;
}

export interface SimulationState extends SimulationParams, Statistics {
  viewMode: ViewMode;
  isRaining: boolean;
  setPermeability: (v: number) => void;
  setEvaporationRate: (v: number) => void;
  setRainfallIntensity: (v: number) => void;
  triggerRainfall: () => void;
  updateStats: (stats: Partial<Statistics>) => void;
  setViewMode: (mode: ViewMode) => void;
  setIsRaining: (raining: boolean) => void;
  reset: () => void;
}

export const TERRAIN_CONFIG: Record<TerrainType, { permeability: number; height: number; color: string }> = {
  mountain: { permeability: 0.2, height: 0.8, color: '#8B7355' },
  plain: { permeability: 0.5, height: 0.5, color: '#D4C4A8' },
  depression: { permeability: 0.9, height: 0.2, color: '#C4A882' },
};

export const HEIGHTMAP_COLORS = {
  low: '#E8DCC4',
  high: '#5D4037',
};

export const VECTOR_COLORS = {
  slow: '#3498DB',
  fast: '#E74C3C',
};

export const PARTICLE_CONFIG = {
  initialDiameter: 6,
  initialColor: '#4A90D9',
  initialOpacity: 0.7,
  infiltratedDiameter: 1,
  infiltratedColor: '#B0C4DE',
  evaporatedColor: '#FFFFFF',
  trailColor: '#7EC8E3',
  trailWidth: 2,
  minSpeed: 2,
  maxSpeed: 4,
  maxTrailLength: 30,
  maxParticles: 200,
  evaporationInterval: 3000,
  evaporationBaseProbability: 0.1,
};

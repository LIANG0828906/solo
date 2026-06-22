export type SeedType = 'vine' | 'mushroom' | 'glowmoss';

export type PlantState = 'growing' | 'mature' | 'wrapped' | 'parasitized' | 'symbiotic' | 'clearing';

export interface Point {
  x: number;
  y: number;
}

export interface BranchNode {
  start: Point;
  end: Point;
  angle: number;
  length: number;
  thickness: number;
  hasLeaf: boolean;
  leafAngle: number;
  growthProgress: number;
  startThreshold: number;
}

export interface MushroomStructure {
  center: Point;
  capRadius: number;
  stemHeight: number;
  brightness: number;
  dots: Point[];
}

export interface GlowMossStructure {
  center: Point;
  radius: number;
  opacity: number;
  color: { r: number; g: number; b: number };
  expansion: number;
}

export interface Plant {
  id: string;
  type: SeedType;
  gridX: number;
  gridY: number;
  position: Point;
  state: PlantState;
  growthTime: number;
  maxGrowthTime: number;
  opacity: number;
  scale: number;
  vineBranches?: BranchNode[];
  mushroom?: MushroomStructure;
  glowmoss?: GlowMossStructure;
  interactedWith: Set<string>;
  stateTimer: number;
  leafOffsets: Map<number, Point>;
  reverseProgress?: number;
}

export interface Particle {
  id: string;
  position: Point;
  velocity: Point;
  color: { r: number; g: number; b: number };
  size: number;
  life: number;
  maxLife: number;
}

export interface Halo {
  position: Point;
  radius: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: { r: number; g: number; b: number };
}

export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const GRID_COLS = 20;
export const GRID_ROWS = 14;
export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 700;
export const CELL_WIDTH = CANVAS_WIDTH / GRID_COLS;
export const CELL_HEIGHT = CANVAS_HEIGHT / GRID_ROWS;
export const MAX_PLANTS = 20;
export const MAX_PARTICLES = 200;
export const PARTICLE_LIFE = 1.5;
export const HALO_LIFE = 0.3;
export const COLLISION_INTERVAL = 5;

export const SEED_COLORS: Record<SeedType, { r: number; g: number; b: number; hex: string }> = {
  vine: { r: 76, g: 175, b: 80, hex: '#4CAF50' },
  mushroom: { r: 255, g: 87, b: 34, hex: '#FF5722' },
  glowmoss: { r: 129, g: 212, b: 250, hex: '#81D4FA' }
};

export const SEED_NAMES: Record<SeedType, string> = {
  vine: '藤蔓种子',
  mushroom: '蘑菇种子',
  glowmoss: '光藓种子'
};

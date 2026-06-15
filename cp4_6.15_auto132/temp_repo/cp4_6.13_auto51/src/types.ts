export interface Position {
  x: number;
  y: number;
}

export interface Resources {
  water: number;
  food: number;
  gold: number;
  morale: number;
}

export type TileType = 'sand' | 'oasis' | 'oasis_edge' | 'outpost';

export interface Tile {
  type: TileType;
  pos: Position;
  inSandstorm: boolean;
  hasFog: boolean;
}

export type CargoType = 'water' | 'food' | 'crafts';

export interface Route {
  path: Position[];
  totalDays: number;
  dangerLevel: number;
}

export interface Outpost {
  id: string;
  name: string;
  pos: Position;
  isMain: boolean;
  isEnabled: boolean;
  isDried: boolean;
  driedDays: number;
  lastCollectDay: number;
  collectAnimText?: string;
  collectAnimKey?: number;
}

export interface Caravan {
  id: string;
  pos: Position;
  renderPos: { x: number; y: number };
  fromPos: Position;
  toPos: Position;
  route: Route;
  routeIndex: number;
  cargo: CargoType;
  cargoAmount: Resources;
  morale: number;
  isBuilding: boolean;
  daysDelayed: number;
  animProgress: number;
  reachedDestination?: boolean;
}

export type EventType = 'sandstorm' | 'drought' | 'bandits';

export interface EventOption {
  label: string;
  action: () => void;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  icon: string;
  options: EventOption[];
  targetOutpostId?: string;
  targetCaravanId?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface CampState {
  day: number;
  resources: Resources;
  outposts: Outpost[];
  caravans: Caravan[];
  map: Tile[][];
  currentEvent: GameEvent | null;
  resourceHistory: { water: number[]; food: number[]; gold: number[]; morale: number[] };
  particles: Particle[];
  fireworks: Particle[];
}

export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 40;
export const TILE_PX = 16;

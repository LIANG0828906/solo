export type ShipType = 'scout' | 'capital' | 'carrier';
export type AIStrategy = 'balanced' | 'aggressive' | 'defensive';
export type Faction = 'blue' | 'red';
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface ShipConfig {
  id: string;
  type: ShipType;
  faction: Faction;
  name: string;
}

export interface FleetConfig {
  faction: Faction;
  ships: ShipConfig[];
  aiStrategy?: AIStrategy;
}

export interface BattleTemplate {
  id: string;
  name: string;
  createdAt: number;
  blueFleet: FleetConfig;
  redFleet: FleetConfig;
}

export interface ShipStats {
  speed: number;
  shield: number;
  damage: number;
  gatherRate: number;
  range: number;
}

export const SHIP_STATS: Record<ShipType, ShipStats> = {
  scout: { speed: 120, shield: 50, damage: 8, gatherRate: 5, range: 150 },
  capital: { speed: 60, shield: 200, damage: 25, gatherRate: 2, range: 250 },
  carrier: { speed: 40, shield: 150, damage: 15, gatherRate: 8, range: 200 },
};

export const SHIP_COLORS: Record<ShipType, string> = {
  scout: '#22d3ee',
  capital: '#4a7dff',
  carrier: '#8b5cf6',
};

export const FACTION_COLORS: Record<Faction, string> = {
  blue: '#4a7dff',
  red: '#ef4444',
};

export interface ShipState {
  id: string;
  type: ShipType;
  faction: Faction;
  x: number;
  y: number;
  angle: number;
  shield: number;
  maxShield: number;
  targetId: string | null;
  gatheringFrom: string | null;
  lastFireTime: number;
  trail: { x: number; y: number; age: number }[];
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  faction: Faction;
  targetId: string;
  life: number;
}

export interface ResourcePoint {
  id: string;
  x: number;
  y: number;
  resourceAmount: number;
  maxResource: number;
  beingGatheredBy: string[];
  pulsePhase: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameStateFrame {
  frameNumber: number;
  timestamp: number;
  ships: ShipState[];
  projectiles: Projectile[];
  resourcePoints: ResourcePoint[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  blueResources: number;
  redResources: number;
  status: SimulationStatus;
}

export interface SimulationResult {
  simulationId: string;
  startTime: number;
  endTime: number;
  duration: number;
  winner: Faction | 'draw';
  blueStats: {
    survived: number;
    totalShips: number;
    totalDamage: number;
    resourcesGathered: number;
  };
  redStats: {
    survived: number;
    totalShips: number;
    totalDamage: number;
    resourcesGathered: number;
  };
  resourceHistory: { time: number; blue: number; red: number }[];
  aiHeatmap: { x: number; y: number; intensity: number }[];
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export const MAP_SIZE = 4000;
export const TICK_RATE = 60;
export const TICK_INTERVAL = 1000 / TICK_RATE;

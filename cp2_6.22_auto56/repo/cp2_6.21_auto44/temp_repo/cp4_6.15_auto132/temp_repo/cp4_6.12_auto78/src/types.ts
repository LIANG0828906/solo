export type OreGrade = 'common' | 'rare' | 'legendary';
export type ShipType = 'player' | 'ai_miner' | 'pirate';
export type ProjectileType = 'laser' | 'missile' | 'pirate_bullet';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  position: Vector2;
  velocity: Vector2;
  angle: number;
  health: number;
  inventory: { [grade in OreGrade]: number };
  totalValue: number;
  lastAttackTime: number;
  lastMissileTime: number;
  nickname: string;
  targetAsteroidId: string | null;
  formationOffset: Vector2 | null;
}

export interface Asteroid {
  id: string;
  position: Vector2;
  radius: number;
  grade: OreGrade;
  rotation: number;
  rotationSpeed: number;
  vertices: Vector2[];
  flashCount: number;
  isFlashing: boolean;
  flashTimer: number;
  hovered: boolean;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  trail: boolean;
}

export interface Projectile {
  id: string;
  position: Vector2;
  velocity: Vector2;
  type: ProjectileType;
  damage: number;
  life: number;
  maxLife: number;
  ownerId: string;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxLayer: number;
}

export interface ORE_CONFIG {
  color: string;
  value: number;
  name: string;
}

export interface RankingEntry {
  id: string;
  nickname: string;
  totalValue: number;
  rank: number;
  previousRank: number;
  flashTimer: number;
}

export type GameScene = 'menu' | 'customize' | 'playing' | 'gameover' | 'achievements';

export type WeaponType = 'laser' | 'scatter' | 'rapid';
export type ShieldType = 'damage' | 'reflect' | 'armor';
export type EngineType = 'speed' | 'dodge' | 'boost';

export type PartLevel = 1 | 2 | 3;

export interface ShipBuild {
  id: string;
  name: string;
  weapon: { type: WeaponType; level: PartLevel };
  shield: { type: ShieldType; level: PartLevel };
  engine: { type: EngineType; level: PartLevel };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  date: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'explosion' | 'engine' | 'boss' | 'star';
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  isInvincible: boolean;
  invincibleTimer: number;
  fireRate: number;
  lastFireTime: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  color: string;
  type: 'normal' | 'fast' | 'tank';
  zigzagOffset: number;
  zigzagSpeed: number;
  lastFireTime: number;
  fireRate: number;
  points: number;
}

export interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  pattern: 'scatter' | 'homing' | 'fan';
  patternTimer: number;
  patternDuration: number;
  lastFireTime: number;
  fireRate: number;
  rotation: number;
  active: boolean;
  points: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  isPlayerBullet: boolean;
  isHoming?: boolean;
  targetX?: number;
  targetY?: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinkleSpeed: number;
}

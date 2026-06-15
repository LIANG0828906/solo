export interface HexCoord {
  q: number;
  r: number;
}

export type TowerType = 'frost' | 'fire' | 'lightning';
export type TowerLevel = 1 | 2 | 3;
export type MonsterType = 'normal' | 'elite';
export type ElementType = 'frost' | 'fire' | 'lightning' | 'none';
export type ParticleType = 'frost' | 'fire' | 'lightning' | 'build' | 'upgrade' | 'damage';
export type GamePhase = 'preparing' | 'playing' | 'waveComplete' | 'gameOver' | 'victory';

export interface Tower {
  id: string;
  type: TowerType;
  level: TowerLevel;
  position: HexCoord;
  pixelPosition: { x: number; y: number };
  cooldown: number;
  buildAnimation: number;
  upgradeAnimation: number;
  rangeAnimation: number;
}

export interface Monster {
  id: string;
  type: MonsterType;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  pathProgress: number;
  position: { x: number; y: number };
  resistances: Record<ElementType, number>;
  effects: {
    frost: { remaining: number; slowFactor: number };
    fire: { remaining: number; damagePerSecond: number };
    lightning: { remaining: number };
  };
  trail: Array<{ x: number; y: number; alpha: number }>;
  hitFlash: number;
}

export interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface TowerEffect {
  type: 'slow' | 'burn' | 'stun';
  factor?: number;
  duration: number;
  damagePerSecond?: number;
  chance?: number;
  aoeRadius?: number;
}

export interface TowerConfig {
  name: string;
  cost: number;
  damage: number;
  range: number;
  cooldown: number;
  color: string;
  darkColor: string;
  effect: TowerEffect;
  upgradeCosts: [number, number, number];
}

export interface MonsterConfig {
  health: number;
  speed: number;
  reward: number;
  resistances: Record<ElementType, number>;
}

export interface WaveConfig {
  waveNumber: number;
  monsterCount: number;
  spawnInterval: number;
  eliteChance: number;
  healthMultiplier: number;
  speedMultiplier: number;
}

export interface GameState {
  phase: GamePhase;
  currentWave: number;
  totalWaves: number;
  waveCountdown: number;
  lives: number;
  maxLives: number;
  energy: number;
  towers: Tower[];
  monsters: Monster[];
  particles: Particle[];
  path: HexCoord[];
  selectedTowerType: TowerType | null;
  selectedTower: Tower | null;
  hoveredCell: HexCoord | null;
  kills: number;
  totalDamageDealt: number;
  spawnTimer: number;
  monstersToSpawn: number;
  warningFlash: number;
}

export interface AttackLine {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  life: number;
}

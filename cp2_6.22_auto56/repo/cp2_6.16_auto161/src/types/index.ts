export type BeeType = 'collector' | 'scout' | 'guardian';

export type BeeState = 'idle' | 'moving' | 'collecting' | 'scouting' | 'patrolling' | 'attacking' | 'returning';

export type EnemyType = 'wasp' | 'bumblebee' | 'hornet';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';

export interface Position {
  x: number;
  y: number;
}

export interface Bee {
  id: string;
  type: BeeType;
  position: Position;
  targetPosition: Position | null;
  state: BeeState;
  health: number;
  maxHealth: number;
  path: Position[];
  pathIndex: number;
  speed: number;
  carryHoney: number;
  maxCarry: number;
  targetFlowerId: string | null;
  targetEnemyId: string | null;
  attackCooldown: number;
  patrolAngle: number;
}

export interface Flower {
  id: string;
  position: Position;
  honeyAmount: number;
  maxHoney: number;
  color: string;
  rotation: number;
  discovered: boolean;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  hitFlash: number;
  knockback: Position;
}

export interface Hive {
  position: Position;
  level: number;
  maxLevel: number;
  honey: number;
  maxHoney: number;
  shield: number;
  maxShield: number;
  beeSlots: number;
  usedBeeSlots: number;
  defenseTowers: number;
  upgradeCosts: number[];
  glowRadius: number;
  glowPhase: number;
  upgradeAnimation: number;
}

export interface Particle {
  id: string;
  position: Position;
  velocity: Position;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  phase: GamePhase;
  wave: number;
  waveTimer: number;
  waveInterval: number;
  hive: Hive;
  bees: Bee[];
  flowers: Flower[];
  enemies: Enemy[];
  particles: Particle[];
  selectedBeeType: BeeType | null;
  hoveredEntityId: string | null;
  hoveredEntityType: 'flower' | 'enemy' | null;
  mousePosition: Position;
  cameraZoom: number;
  cameraOffset: Position;
  mapSize: { width: number; height: number };
  discoveredAreas: Set<string>;
  lastFrameTime: number;
  fps: number;
}

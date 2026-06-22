export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type TowerType = 'red' | 'blue' | 'yellow';

export interface TowerData {
  id: string;
  positionId: string;
  type: TowerType;
  level: number;
  position: Vector2;
  rotation: number;
}

export interface MirrorData {
  id: string;
  position: Vector2;
  rotation: number;
}

export interface PrismData {
  id: string;
  position: Vector2;
  rotation: number;
}

export type MonsterType = 'normal' | 'fast' | 'tank' | 'shield' | 'boss';

export interface MonsterData {
  id: string;
  type: MonsterType;
  position: Vector2;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  baseSpeed: number;
  pathIndex: number;
  pathProgress: number;
  isSlowed: boolean;
  slowTimer: number;
  scale: number;
}

export interface LightBeam {
  id: string;
  start: Vector2;
  direction: Vector2;
  color: string;
  intensity: number;
  type: TowerType;
  bounces: number;
  isAmplified: boolean;
}

export interface BeamSegment {
  start: Vector2;
  end: Vector2;
  color: string;
  intensity: number;
  type: TowerType;
}

export interface Particle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface WaveConfig {
  waveNumber: number;
  monsters: {
    type: MonsterType;
    count: number;
    delay: number;
  }[];
  isBoss?: boolean;
}

export interface LevelData {
  id: string;
  name: string;
  pathPoints: Vector2[];
  towerPositions: {
    id: string;
    x: number;
    y: number;
    type: 'tower' | 'mirror';
  }[];
  waves: WaveConfig[];
  startEnergy: number;
}

export interface PlayerState {
  energy: number;
  towers: TowerData[];
  score: number;
  monstersKilled: number;
}

export type GameState = 'idle' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface GameEvents {
  'tower:placed': { tower: TowerData };
  'tower:upgraded': { towerId: string; level: number };
  'monster:spawned': { monster: MonsterData };
  'monster:hit': { monsterId: string; damage: number; type: TowerType };
  'monster:killed': { monster: MonsterData };
  'monster:reachedEnd': { monster: MonsterData };
  'beam:hit': { position: Vector2; color: string };
  'wave:start': { waveNumber: number };
  'wave:complete': { waveNumber: number };
  'boss:appear': {};
  'boss:killed': {};
  'energy:changed': { energy: number };
  'game:stateChange': { state: GameState };
  'particle:explosion': { position: Vector2; color: string; count?: number };
  'mirror:rotate': { mirrorId: string; rotation: number };
  'tower:place': { positionId: string; type: TowerType };
  'tower:aimAt': { position: Vector2 };
}

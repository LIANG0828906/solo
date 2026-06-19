export const TILE_SIZE = 60;
export const GRID_SIZE = 10;
export const CANVAS_SIZE = TILE_SIZE * GRID_SIZE;

export const PLAYER_SIZE = 32;
export const MONSTER_SIZE = 28;

export const TORCH_RADIUS = 120;
export const LANTERN_RADIUS = 100;
export const VISION_RATIO = 0.8;

export type TileType = 'wall' | 'floor' | 'room' | 'corridor' | 'exit';

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  walkable: boolean;
}

export interface Torch {
  id: string;
  position: Position;
  radius: number;
  color: string;
}

export type LightZoneType = 'bright' | 'dim' | 'dark';

export interface LightingData {
  gridLight: number[][];
  lightZones: LightZoneType[][];
}

export type PlayerState = 'bright' | 'dim' | 'dark';

export interface Player {
  id: string;
  position: Position;
  targetPosition: Position | null;
  health: number;
  maxHealth: number;
  attack: number;
  state: PlayerState;
  lightIntensity: number;
  defeatedCount: number;
  movingProgress: number;
  speed: number;
  hasLantern: boolean;
}

export type MonsterType = 'lightChaser' | 'darkChaser';
export type MonsterState = 'patrolling' | 'chasing' | 'retreating' | 'cooldown';

export interface Monster {
  id: string;
  type: MonsterType;
  position: Position;
  targetPosition: Position | null;
  state: MonsterState;
  health: number;
  maxHealth: number;
  speed: number;
  movingProgress: number;
  cooldownTimer: number;
  retreatSteps: number;
  patrolTarget: Position | null;
  bubbleText: string | null;
  bubbleTimer: number;
  alive: boolean;
}

export type GamePhase = 'playing' | 'victory' | 'defeat';

export interface GameState {
  map: Tile[][];
  player: Player;
  monsters: Monster[];
  torches: Torch[];
  exitPosition: Position;
  phase: GamePhase;
  battleAnimation: BattleAnimation | null;
  time: number;
}

export interface BattleAnimation {
  active: boolean;
  progress: number;
  monsterId: string;
  playerShake: number;
  monsterShake: number;
}

export interface AudioManager {
  context: AudioContext | null;
  playSound: (type: 'move' | 'battle' | 'victory' | 'defeat' | 'stateChange' | 'monsterDeath') => void;
}

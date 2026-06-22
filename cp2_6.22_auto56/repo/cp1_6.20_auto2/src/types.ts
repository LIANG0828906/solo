export const CONFIG = {
  MAP_MIN_SIZE: 10,
  MAP_MAX_SIZE: 20,
  MIN_ROOMS: 3,
  ENEMY_MIN_COUNT: 3,
  ENEMY_MAX_COUNT: 5,
  CHEST_MIN_COUNT: 1,
  CHEST_MAX_COUNT: 2,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_BASE_ATTACK: 10,
  ENEMY_HEALTH: 20,
  ENEMY_ATTACK: 5,
  PLAYER_MOVE_COOLDOWN: 200,
  MOVE_ANIMATION_DURATION: 100,
  PARTICLE_COUNT: 20,
  PARTICLE_DURATION: 800,
  COMBAT_FLASH_DURATION: 200,
  DAMAGE_NUMBER_DURATION: 800,
  HEALTH_POTION_RESTORE: 30,
  CHEST_POTION_RESTORE: 50,
  WEAPON_ATTACK_BONUS: 5,
  COIN_MIN: 10,
  COIN_MAX: 30,
  EXP_PER_KILL: 20,
  HEALTH_POTION_DROP_CHANCE: 0.1,
  TILE_SIZE: 32,
  ASPECT_RATIO: 16 / 9,
  CANVAS_PADDING: 10,
} as const;

export const COLORS = {
  BACKGROUND: '#222222',
  WALL: '#444444',
  FLOOR: '#888888',
  PLAYER: '#FFD700',
  ENEMY: '#C0392B',
  CHEST: '#E67E22',
  EXIT: '#2ECC71',
  TEXT: '#FFFFFF',
  HUD_BG: 'rgba(0, 0, 0, 0.7)',
  COMBAT_FLASH: 'rgba(192, 57, 43, 0.3)',
  PARTICLE_GOLD: '#FFD700',
  PARTICLE_RED: '#C0392B',
} as const;

export interface Position {
  x: number;
  y: number;
}

export enum TileType {
  WALL = 0,
  FLOOR = 1,
  EXIT = 2,
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[];
}

export interface PlayerState {
  position: Position;
  targetPosition: Position;
  health: number;
  maxHealth: number;
  attack: number;
  baseAttack: number;
  coins: number;
  experience: number;
  kills: number;
  isMoving: boolean;
  moveStartTime: number;
}

export interface Enemy {
  id: number;
  position: Position;
  targetPosition: Position;
  health: number;
  maxHealth: number;
  attack: number;
  isAlive: boolean;
  isMoving: boolean;
  moveStartTime: number;
  flashStartTime: number;
}

export interface Chest {
  id: number;
  position: Position;
  isOpened: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameStats {
  kills: number;
  coins: number;
  startTime: number;
  totalTime: number;
}

export enum GamePhase {
  PLAYING = 'playing',
  COMBAT = 'combat',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
}

export interface GameState {
  phase: GamePhase;
  dungeon: DungeonMap;
  player: PlayerState;
  enemies: Enemy[];
  chests: Chest[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  stats: GameStats;
  exitPosition: Position;
  combatFlash: number;
  lastInputTime: number;
  currentEnemyInCombat: Enemy | null;
  pickupMessage: string | null;
  pickupMessageTime: number;
}

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

export interface CombatResult {
  enemyDefeated: boolean;
  playerDied: boolean;
  experienceGained: number;
  healthPotionDropped: boolean;
}

export type ChestReward =
  | { type: 'coins'; amount: number }
  | { type: 'weapon'; bonus: number }
  | { type: 'potion'; heal: number };

export enum TileType {
  EMPTY = 0,
  OBSTACLE = 1,
  COVER = 2,
  TRAP = 3,
  CHEST = 4
}

export enum ItemType {
  HEAL = 'heal',
  ATTACK_BOOST = 'attack',
  EXTRA_ACTION = 'action'
}

export enum GamePhase {
  HERO_SELECT = 'hero_select',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  GAME_OVER = 'game_over'
}

export interface MapTile {
  type: TileType;
  revealed: boolean;
  trapTriggered: boolean;
  chestCollected: boolean;
  trapEffectTimer: number;
}

export type GameMap = MapTile[][];

export interface Item {
  type: ItemType;
  name: string;
  icon: string;
}

export interface PlayerStats {
  totalMoves: number;
  totalAttacks: number;
  chestsCollected: number;
}

export interface Player {
  id: 1 | 2;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  renderX: number;
  renderY: number;
  hp: number;
  maxHp: number;
  attack: number;
  baseAttack: number;
  stealth: boolean;
  turnsWithoutMoving: number;
  inventory: Item[];
  stats: PlayerStats;
  color: string;
  heroType: 1 | 2;
  extraAction: boolean;
  alertAction: boolean;
  revealed: boolean;
  revealTimer: number;
  isMoving: boolean;
  moveProgress: number;
  isAttacking: boolean;
  attackProgress: number;
  attackDirection: { x: number; y: number };
  pickupEffect: ItemType | null;
  pickupEffectTimer: number;
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
  active: boolean;
}

export interface Effect {
  type: 'trail' | 'slash' | 'alert' | 'pickup' | 'stealth' | 'reveal';
  x: number;
  y: number;
  duration: number;
  elapsed: number;
  playerId: 1 | 2;
  data?: {
    direction?: { x: number; y: number };
    color?: string;
    itemType?: ItemType;
  };
}

export interface GameState {
  phase: GamePhase;
  currentPlayer: 1 | 2;
  turnCount: number;
  map: GameMap;
  players: [Player, Player];
  particles: Particle[];
  effects: Effect[];
  moveRange: { x: number; y: number }[];
  hasActed: boolean;
  alertSoundPlaying: boolean;
  selectedHeroes: [number, number];
  countdownNumber: number;
  countdownTimer: number;
}

export const MAP_SIZE = 15;
export const TILE_SIZE = 72;
export const CANVAS_SIZE = MAP_SIZE * TILE_SIZE;
export const MAX_MOVE_DISTANCE = 3;
export const STEALTH_TURNS_REQUIRED = 2;
export const TRAP_REVEAL_DURATION = 10000;
export const TRAP_EFFECT_DURATION = 5000;
export const ALERT_BLINK_INTERVAL = 200;
export const PICKUP_EFFECT_DURATION = 2000;
export const MOVE_ANIMATION_DURATION = 300;
export const ATTACK_ANIMATION_DURATION = 500;

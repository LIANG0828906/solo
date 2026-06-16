export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'LEADERBOARD' | 'TRANSITION';

export type TileType = 'WALL' | 'FLOOR' | 'DOOR' | 'PORTAL';

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  roomId?: number;
  glowPhase?: number;
}

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  connected: boolean;
}

export type EntityType = 'PLAYER' | 'SLIME' | 'SKELETON' | 'BAT';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  attack: number;
  defense: number;
  direction: Direction;
  lastMoveTime: number;
  isAttacking: boolean;
  attackStartTime: number;
  animPhase: number;
  splitPhase?: number;
  targetX?: number;
  targetY?: number;
  lastAiUpdate?: number;
}

export type DropType = 'COIN' | 'EQUIPMENT';
export type Rarity = 'COMMON' | 'RARE' | 'LEGENDARY';
export type EquipmentType = 'SWORD' | 'AXE' | 'BOW' | 'HELMET' | 'CHESTPLATE' | 'BOOTS';
export type EquipmentSlot = 'WEAPON' | 'ARMOR';

export interface Equipment {
  id: string;
  type: EquipmentType;
  slot: EquipmentSlot;
  name: string;
  rarity: Rarity;
  attack: number;
  attackSpeed: number;
  range: number;
  defense: number;
  moveSpeed: number;
}

export interface Drop {
  id: string;
  type: DropType;
  x: number;
  y: number;
  value: number;
  equipment?: Equipment;
  animPhase: number;
  collected: boolean;
}

export interface Chest {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  equipment?: Equipment;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  startTime: number;
}

export interface PlayerState {
  entity: Entity;
  gold: number;
  floor: number;
  monstersKilled: number;
  maxDamage: number;
  equippedWeapon: Equipment | null;
  equippedArmor: Equipment | null;
}

export interface GameMap {
  width: number;
  height: number;
  tileSize: number;
  tiles: Tile[][];
  rooms: Room[];
  portal: { x: number; y: number };
}

export interface GameStats {
  id: string;
  floor: number;
  monstersKilled: number;
  gold: number;
  maxDamage: number;
  timestamp: number;
}

export interface AttackEffect {
  x: number;
  y: number;
  direction: Direction;
  startTime: number;
  duration: number;
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

export const TILE_SIZE = 32;
export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 40;
export const MOVE_COOLDOWN = 150;
export const ATTACK_DURATION = 200;

export const RARITY_COLORS: Record<Rarity, string> = {
  COMMON: '#FFFFFF',
  RARE: '#4A9EFF',
  LEGENDARY: '#FFD700'
};

export const COLORS = {
  BACKGROUND: '#1A1220',
  WALL: '#3A2A4A',
  FLOOR: '#2A1A30',
  DOOR_GLOW: '#FFD700',
  PLAYER: '#4A9EFF',
  PLAYER_CAPE: '#2563EB',
  SLIME: '#4ADE80',
  SKELETON: '#9CA3AF',
  BAT: '#7F1D1D',
  COIN: '#FFD700',
  PORTAL: '#A855F7',
  HEALTH_GREEN: '#22C55E',
  HEALTH_YELLOW: '#EAB308',
  HEALTH_RED: '#EF4444',
  UI_BG: 'rgba(26, 18, 32, 0.85)',
  GLASS_BG: 'rgba(255, 255, 255, 0.1)'
};

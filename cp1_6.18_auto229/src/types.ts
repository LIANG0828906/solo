export type ElementType = 'fire' | 'ice' | 'electric' | 'none';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Crystal {
  element: ElementType;
  energy: number;
  maxEnergy: number;
  level: number;
  skills: Skill[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  runeCount: number;
}

export interface Rune {
  angle: number;
  orbitRadius: number;
  speed: number;
  element: ElementType;
}

export interface Monster {
  id: number;
  position: Position;
  velocity: Position;
  element: ElementType;
  color: string;
  shape: 'triangle' | 'square' | 'pentagon' | 'hexagon';
  size: number;
  health: number;
  maxHealth: number;
  speed: number;
  lastAttackTime: number;
}

export type ParticleType = 'trail' | 'explosion' | 'shard' | 'rune';

export interface Particle {
  id: number;
  position: Position;
  velocity: Position;
  size: number;
  color: string;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  type: ParticleType;
  gravity?: number;
  rotation?: number;
  rotationSpeed?: number;
  element?: ElementType;
  blinkPhase?: number;
}

export interface ElementBadge {
  element: ElementType;
  scale: number;
  opacity: number;
  duration: number;
  maxDuration: number;
  phase: 'scaleUp' | 'scaleDown' | 'fade';
}

export interface Shard {
  id: number;
  position: Position;
  element: ElementType;
  color: string;
  size: number;
  blinkPhase: number;
  blinkSpeed: number;
  collected: boolean;
}

export interface Player {
  position: Position;
  velocity: Position;
  activeElement: ElementType;
  color: string;
  targetColor: string;
  colorTransitionTime: number;
  colorTransitionProgress: number;
  health: number;
  maxHealth: number;
  crystals: Crystal[];
  runes: Rune[];
  invincible: boolean;
  invincibleTime: number;
}

export interface Tile {
  x: number;
  y: number;
  type: 'floor' | 'wall';
  color: string;
}

export interface Room {
  width: number;
  height: number;
  tiles: Tile[][];
  walls: { x: number; y: number; width: number; height: number }[];
}

export interface UIState {
  showModal: boolean;
  modalContent: string;
  modalScale: number;
  modalOpacity: number;
  modalPhase: 'enter' | 'visible' | 'exit';
  modalTimer: number;
}

export const GRID_SIZE = 35;
export const TILE_SIZE = 20;
export const ROOM_SIZE = GRID_SIZE * TILE_SIZE;
export const PLAYER_SIZE = 12;
export const WALL_THICKNESS = 6;
export const MAX_PARTICLES = 200;
export const TARGET_FPS = 60;
export const FRAME_TIME = 1000 / TARGET_FPS;

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF4500',
  ice: '#00CED1',
  electric: '#FFD700',
  none: '#FFFFFF'
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火',
  ice: '冰',
  electric: '电',
  none: '无'
};

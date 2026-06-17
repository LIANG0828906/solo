export type ElementType = 'fire' | 'water' | 'nature';

export type Owner = 'player' | 'enemy';

export type GamePhase = 'preparation' | 'battling' | 'finished';

export interface Card {
  id: string;
  element: ElementType;
  name: string;
  attack: number;
  health: number;
}

export interface Sprite {
  id: string;
  element: ElementType;
  owner: Owner;
  attack: number;
  maxHealth: number;
  currentHealth: number;
  gridX: number;
  gridY: number;
  isAppearing: boolean;
  isShaking: boolean;
  isFading: boolean;
  particles: Particle[];
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
}

export interface GridCell {
  x: number;
  y: number;
  spriteId: string | null;
}

export interface GameState {
  hand: Card[];
  grid: GridCell[][];
  sprites: Sprite[];
  playerGold: number;
  enemyGold: number;
  phase: GamePhase;
  turnCount: number;
  turnTimer: number;
  winner: Owner | null;
}

export const GRID_SIZE = 6;
export const PLAYER_ROWS = [4, 5];
export const ENEMY_ROWS = [0, 1];
export const MAX_BATTLE_ROUNDS = 20;

export const ELEMENT_EMOJI: Record<ElementType, string> = {
  fire: '🔥',
  water: '💧',
  nature: '🌿',
};

export const ELEMENT_COLORS: Record<ElementType, { primary: string; secondary: string }> = {
  fire: { primary: '#FF4500', secondary: '#FFD700' },
  water: { primary: '#00BFFF', secondary: '#1E90FF' },
  nature: { primary: '#32CD32', secondary: '#228B22' },
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '烈焰精灵',
  water: '水流精灵',
  nature: '自然精灵',
};

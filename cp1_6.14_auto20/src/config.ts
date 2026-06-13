import type { TerrainType, Unit } from './types';

export const HEX_SIZE = 36;
export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 15;

export const TERRAIN_COST: Record<TerrainType, number> = {
  grass: 1,
  stone: 2,
  water: 3,
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  grass: '#4A7C39',
  stone: '#8B7355',
  water: '#3B6EA8',
};

export const TERRAIN_GRADIENTS: Record<TerrainType, string> = {
  grass: 'linear-gradient(135deg, #5A8C49 0%, #3A6C29 100%)',
  stone: 'linear-gradient(135deg, #9B8365 0%, #6B5345 100%)',
  water: 'linear-gradient(135deg, #4B7EB8 0%, #2B5E98 100%)',
};

export const THEME = {
  primary: '#2D1F14',
  secondary: '#C9A227',
  accent: '#E8DCC4',
  danger: '#8B2500',
  success: '#2E7D32',
  text: '#E8DCC4',
  textMuted: '#A89070',
  border: '#C9A227',
  background: '#1A120B',
  panelBg: 'rgba(45, 31, 20, 0.95)',
} as const;

export const DEFAULT_PLAYER_UNIT: Omit<Unit, 'id' | 'position'> = {
  name: '冒险者',
  race: '人类',
  level: 5,
  hp: 50,
  maxHp: 50,
  armor: 15,
  movement: 6,
  strength: 14,
  agility: 12,
  intelligence: 10,
  type: 'player',
  isDead: false,
};

export const DEFAULT_ENEMY_UNIT: Omit<Unit, 'id' | 'position'> = {
  name: '哥布林',
  race: '哥布林',
  level: 3,
  hp: 25,
  maxHp: 25,
  armor: 12,
  movement: 5,
  strength: 10,
  agility: 14,
  intelligence: 8,
  type: 'enemy',
  isDead: false,
};

export const ANIMATION_DURATION = 300;
export const DRAG_THRESHOLD = 5;

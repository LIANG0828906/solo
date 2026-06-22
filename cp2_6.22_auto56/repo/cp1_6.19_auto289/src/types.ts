export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'destroyer' | 'submarine';

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  name: string;
  emoji: string;
  length: number;
  color: string;
  positions: Position[];
  hits: boolean[];
  isPlaced: boolean;
  isSunk: boolean;
}

export interface Cell {
  x: number;
  y: number;
  hasShip: boolean;
  shipId?: string;
  isHit: boolean;
  isMiss: boolean;
}

export type GamePhase = 'placement' | 'battle' | 'gameOver';
export type Turn = 'player' | 'ai';

export interface ShipConfig {
  type: ShipType;
  name: string;
  emoji: string;
  length: number;
  color: string;
}

export const SHIP_CONFIGS: ShipConfig[] = [
  { type: 'carrier', name: '航母', emoji: '🚢', length: 5, color: '#3498DB' },
  { type: 'battleship', name: '战列舰', emoji: '⚓', length: 4, color: '#E74C3C' },
  { type: 'cruiser', name: '巡洋舰', emoji: '🚤', length: 3, color: '#2ECC71' },
  { type: 'destroyer', name: '驱逐舰', emoji: '🛥️', length: 2, color: '#F39C12' },
  { type: 'submarine', name: '潜艇', emoji: '🔱', length: 1, color: '#9B59B6' },
];

export const GRID_SIZE = 10;
export const CELL_SIZE = 40;

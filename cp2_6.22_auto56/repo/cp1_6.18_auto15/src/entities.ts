export type ElementType = 'fire' | 'ice' | 'wind' | 'earth';
export type PlayerId = 1 | 2;
export type GamePhase = 'setup' | 'playing' | 'ended';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  element: ElementType;
  player: PlayerId;
  hp: number;
  maxHp: number;
  attack: number;
  range: number;
  position: Position;
  killCount: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  element: ElementType;
  avatar: string;
}

export interface BoardCell {
  x: number;
  y: number;
  piece: Piece | null;
}

export type AnimationType = 'attack' | 'hit' | 'victory' | 'particle';

export interface AnimationPayload {
  [key: string]: unknown;
}

export interface Animation {
  id: string;
  type: AnimationType;
  payload: AnimationPayload;
  startTime?: number;
}

export interface GameStatistics {
  totalTurns: number;
  totalDamage: number;
  pieceKills: Record<string, number>;
}

export interface HistoryRecord {
  stateSnapshot: {
    board: BoardCell[][];
    currentPlayer: PlayerId;
    selectedPieceId: string | null;
    statistics: GameStatistics;
  };
  action: string;
  timestamp: number;
}

export interface ElementConfig {
  name: string;
  colorStart: string;
  colorEnd: string;
  particleColor: string;
  hp: number;
  attack: number;
  range: number;
}

export const ELEMENT_CONFIGS: Record<ElementType, ElementConfig> = {
  fire: {
    name: '火',
    colorStart: '#FF4500',
    colorEnd: '#8B0000',
    particleColor: '#FF6347',
    hp: 80,
    attack: 25,
    range: 2,
  },
  ice: {
    name: '冰',
    colorStart: '#00BFFF',
    colorEnd: '#00008B',
    particleColor: '#87CEEB',
    hp: 100,
    attack: 20,
    range: 3,
  },
  wind: {
    name: '风',
    colorStart: '#32CD32',
    colorEnd: '#006400',
    particleColor: '#90EE90',
    hp: 70,
    attack: 22,
    range: 4,
  },
  earth: {
    name: '地',
    colorStart: '#8B4513',
    colorEnd: '#3E2723',
    particleColor: '#D2691E',
    hp: 120,
    attack: 30,
    range: 1,
  },
};

export const PLAYER_COLORS: Record<PlayerId, string> = {
  1: '#4169E1',
  2: '#DC143C',
};

export const BOARD_SIZE = 8;
export const CELL_SIZE = 80;
export const PIECE_SIZE = 60;
export const COUNTDOWN_SECONDS = 30;
export const MAX_HISTORY = 20;

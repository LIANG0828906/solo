export type RuneElement = 'fire' | 'wind' | 'earth' | 'water';
export type PlayerId = 'player1' | 'player2';
export type CellType = 'empty' | 'obstacle' | 'buff' | 'base';
export type GameStatus = 'playing' | 'player1_win' | 'player2_win';

export interface Position {
  x: number;
  y: number;
}

export interface Rune {
  id: string;
  element: RuneElement;
  owner: PlayerId;
  position: Position;
  attack: number;
  maxHp: number;
  currentHp: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface Cell {
  position: Position;
  type: CellType;
  baseOwner?: PlayerId;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  runes: Rune[];
}

export interface GameState {
  boardSize: number;
  cells: Cell[][];
  players: Record<PlayerId, PlayerState>;
  currentTurn: PlayerId;
  turnNumber: number;
  status: GameStatus;
  selectedRuneId: string | null;
}

export interface AttackResult {
  attackerId: string;
  targetId: string;
  damage: number;
  isCritical: boolean;
  targetKilled: boolean;
}

export const ELEMENT_COLORS: Record<RuneElement, { primary: string; secondary: string; border: string }> = {
  fire: { primary: '#FF4500', secondary: '#FF6347', border: '#FF4500' },
  wind: { primary: '#00CED1', secondary: '#40E0D0', border: '#00CED1' },
  earth: { primary: '#8B4513', secondary: '#D2691E', border: '#8B4513' },
  water: { primary: '#1E90FF', secondary: '#00BFFF', border: '#1E90FF' }
};

export const ELEMENT_NAMES: Record<RuneElement, string> = {
  fire: '火',
  wind: '风',
  earth: '土',
  water: '水'
};

export const ELEMENT_ADVANTAGE: Record<RuneElement, RuneElement> = {
  fire: 'wind',
  wind: 'earth',
  earth: 'water',
  water: 'fire'
};

export const RUNE_BASE_STATS: Record<RuneElement, { attack: number; hp: number }> = {
  fire: { attack: 15, hp: 80 },
  wind: { attack: 12, hp: 70 },
  earth: { attack: 10, hp: 100 },
  water: { attack: 13, hp: 85 }
};

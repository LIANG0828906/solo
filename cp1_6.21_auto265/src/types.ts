export type Player = 'player1' | 'player2';

export type CellState = Player | null;

export type BoardState = CellState[][];

export interface PlayerConfig {
  id: Player;
  name: string;
  color: string;
  glowColor: string;
}

export interface GameRecord {
  id: string;
  player1Name: string;
  player2Name: string;
  winner: Player | 'draw';
  timestamp: number;
}

export interface GameStats {
  player1Wins: number;
  player2Wins: number;
}

export type GameStatus = 'playing' | 'player1Win' | 'player2Win' | 'draw';

export type MoveStep = {
  row: number;
  col: number;
  player: Player;
};

export const PLAYER1_CONFIG: PlayerConfig = {
  id: 'player1',
  name: '玩家1',
  color: '#6366F1',
  glowColor: 'rgba(99, 102, 241, 0.6)',
};

export const PLAYER2_CONFIG: PlayerConfig = {
  id: 'player2',
  name: '玩家2',
  color: '#F43F5E',
  glowColor: 'rgba(244, 63, 94, 0.6)',
};

export const WIN_COLOR = '#22C55E';
export const WIN_GLOW = 'rgba(34, 197, 94, 0.7)';

export const WINNING_LINES: [number, number][][] = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

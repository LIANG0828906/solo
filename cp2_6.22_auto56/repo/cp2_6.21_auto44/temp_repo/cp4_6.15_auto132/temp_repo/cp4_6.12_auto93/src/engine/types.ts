export enum CellStatus {
  EMPTY = 'empty',
  SHIP = 'ship',
  HIT = 'hit',
  MISS = 'miss',
  SUNK = 'sunk'
}

export enum GamePhase {
  IDLE = 'idle',
  MATCHING = 'matching',
  PLACING = 'placing',
  WAITING_OPPONENT = 'waiting_opponent',
  BATTLE = 'battle',
  GAME_OVER = 'game_over',
  REPLAY = 'replay'
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

export interface Position {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  name: string;
  size: number;
  health: number;
  positions: Position[];
  orientation: 'horizontal' | 'vertical';
  isPlaced: boolean;
  isSunk: boolean;
}

export interface Player {
  id: string;
  name: string;
  ships: Ship[];
  board: CellStatus[][];
  isReady: boolean;
}

export interface AttackResult {
  row: number;
  col: number;
  isHit: boolean;
  isSunk: boolean;
  sunkShipName?: string;
  isGameOver: boolean;
}

export interface AttackHistoryEntry {
  playerId: string;
  row: number;
  col: number;
  result: AttackResult;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  currentPlayerId: string;
  player: Player;
  opponent: Player;
  turnTimeLeft: number;
  winnerId: string | null;
  attackHistory: AttackHistoryEntry[];
  connectionStatus: ConnectionStatus;
  roomId: string | null;
}

export interface EmoteBubble {
  id: string;
  playerId: string;
  emote: string;
  label: string;
  timestamp: number;
}

export interface PlacingShip {
  ship: Ship;
  mousePosition: Position | null;
  isValid: boolean;
}

export const SHIP_CONFIGS: Omit<Ship, 'positions' | 'isPlaced' | 'isSunk'>[] = [
  { id: 'carrier', name: '航母', size: 5, health: 5, orientation: 'horizontal' },
  { id: 'battleship', name: '战列舰', size: 4, health: 4, orientation: 'horizontal' },
  { id: 'cruiser', name: '巡洋舰', size: 3, health: 3, orientation: 'horizontal' },
  { id: 'destroyer', name: '驱逐舰', size: 2, health: 2, orientation: 'horizontal' },
  { id: 'submarine', name: '潜艇', size: 1, health: 1, orientation: 'horizontal' },
];

export const EMOTES: { emoji: string; label: string }[] = [
  { emoji: '⚓️', label: '轰击' },
  { emoji: '💥', label: '命中' },
  { emoji: '🌊', label: '错过' },
  { emoji: '😤', label: '不服' },
  { emoji: '🏆', label: '胜利' },
  { emoji: '🤝', label: '握手' },
];

export const BOARD_SIZE = 10;
export const TURN_DURATION = 15;
export const RECONNECT_TIMEOUT = 5000;
export const MAX_RECONNECT_ATTEMPTS = 3;

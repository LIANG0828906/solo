export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export type Position = { x: number; y: number };

export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'ended';

export type PlayerColor = 'blue' | 'pink';

export interface PlayerState {
  id: string;
  name: string;
  position: Position;
  direction: Direction;
  color: PlayerColor;
  steps: number;
}

export interface GameStats {
  winnerName: string;
  winnerColor: PlayerColor;
  duration: number;
  winnerSteps: number;
  loserSteps: number;
}

export type ClientMessage =
  | { type: 'CREATE_ROOM'; playerName: string }
  | { type: 'JOIN_ROOM'; roomCode: string; playerName: string }
  | { type: 'PLAYER_INPUT'; direction: Direction; timestamp: number }
  | { type: 'RESTART_GAME' }
  | { type: 'LEAVE_ROOM' };

export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string; playerId: string; color: PlayerColor }
  | { type: 'ROOM_JOINED'; roomCode: string; playerId: string; color: PlayerColor; opponentName: string }
  | { type: 'WAITING_FOR_OPPONENT' }
  | { type: 'OPPONENT_JOINED'; opponentName: string }
  | { type: 'GAME_START'; maze: number[][]; player1Pos: Position; player2Pos: Position; countdown: number }
  | { type: 'GAME_STATE'; players: PlayerState[]; gameStatus: GameStatus; timestamp: number }
  | { type: 'PLAYER_MOVE'; playerId: string; position: Position; direction: Direction }
  | { type: 'COLLISION'; playerId: string; position: Position }
  | { type: 'GAME_END'; winner: string; stats: GameStats }
  | { type: 'COUNTDOWN'; count: number }
  | { type: 'ERROR'; message: string };

export type MazeData = number[][];

export const MAZE_SIZE = 15;
export const CELL_WALL = 1;
export const CELL_PATH = 0;

export const COLORS = {
  BACKGROUND: 0x0d0221,
  BG_DARK: 0x05010f,
  BG_MID: 0x1a0a2e,
  BG_LIGHT: 0x2d1b4e,
  NEON_BLUE: 0x00f0ff,
  NEON_PINK: 0xff00ff,
  WALL_BLUE: 0x00f0ff,
  WALL_PINK: 0xff00ff,
  FLOOR: 0x1a0a2e,
  PLAYER_BLUE: 0x00f0ff,
  PLAYER_PINK: 0xff00ff,
  TEXT: 0xffffff,
  TEXT_DIM: 0x8888aa,
  ERROR: 0xff4444,
  WHITE: 0xffffff
} as const;

export const COLOR_STRINGS = {
  BACKGROUND: '#0d0221',
  BG_DARK: '#05010f',
  BG_MID: '#1a0a2e',
  BG_LIGHT: '#2d1b4e',
  NEON_BLUE: '#00f0ff',
  NEON_PINK: '#ff00ff',
  TEXT: '#ffffff',
  TEXT_DIM: '#8888aa',
  ERROR: '#ff4444'
} as const;

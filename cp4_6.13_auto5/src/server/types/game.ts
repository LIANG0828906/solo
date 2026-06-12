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

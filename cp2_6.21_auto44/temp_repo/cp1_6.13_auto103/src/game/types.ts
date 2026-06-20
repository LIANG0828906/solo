export type CellType = 0 | 1;

export type MazeGrid = CellType[][];

export type PlayerId = 'blue' | 'red';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type TrapType = 'sleep' | 'fence';

export interface Position {
  x: number;
  y: number;
}

export interface Trap {
  id: string;
  type: TrapType;
  position: Position;
  owner: PlayerId;
  triggered: boolean;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  position: Position;
  prevPosition: Position;
  trapsRemaining: number;
  trapTypes: TrapType[];
  sleepTurns: number;
  lockedDirection: Direction | null;
  canMove: boolean;
  stuckTurns: number;
}

export interface GameState {
  gameId: string;
  round: number;
  maze: MazeGrid;
  players: Record<PlayerId, PlayerState>;
  currentPlayer: PlayerId;
  traps: Trap[];
  turnCount: number;
  turnTimer: number;
  scores: Record<PlayerId, number>;
  winner: PlayerId | null;
  matchWinner: PlayerId | null;
  phase: 'waiting' | 'playing' | 'roundEnd' | 'matchEnd';
  lastAction: string;
}

export interface GameAction {
  type: 'move' | 'trap';
  playerId: PlayerId;
  direction?: Direction;
  trapType?: TrapType;
}

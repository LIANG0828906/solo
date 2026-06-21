export type TerrainType = 'normal' | 'trap' | 'speed';
export type PlayerId = string;
export type GameStatus = 'waiting' | 'playing' | 'ended';

export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  terrain: TerrainType;
  owner: PlayerId | null;
}

export interface Piece {
  id: string;
  playerId: PlayerId;
  x: number;
  y: number;
}

export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  pieces: Piece[];
  score: number;
  capturedCells: number;
  hasSpeedBonus: boolean;
  remainingMoves: number;
}

export interface GameState {
  board: Cell[][];
  players: Record<PlayerId, Player>;
  currentPlayerId: PlayerId;
  turnTimeLeft: number;
  gameStatus: GameStatus;
  winner: PlayerId | null;
  consecutiveNoOpTurns: number;
}

export interface BattleResult {
  attackerId: PlayerId;
  defenderId: PlayerId;
  attackerRoll: number;
  defenderRoll: number;
  winnerId: PlayerId;
  cellX: number;
  cellY: number;
}

export type GameEventListener = (state: GameState) => void;
export type BattleEventListener = (result: BattleResult) => void;

export interface GameEngineEvents {
  stateChange: GameEventListener;
  turnChange: GameEventListener;
  battle: BattleEventListener;
  gameEnd: GameEventListener;
  scoreAnimation: (playerId: PlayerId, scoreDelta: number) => void;
}

export type GameEventName = keyof GameEngineEvents;

export interface MoveAction {
  pieceId: string;
  targetX: number;
  targetY: number;
}

export interface InitialGameData {
  board: Cell[][];
  players: Record<PlayerId, Player>;
  currentPlayerId: PlayerId;
  yourPlayerId: PlayerId;
}

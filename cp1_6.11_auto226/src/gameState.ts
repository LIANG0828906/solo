export interface Position {
  x: number;
  y: number;
}

export type Player = 'red' | 'blue';
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 'xiao';
export type GamePhase = 'rolling' | 'moving' | 'marking' | 'ended';

export interface Piece {
  id: number;
  player: Player;
  position: Position;
  startPosition: Position;
  isXiao: boolean;
}

export interface DiceRecord {
  player: Player;
  value: DiceValue;
  turn: number;
}

export interface MoveRecord {
  player: Player;
  pieceId: number;
  from: Position;
  to: Position;
  pushedPieceId: number | null;
}

export interface GameState {
  currentPlayer: Player;
  turnNumber: number;
  diceRollCount: number;
  pieces: Piece[];
  diceHistory: DiceRecord[];
  moveHistory: MoveRecord[];
  currentDiceResult: DiceValue | null;
  gamePhase: GamePhase;
  winner: Player | null;
  selectedPieceId: number | null;
  validMoves: Position[];
}

const RED_START: Position[] = [
  { x: 0, y: 13 }, { x: 1, y: 13 }, { x: 2, y: 13 },
  { x: 0, y: 14 }, { x: 1, y: 14 }, { x: 2, y: 14 }
];

const BLUE_START: Position[] = [
  { x: 13, y: 0 }, { x: 14, y: 0 }, { x: 15, y: 0 },
  { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }
];

export function createInitialState(): GameState {
  const pieces: Piece[] = [];
  RED_START.forEach((pos, i) => {
    pieces.push({
      id: i,
      player: 'red',
      position: { ...pos },
      startPosition: { ...pos },
      isXiao: false
    });
  });
  BLUE_START.forEach((pos, i) => {
    pieces.push({
      id: i + 6,
      player: 'blue',
      position: { ...pos },
      startPosition: { ...pos },
      isXiao: false
    });
  });

  return {
    currentPlayer: 'red',
    turnNumber: 1,
    diceRollCount: 0,
    pieces,
    diceHistory: [],
    moveHistory: [],
    currentDiceResult: null,
    gamePhase: 'rolling',
    winner: null,
    selectedPieceId: null,
    validMoves: []
  };
}

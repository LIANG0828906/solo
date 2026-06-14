export type Suit = 'hearts' | 'diamonds' | 'spades' | 'clubs';
export type GameMode = 'single' | 'dual';
export type PileType = 'stock' | 'waste' | 'tableau' | 'foundation';

export interface CardType {
  id: string;
  suit: Suit;
  rank: number;
  faceUp: boolean;
  playerId: number;
}

export interface MoveResult {
  valid: boolean;
  errorMessage?: string;
  scoreGain: number;
  isCombo: boolean;
}

export interface MoveHint {
  cards: CardType[];
  sourceType: PileType;
  sourceIndex: number;
  sourceColumn?: number;
  targetType: PileType;
  targetIndex: number;
  targetColumn?: number;
}

export interface DragState {
  isDragging: boolean;
  draggedCards: CardType[];
  sourceType: PileType | null;
  sourceIndex: number;
  sourceColumn: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
  velocityX: number;
  velocityY: number;
}

export interface HistoryEntry {
  state: GameState;
  moveDescription: string;
}

export interface GameState {
  mode: GameMode;
  currentPlayer: number;
  stock: CardType[];
  waste: CardType[];
  tableau: CardType[][];
  foundation: CardType[][];
  tableauP2: CardType[][];
  foundationP2: CardType[][];
  scores: number[];
  comboCounts: number[];
  startTime: number;
  elapsedTime: number;
  moveCount: number;
  isGameOver: boolean;
  winner: number | null;
  history: HistoryEntry[];
  lastMoveToFoundation: boolean;
}

export interface Position {
  x: number;
  y: number;
}

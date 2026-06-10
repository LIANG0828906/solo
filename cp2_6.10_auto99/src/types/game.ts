export type Player = 'tiger' | 'leopard';

export type GamePhase = 'betting' | 'playing' | 'settling' | 'ended';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  type: 'tiger' | 'leopard';
  player: Player;
  position: Position;
  size: 1 | 2;
  isSelected: boolean;
}

export interface FishCard {
  id: string;
  isCaught: boolean;
  caughtBy: Player | null;
  poolIndex: number;
}

export interface Zhu {
  id: number;
  isUp: boolean;
  animateState: 'idle' | 'casting' | 'landed';
  flyX: number;
  flyY: number;
  rotation: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  phase: GamePhase;
  currentPlayer: Player;
  turn: number;
  pieces: Piece[];
  fishCards: FishCard[];
  zhus: Zhu[];
  lastSteps: number;
  hasCasted: boolean;
  bets: { tiger: number; leopard: number };
  fishCount: { tiger: number; leopard: number };
  isAITurn: boolean;
  isAIThinking: boolean;
  showFishBoi: boolean;
  boiPosition: Position | null;
  selectedPiece: string | null;
  validMoves: Position[];
  winner: Player | null;
  showSettlement: boolean;
  particles: Particle[];
}

export interface GameActions {
  startGame: (betAmount: number) => void;
  selectPiece: (pieceId: string) => void;
  movePiece: (pieceId: string, target: Position) => void;
  castZhus: () => void;
  catchFish: () => void;
  skipFishBoi: () => void;
  settleBets: () => void;
  resetGame: () => void;
  setAIThinking: (thinking: boolean) => void;
  addParticles: (particles: Particle[]) => void;
  removeParticle: (id: number) => void;
  clearParticles: () => void;
}

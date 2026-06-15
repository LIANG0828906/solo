export interface ThrowRecord {
  id: number;
  round: number;
  score: number;
  hitType: 'mouth' | 'ear' | 'miss';
  timestamp: number;
}

export interface GameState {
  totalScore: number;
  currentRound: number;
  maxRounds: number;
  currentRoundScore: number;
  records: ThrowRecord[];
  isPlaying: boolean;
  isAnimating: boolean;
  potShaking: boolean;
  showFlash: boolean;
}

export interface GameActions {
  startGame: () => void;
  resetGame: () => void;
  recordThrow: (hitType: 'mouth' | 'ear' | 'miss') => void;
  setAnimating: (value: boolean) => void;
  triggerPotEffect: () => void;
  clearPotEffect: () => void;
}

export type HitArea = 'mouth' | 'ear' | 'miss';

export interface Position {
  x: number;
  y: number;
}

export interface ArrowState {
  id: number;
  startPos: Position;
  endPos: Position;
  parabolaHeight: number;
  hitResult: HitArea;
  status: 'idle' | 'flying' | 'landed';
}

export interface PotDimensions {
  height: number;
  mouthDiameter: number;
  earDiameter: number;
  earOffset: number;
}

export type Player = 'player1' | 'player2';

export type CellState = {
  owner: Player | null;
  isTerritory: boolean;
  territoryOwner: Player | null;
  scale: number;
  isShaking: boolean;
  shakeStartTime: number;
  isFlashing: boolean;
  flashStartTime: number;
  flashColor: string;
  pulsePhase: number;
};

export type RhythmJudgment = 'perfect' | 'normal' | 'miss';

export type GamePhase = 'placing' | 'waitingForSpace' | 'switching' | 'ended';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
};

export type GameState = {
  board: CellState[][];
  currentPlayer: Player;
  placementCount: number;
  phase: GamePhase;
  selectedCell: { row: number; col: number } | null;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  totalPlacements: number;
  isComboActive: boolean;
  comboBpmBoost: boolean;
  comboEndTime: number;
  bpmBoostEndTime: number;
  winner: Player | null;
  finalScore: number;
  bestCombo: number;
  averageAccuracy: number;
  boardRotation: number;
  isRotating: boolean;
  rotationStartTime: number;
  flashPhase: number;
  flashStartTime: number;
  borderHue: number;
  particles: Particle[];
  lastUpdateTime: number;
};

export const BOARD_SIZE = 8;
export const PERFECT_THRESHOLD = 100;
export const NORMAL_THRESHOLD = 200;
export const PLACEMENTS_PER_TURN = 5;
export const BASE_BPM = 120;
export const COMBO_BPM_BOOST = 0.2;
export const COMBO_BOOST_DURATION = 10000;
export const COMBO_REQUIREMENT = 3;
export const WIN_THRESHOLD = 0.5;

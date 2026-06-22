export type MoleculeColor = 'A' | 'B' | 'C';

export interface Molecule {
  id: string;
  color: MoleculeColor;
  x: number;
  y: number;
  isAnimating?: boolean;
  animationType?: 'forward' | 'reverse' | 'idle';
}

export interface GridState {
  molecules: Molecule[];
  gridSize: number;
}

export type ReactionType = 'forward' | 'reverse' | 'catalyst-poisoning' | 'none';
export type RateStatus = 'normal' | 'accelerated' | 'stopped';

export interface ReactionResult {
  newGrid: GridState;
  reactionType: ReactionType;
  message?: string;
}

export interface GameState {
  grid: GridState;
  counts: { A: number; B: number; C: number };
  rateStatus: RateStatus;
  equilibriumConstant: number;
  lastReaction: { type: ReactionType; timestamp: Date | null };
  reactionInterval: number;
}

export interface GameStoreActions {
  moveAtom: (id: string, newX: number, newY: number) => void;
  triggerForwardReaction: () => void;
  triggerReverseReaction: () => void;
  updateCounts: () => void;
  updateEquilibriumConstant: () => void;
  checkReactionConditions: () => void;
  resetBoard: () => void;
  setLastReaction: (type: ReactionType) => void;
}

export const GRID_SIZE = 6;
export const CELL_SIZE = 64;
export const NORMAL_INTERVAL = 1500;
export const ACCELERATED_INTERVAL = 800;
export const STOPPED_INTERVAL = Infinity;

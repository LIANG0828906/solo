import { create } from 'zustand';
import {
  GamePhase,
  Grid,
  Ship,
  LogEntry,
  GRID_SIZE,
  CellState,
} from '@/types';

interface GameState {
  phase: GamePhase;
  playerId: string;
  opponentId: string | null;
  playerGrid: Grid;
  opponentGrid: Grid;
  playerShips: Ship[];
  opponentShips: Ship[];
  currentTurn: 'player' | 'opponent';
  turnNumber: number;
  winner: 'player' | 'opponent' | null;
  battleLog: LogEntry[];
  countdown: number;
  timeoutCount: number;
  opponentTimeoutCount: number;
  isReady: boolean;
  opponentReady: boolean;
  selectedShip: string | null;
  shipOrientation: 'horizontal' | 'vertical';
  hoverCell: [number, number] | null;
  lastAttackCell: [number, number] | null;
  lastAttackResult: 'hit' | 'miss' | null;
  attackPending: boolean;
  sinkingCells: [number, number][];
  showGameOverModal: boolean;
}

function createEmptyGrid(): Grid {
  const cells: CellState[][] = [];
  const shipMap: (string | null)[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    cells.push(new Array(GRID_SIZE).fill('empty'));
    shipMap.push(new Array(GRID_SIZE).fill(null));
  }
  return { cells, shipMap };
}

export const useGameStore = create<GameState>(() => ({
  phase: 'deploy',
  playerId: crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
  opponentId: null,
  playerGrid: createEmptyGrid(),
  opponentGrid: createEmptyGrid(),
  playerShips: [],
  opponentShips: [],
  currentTurn: 'player',
  turnNumber: 1,
  winner: null,
  battleLog: [],
  countdown: 20,
  timeoutCount: 0,
  opponentTimeoutCount: 0,
  isReady: false,
  opponentReady: false,
  selectedShip: null,
  shipOrientation: 'horizontal',
  hoverCell: null,
  lastAttackCell: null,
  lastAttackResult: null,
  attackPending: false,
  sinkingCells: [],
  showGameOverModal: false,
}));

export { createEmptyGrid };

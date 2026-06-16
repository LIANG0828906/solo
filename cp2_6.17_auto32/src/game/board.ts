import { create } from 'zustand';
import type { 
  GameState, 
  OpticalElement, 
  GridCoord, 
  LaserResult,
  PlayerState,
  TurnPhase
} from './types';
import { 
  GRID_SIZE, 
  INITIAL_LIVES, 
  TURN_DURATION,
  CELL_SIZE,
  SNAP_THRESHOLD
} from './types';
import { gridToPixel, pixelToGrid } from './engine';

function generateId(): string {
  return `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createInitialElements(): OpticalElement[] {
  const elements: OpticalElement[] = [];

  const mirrorPositions: { pos: GridCoord; orientation: 'nw-se' | 'ne-sw' }[] = [
    { pos: { x: 2, y: 2 }, orientation: 'nw-se' },
    { pos: { x: 5, y: 2 }, orientation: 'ne-sw' },
    { pos: { x: 1, y: 4 }, orientation: 'ne-sw' },
    { pos: { x: 6, y: 4 }, orientation: 'nw-se' },
    { pos: { x: 3, y: 6 }, orientation: 'ne-sw' },
    { pos: { x: 4, y: 1 }, orientation: 'nw-se' },
  ];

  mirrorPositions.forEach(({ pos, orientation }) => {
    elements.push({
      id: generateId(),
      type: 'mirror',
      position: pos,
      orientation,
      movable: false,
      owner: 'neutral'
    });
  });

  const prismPositions: GridCoord[] = [
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 2, y: 5 },
  ];

  prismPositions.forEach(pos => {
    elements.push({
      id: generateId(),
      type: 'prism',
      position: pos,
      movable: false,
      owner: 'neutral'
    });
  });

  const blockerPositionsA: GridCoord[] = [
    { x: 1, y: 6 },
    { x: 2, y: 7 },
  ];

  blockerPositionsA.forEach(pos => {
    elements.push({
      id: generateId(),
      type: 'blocker',
      position: pos,
      movable: true,
      owner: 'playerA'
    });
  });

  const blockerPositionsB: GridCoord[] = [
    { x: 5, y: 0 },
    { x: 6, y: 1 },
  ];

  blockerPositionsB.forEach(pos => {
    elements.push({
      id: generateId(),
      type: 'blocker',
      position: pos,
      movable: true,
      owner: 'playerB'
    });
  });

  return elements;
}

function createInitialPlayers(): Record<'playerA' | 'playerB', PlayerState> {
  return {
    playerA: {
      id: 'playerA',
      name: 'playerA',
      lives: INITIAL_LIVES,
      score: 0,
      connected: false
    },
    playerB: {
      id: 'playerB',
      name: 'playerB',
      lives: INITIAL_LIVES,
      score: 0,
      connected: false
    }
  };
}

function createInitialState(): GameState {
  return {
    phase: 'matching',
    currentTurn: 'playerA',
    turnPhase: 'adjust',
    round: 1,
    timeRemaining: TURN_DURATION,
    players: createInitialPlayers(),
    elements: createInitialElements(),
    laserResult: null,
    isFiring: false,
    winner: null,
    roomCode: null,
    localPlayer: null
  };
}

interface BoardStore extends GameState {
  setRoomCode: (code: string) => void;
  setLocalPlayer: (player: 'playerA' | 'playerB') => void;
  setPlayerConnected: (player: 'playerA' | 'playerB', connected: boolean) => void;
  startGame: () => void;
  moveElement: (elementId: string, position: GridCoord) => void;
  canMoveElement: (elementId: string, localPlayer: 'playerA' | 'playerB' | null) => boolean;
  snapToGrid: (pixelPos: { x: number; y: number }) => GridCoord | null;
  isPositionOccupied: (position: GridCoord, excludeId?: string) => boolean;
  isInPlayerHalf: (position: GridCoord, player: 'playerA' | 'playerB') => boolean;
  setLaserResult: (result: LaserResult | null) => void;
  setIsFiring: (firing: boolean) => void;
  setTurn: (turn: 'playerA' | 'playerB', phase: TurnPhase, time: number) => void;
  updateTime: (time: number) => void;
  applyLaserResult: (result: LaserResult, firingPlayer: 'playerA' | 'playerB') => void;
  nextRound: () => void;
  endGame: (winner: 'playerA' | 'playerB' | 'draw') => void;
  resetGame: () => void;
  setState: (state: Partial<GameState>) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  ...createInitialState(),

  setRoomCode: (code: string) => set({ roomCode: code }),

  setLocalPlayer: (player: 'playerA' | 'playerB') => set({ localPlayer: player }),

  setPlayerConnected: (player: 'playerA' | 'playerB', connected: boolean) => 
    set(state => ({
      players: {
        ...state.players,
        [player]: { ...state.players[player], connected }
      }
    })),

  startGame: () => set({
    phase: 'playing',
    currentTurn: 'playerA',
    turnPhase: 'adjust',
    round: 1,
    timeRemaining: TURN_DURATION,
    elements: createInitialElements(),
    laserResult: null,
    isFiring: false,
    winner: null,
    players: createInitialPlayers()
  }),

  moveElement: (elementId: string, position: GridCoord) => {
    const state = get();
    const element = state.elements.find(e => e.id === elementId);
    
    if (!element || !element.movable) return;
    if (get().isPositionOccupied(position, elementId)) return;

    set(state => ({
      elements: state.elements.map(e =>
        e.id === elementId ? { ...e, position } : e
      )
    }));
  },

  canMoveElement: (elementId: string, localPlayer: 'playerA' | 'playerB' | null) => {
    if (!localPlayer) return false;
    const element = get().elements.find(e => e.id === elementId);
    if (!element || !element.movable) return false;
    return element.owner === localPlayer;
  },

  snapToGrid: (pixelPos: { x: number; y: number }) => {
    const gridPos = pixelToGrid(pixelPos);
    const gridCenter = gridToPixel(gridPos);
    const distance = Math.hypot(pixelPos.x - gridCenter.x, pixelPos.y - gridCenter.y);
    
    if (distance <= SNAP_THRESHOLD) {
      if (gridPos.x >= 0 && gridPos.x < GRID_SIZE && gridPos.y >= 0 && gridPos.y < GRID_SIZE) {
        return gridPos;
      }
    }
    return null;
  },

  isPositionOccupied: (position: GridCoord, excludeId?: string) => {
    return get().elements.some(e => 
      e.id !== excludeId && e.position.x === position.x && e.position.y === position.y
    );
  },

  isInPlayerHalf: (position: GridCoord, player: 'playerA' | 'playerB') => {
    const midpoint = GRID_SIZE / 2;
    if (player === 'playerA') {
      return position.y >= midpoint;
    } else {
      return position.y < midpoint;
    }
  },

  setLaserResult: (result: LaserResult | null) => set({ laserResult: result }),

  setIsFiring: (firing: boolean) => set({ isFiring: firing }),

  setTurn: (turn: 'playerA' | 'playerB', phase: TurnPhase, time: number) => set({
    currentTurn: turn,
    turnPhase: phase,
    timeRemaining: time
  }),

  updateTime: (time: number) => set({ timeRemaining: time }),

  applyLaserResult: (result: LaserResult, firingPlayer: 'playerA' | 'playerB') => {
    const targetPlayer = firingPlayer === 'playerA' ? 'playerB' : 'playerA';
    
    if (result.hitBase === targetPlayer) {
      set(state => ({
        players: {
          ...state.players,
          [firingPlayer]: {
            ...state.players[firingPlayer],
            score: state.players[firingPlayer].score + 1
          },
          [targetPlayer]: {
            ...state.players[targetPlayer],
            lives: Math.max(0, state.players[targetPlayer].lives - 1)
          }
        },
        laserResult: result
      }));
    } else {
      set({ laserResult: result });
    }
  },

  nextRound: () => set(state => {
    const nextTurn = state.currentTurn === 'playerA' ? 'playerB' : 'playerA';
    const newRound = nextTurn === 'playerA' ? state.round + 1 : state.round;
    
    return {
      currentTurn: nextTurn,
      turnPhase: 'adjust',
      round: newRound,
      timeRemaining: TURN_DURATION,
      laserResult: null,
      isFiring: false
    };
  }),

  endGame: (winner: 'playerA' | 'playerB' | 'draw') => set({
    phase: 'ended',
    winner
  }),

  resetGame: () => set(createInitialState()),

  setState: (state: Partial<GameState>) => set(state)
}));

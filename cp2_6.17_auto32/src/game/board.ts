import { create } from 'zustand';
import type { 
  GameState, 
  OpticalElement, 
  GridCoord, 
  LaserResult,
  PlayerState,
  TurnPhase,
  PixelCoord
} from './types';
import { 
  GRID_SIZE, 
  INITIAL_LIVES, 
  TURN_DURATION,
  CELL_SIZE,
  SNAP_THRESHOLD
} from './types';
import { gridToPixel, pixelToGrid } from './engine';

export interface AnimationState {
  elementId: string;
  fromPos: PixelCoord;
  toPos: PixelCoord;
  startTime: number;
  duration: number;
}

export interface DragAnimationState {
  [elementId: string]: AnimationState;
}

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
  animations: DragAnimationState;
  setRoomCode: (code: string) => void;
  setLocalPlayer: (player: 'playerA' | 'playerB') => void;
  setPlayerConnected: (player: 'playerA' | 'playerB', connected: boolean) => void;
  startGame: () => void;
  moveElement: (elementId: string, position: GridCoord, withAnimation?: boolean) => boolean;
  tryMoveElementWithSnap: (elementId: string, pixelPos: PixelCoord, localPlayer: 'playerA' | 'playerB' | null) => boolean;
  startAnimation: (elementId: string, fromPos: PixelCoord, toPos: PixelCoord) => void;
  updateAnimations: () => void;
  isAnimating: (elementId: string) => boolean;
  getAnimatedPosition: (elementId: string) => PixelCoord | null;
  canMoveElement: (elementId: string, localPlayer: 'playerA' | 'playerB' | null) => boolean;
  snapToGrid: (pixelPos: PixelCoord) => GridCoord | null;
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

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  ...createInitialState(),
  animations: {},

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
    players: createInitialPlayers(),
    animations: {}
  }),

  moveElement: (elementId: string, position: GridCoord, withAnimation: boolean = true): boolean => {
    const state = get();
    const element = state.elements.find(e => e.id === elementId);
    
    if (!element || !element.movable) return false;
    if (state.isPositionOccupied(position, elementId)) return false;

    const oldPixelPos = gridToPixel(element.position);
    const newPixelPos = gridToPixel(position);

    if (withAnimation && (oldPixelPos.x !== newPixelPos.x || oldPixelPos.y !== newPixelPos.y)) {
      state.startAnimation(elementId, oldPixelPos, newPixelPos);
    }

    set(state => ({
      elements: state.elements.map(e =>
        e.id === elementId ? { ...e, position } : e
      )
    }));
    
    return true;
  },

  tryMoveElementWithSnap: (elementId: string, pixelPos: PixelCoord, localPlayer: 'playerA' | 'playerB' | null): boolean => {
    const state = get();
    const element = state.elements.find(e => e.id === elementId);
    
    if (!element) return false;
    if (!state.canMoveElement(elementId, localPlayer)) return false;
    if (state.phase !== 'playing' || state.turnPhase !== 'adjust') return false;

    const snappedPos = state.snapToGrid(pixelPos);
    if (!snappedPos) return false;

    if (element.owner !== 'neutral' && !state.isInPlayerHalf(snappedPos, element.owner)) return false;
    if (state.isPositionOccupied(snappedPos, elementId)) return false;

    return state.moveElement(elementId, snappedPos, true);
  },

  startAnimation: (elementId: string, fromPos: PixelCoord, toPos: PixelCoord) => {
    set(state => ({
      animations: {
        ...state.animations,
        [elementId]: {
          elementId,
          fromPos,
          toPos,
          startTime: Date.now(),
          duration: 200
        }
      }
    }));
  },

  updateAnimations: () => {
    const state = get();
    const now = Date.now();
    const newAnimations: DragAnimationState = {};
    let changed = false;

    Object.entries(state.animations).forEach(([id, anim]) => {
      const elapsed = now - anim.startTime;
      if (elapsed < anim.duration) {
        newAnimations[id] = anim;
      } else {
        changed = true;
      }
    });

    if (changed) {
      set({ animations: newAnimations });
    }
  },

  isAnimating: (elementId: string) => {
    const anim = get().animations[elementId];
    if (!anim) return false;
    return Date.now() - anim.startTime < anim.duration;
  },

  getAnimatedPosition: (elementId: string): PixelCoord | null => {
    const anim = get().animations[elementId];
    if (!anim) return null;
    
    const elapsed = Date.now() - anim.startTime;
    if (elapsed >= anim.duration) return null;
    
    const t = Math.min(elapsed / anim.duration, 1);
    const easedT = easeOutElastic(t);
    
    return {
      x: anim.fromPos.x + (anim.toPos.x - anim.fromPos.x) * easedT,
      y: anim.fromPos.y + (anim.toPos.y - anim.fromPos.y) * easedT
    };
  },

  canMoveElement: (elementId: string, localPlayer: 'playerA' | 'playerB' | null) => {
    if (!localPlayer) return false;
    const element = get().elements.find(e => e.id === elementId);
    if (!element || !element.movable) return false;
    return element.owner === localPlayer;
  },

  snapToGrid: (pixelPos: PixelCoord) => {
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
      isFiring: false,
      animations: {}
    };
  }),

  endGame: (winner: 'playerA' | 'playerB' | 'draw') => set({
    phase: 'ended',
    winner
  }),

  resetGame: () => set({ ...createInitialState(), animations: {} }),

  setState: (state: Partial<GameState>) => set(state)
}));

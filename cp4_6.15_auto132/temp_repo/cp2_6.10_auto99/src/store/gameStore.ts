import { create } from 'zustand';
import type { GameState, GameActions, Position, Piece, Particle } from '../types/game';
import {
  ZHU_COUNT,
  FISH_COUNT,
  PIECE_COUNT_PER_PLAYER,
  INITIAL_TIGER_POSITIONS,
  INITIAL_LEOPARD_POSITIONS,
} from '../utils/constants';
import {
  generateId,
  isBoiPosition,
  getValidMoves,
  createZhuFlyAnimation,
} from '../utils/helpers';

const createInitialPieces = (): Piece[] => {
  const pieces: Piece[] = [];

  for (let i = 0; i < PIECE_COUNT_PER_PLAYER; i++) {
    pieces.push({
      id: `tiger-${i}`,
      type: 'tiger',
      player: 'tiger',
      position: INITIAL_TIGER_POSITIONS[i],
      size: 2,
      isSelected: false,
    });
  }

  for (let i = 0; i < PIECE_COUNT_PER_PLAYER; i++) {
    pieces.push({
      id: `leopard-${i}`,
      type: 'leopard',
      player: 'leopard',
      position: INITIAL_LEOPARD_POSITIONS[i],
      size: 1,
      isSelected: false,
    });
  }

  return pieces;
};

const createInitialZhus = () => {
  return Array.from({ length: ZHU_COUNT }, (_, i) => ({
    id: i,
    isUp: false,
    animateState: 'idle' as const,
    flyX: 0,
    flyY: 0,
    rotation: 0,
  }));
};

const createInitialFishCards = () => {
  return Array.from({ length: FISH_COUNT }, (_, i) => ({
    id: generateId(),
    isCaught: false,
    caughtBy: null,
    poolIndex: i,
  }));
};

const initialState: GameState = {
  phase: 'betting',
  currentPlayer: 'tiger',
  turn: 1,
  pieces: createInitialPieces(),
  fishCards: createInitialFishCards(),
  zhus: createInitialZhus(),
  lastSteps: 0,
  hasCasted: false,
  bets: { tiger: 0, leopard: 0 },
  fishCount: { tiger: 0, leopard: 0 },
  isAITurn: true,
  isAIThinking: false,
  showFishBoi: false,
  boiPosition: null,
  selectedPiece: null,
  validMoves: [],
  winner: null,
  showSettlement: false,
  particles: [],
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: (betAmount: number) => {
    set({
      phase: 'playing',
      bets: { tiger: betAmount, leopard: betAmount },
      currentPlayer: 'tiger',
      turn: 1,
      pieces: createInitialPieces(),
      fishCards: createInitialFishCards(),
      zhus: createInitialZhus(),
      fishCount: { tiger: 0, leopard: 0 },
      lastSteps: 0,
      hasCasted: false,
      selectedPiece: null,
      validMoves: [],
      winner: null,
      showSettlement: false,
      isAITurn: true,
      isAIThinking: false,
    });
  },

  selectPiece: (pieceId: string) => {
    const state = get();
    if (state.phase !== 'playing' || state.showFishBoi || state.hasCasted === false) return;

    const piece = state.pieces.find((p) => p.id === pieceId);
    if (!piece || piece.player !== state.currentPlayer) return;

    const validMoves = getValidMoves(piece, state.lastSteps, state.pieces);

    set({
      selectedPiece: pieceId,
      validMoves,
      pieces: state.pieces.map((p) => ({
        ...p,
        isSelected: p.id === pieceId,
      })),
    });
  },

  movePiece: (pieceId: string, target: Position) => {
    const state = get();
    if (state.phase !== 'playing' || state.selectedPiece !== pieceId) return;

    const piece = state.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    const isValid = state.validMoves.some((m) => m.x === target.x && m.y === target.y);
    if (!isValid) return;

    const updatedPieces = state.pieces.map((p) =>
      p.id === pieceId ? { ...p, position: target, isSelected: false } : p
    );

    const nextState: Partial<GameState> = {
      pieces: updatedPieces,
      selectedPiece: null,
      validMoves: [],
      hasCasted: false,
    };

    if (isBoiPosition(target)) {
      nextState.showFishBoi = true;
      nextState.boiPosition = target;
    } else {
      const nextPlayer = state.currentPlayer === 'tiger' ? 'leopard' : 'tiger';
      nextState.currentPlayer = nextPlayer;
      nextState.turn = nextPlayer === 'tiger' ? state.turn + 1 : state.turn;
      nextState.isAITurn = nextPlayer === 'leopard' && state.isAITurn;

      const remainingFish = state.fishCards.filter((f) => !f.isCaught).length;
      if (remainingFish === 0) {
        nextState.phase = 'settling';
        nextState.showSettlement = true;
        const tigerCount = state.fishCount.tiger;
        const leopardCount = state.fishCount.leopard;
        nextState.winner = tigerCount > leopardCount ? 'tiger' : 'leopard';
      }
    }

    set(nextState);
  },

  castZhus: () => {
    const state = get();
    if (state.phase !== 'playing' || state.hasCasted || state.showFishBoi) return;
    if (state.isAIThinking) return;

    const newZhus = state.zhus.map((zhu) => {
      const anim = createZhuFlyAnimation();
      return {
        ...zhu,
        isUp: Math.random() < 0.5,
        animateState: 'casting' as const,
        flyX: anim.flyX,
        flyY: anim.flyY,
        rotation: anim.rotation,
      };
    });

    set({ zhus: newZhus });

    setTimeout(() => {
      const steps = newZhus.filter((z) => z.isUp).length;
      set((s) => ({
        zhus: s.zhus.map((z) => ({ ...z, animateState: 'landed' as const })),
        lastSteps: steps,
        hasCasted: true,
      }));
    }, 800);
  },

  catchFish: () => {
    const state = get();
    if (!state.showFishBoi) return;

    const availableFish = state.fishCards.filter((f) => !f.isCaught);
    if (availableFish.length === 0) {
      get().skipFishBoi();
      return;
    }

    const randomFish = availableFish[Math.floor(Math.random() * availableFish.length)];

    const newFishCount = { ...state.fishCount };
    newFishCount[state.currentPlayer]++;

    const nextPlayer = state.currentPlayer === 'tiger' ? 'leopard' : 'tiger';
    const remainingFish = availableFish.length - 1;

    const nextState: Partial<GameState> = {
      fishCards: state.fishCards.map((f) =>
        f.id === randomFish.id
          ? { ...f, isCaught: true, caughtBy: state.currentPlayer }
          : f
      ),
      fishCount: newFishCount,
      showFishBoi: false,
      boiPosition: null,
      currentPlayer: nextPlayer,
      turn: nextPlayer === 'tiger' ? state.turn + 1 : state.turn,
      isAITurn: nextPlayer === 'leopard' && state.isAITurn,
    };

    if (remainingFish === 0) {
      nextState.phase = 'settling';
      nextState.showSettlement = true;
      nextState.winner =
        newFishCount.tiger > newFishCount.leopard ? 'tiger' : 'leopard';
    }

    set(nextState);
  },

  skipFishBoi: () => {
    const state = get();
    const nextPlayer = state.currentPlayer === 'tiger' ? 'leopard' : 'tiger';

    set({
      showFishBoi: false,
      boiPosition: null,
      currentPlayer: nextPlayer,
      turn: nextPlayer === 'tiger' ? state.turn + 1 : state.turn,
      isAITurn: nextPlayer === 'leopard' && state.isAITurn,
    });
  },

  settleBets: () => {
    const state = get();
    if (state.phase !== 'settling') return;

    set({
      phase: 'ended',
      showSettlement: false,
    });
  },

  resetGame: () => {
    set(initialState);
  },

  setAIThinking: (thinking: boolean) => {
    set({ isAIThinking: thinking });
  },

  addParticles: (particles: Particle[]) => {
    set((state) => ({
      particles: [...state.particles, ...particles],
    }));
  },

  removeParticle: (id: number) => {
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== id),
    }));
  },

  clearParticles: () => {
    set({ particles: [] });
  },
}));

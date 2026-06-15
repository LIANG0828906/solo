import { create } from 'zustand';
import {
  LockRingState,
  CelestialSymbol,
  createInitialRingState,
  angleToSymbol,
  snapToNearestTick,
  validateCombination,
  generateTargetCombination,
  getRandomAngle,
} from '../utils/puzzleLogic';

interface GameState {
  rings: LockRingState[];
  attempts: number;
  maxAttempts: number;
  isLocked: boolean;
  lockTimer: number;
  isSolved: boolean;
  targetCombination: CelestialSymbol[];
  showDoor: boolean;

  initializeGame: () => void;
  rotateRing: (ringId: number, deltaAngle: number) => void;
  snapRing: (ringId: number) => boolean;
  checkCombination: () => boolean;
  lockRings: (seconds: number) => void;
  unlockRings: () => void;
  setLockTimer: (timer: number) => void;
  triggerSuccessAnimation: () => void;
  triggerFailAnimation: () => void;
  resetGame: () => void;
  incrementAttempts: () => number;
  getCurrentCombination: () => CelestialSymbol[];
}

export const useGameStore = create<GameState>((set, get) => ({
  rings: [],
  attempts: 0,
  maxAttempts: 5,
  isLocked: false,
  lockTimer: 0,
  isSolved: false,
  targetCombination: generateTargetCombination(),
  showDoor: false,

  initializeGame: () => {
    set({
      rings: [createInitialRingState(0), createInitialRingState(1), createInitialRingState(2)],
      attempts: 0,
      isLocked: false,
      lockTimer: 0,
      isSolved: false,
      targetCombination: generateTargetCombination(),
      showDoor: false,
    });
  },

  rotateRing: (ringId: number, deltaAngle: number) => {
    const state = get();
    if (state.isLocked || state.isSolved) return;

    set((state) => ({
      rings: state.rings.map((ring) =>
        ring.id === ringId
          ? {
              ...ring,
              angle: ring.angle + deltaAngle,
              currentSymbol: angleToSymbol(ring.angle + deltaAngle),
            }
          : ring
      ),
    }));
  },

  snapRing: (ringId: number): boolean => {
    const state = get();
    if (state.isLocked || state.isSolved) return false;

    let combinationChanged = false;

    set((state) => {
      const newRings = state.rings.map((ring) => {
        if (ring.id === ringId) {
          const snappedAngle = snapToNearestTick(ring.angle);
          const newSymbol = angleToSymbol(snappedAngle);
          if (newSymbol !== ring.currentSymbol) {
            combinationChanged = true;
          }
          return {
            ...ring,
            angle: snappedAngle,
            currentSymbol: newSymbol,
          };
        }
        return ring;
      });
      return { rings: newRings };
    });

    return combinationChanged;
  },

  checkCombination: (): boolean => {
    const state = get();
    const current = state.getCurrentCombination();
    return validateCombination(current, state.targetCombination);
  },

  lockRings: (seconds: number) => {
    set({ isLocked: true, lockTimer: seconds });
    set((state) => ({
      rings: state.rings.map((ring) => ({
        ...ring,
        isLocked: true,
        isFailed: true,
      })),
    }));
  },

  unlockRings: () => {
    set({ isLocked: false, lockTimer: 0 });
    set((state) => ({
      rings: state.rings.map((ring) => ({
        ...ring,
        isLocked: false,
        isFailed: false,
      })),
    }));
  },

  setLockTimer: (timer: number) => {
    set({ lockTimer: timer });
  },

  triggerSuccessAnimation: () => {
    set({ isSolved: true, showDoor: true });
    const ringIds = [0, 1, 2];
    ringIds.forEach((id, index) => {
      setTimeout(() => {
        set((state) => ({
          rings: state.rings.map((ring) =>
            ring.id === id ? { ...ring, isSuccess: true } : ring
          ),
        }));
      }, index * 200);
    });
  },

  triggerFailAnimation: () => {
    set((state) => ({
      rings: state.rings.map((ring) => ({ ...ring, isFailed: true })),
    }));
    setTimeout(() => {
      set((state) => ({
        rings: state.rings.map((ring) => ({ ...ring, isFailed: false })),
      }));
    }, 500);
  },

  resetGame: () => {
    set({
      rings: [
        { ...createInitialRingState(0), angle: getRandomAngle() },
        { ...createInitialRingState(1), angle: getRandomAngle() },
        { ...createInitialRingState(2), angle: getRandomAngle() },
      ].map((ring) => ({
        ...ring,
        currentSymbol: angleToSymbol(ring.angle),
      })),
      attempts: 0,
      isLocked: false,
      lockTimer: 0,
      isSolved: false,
      showDoor: false,
    });
  },

  incrementAttempts: (): number => {
    let newAttempts = 0;
    set((state) => {
      newAttempts = state.attempts + 1;
      return { attempts: newAttempts };
    });
    return newAttempts;
  },

  getCurrentCombination: (): CelestialSymbol[] => {
    return get().rings.map((ring) => ring.currentSymbol);
  },
}));

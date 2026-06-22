import { create } from 'zustand';
import {
  PuzzlePiece,
  createInitialPieces,
  checkAllComplete,
  rotatePiece as rotatePieceUtil,
  checkSnap,
} from '../engine/puzzleEngine';

interface PuzzleSnapshot {
  pieces: PuzzlePiece[];
}

interface PuzzleStore {
  pieces: PuzzlePiece[];
  selectedPieceId: number | null;
  isComplete: boolean;
  undoStack: PuzzleSnapshot[];
  maxUndoSteps: number;

  init: () => void;
  selectPiece: (id: number | null) => void;
  setPiecePosition: (id: number, x: number, y: number, isPlaced: boolean) => void;
  dropAndSnap: (id: number, x: number, y: number) => boolean;
  rotatePiece: (id: number) => void;
  undoMove: () => void;
  checkComplete: () => void;
  reset: () => void;
  pushUndo: () => void;
}

export const usePuzzleStore = create<PuzzleStore>((set, get) => ({
  pieces: [],
  selectedPieceId: null,
  isComplete: false,
  undoStack: [],
  maxUndoSteps: 20,

  init: () => {
    const pieces = createInitialPieces();
    set({
      pieces,
      selectedPieceId: null,
      isComplete: false,
      undoStack: [],
    });
  },

  selectPiece: (id: number | null) => {
    set((state) => ({
      pieces: state.pieces.map((p) => ({
        ...p,
        isSelected: p.id === id,
      })),
      selectedPieceId: id,
    }));
  },

  setPiecePosition: (id: number, x: number, y: number, isPlaced: boolean) => {
    set((state) => ({
      pieces: state.pieces.map((p) =>
        p.id === id ? { ...p, currentX: x, currentY: y, isPlaced } : p
      ),
    }));
  },

  dropAndSnap: (id: number, x: number, y: number): boolean => {
    const result = checkSnap(x, y);

    if (result.snapped) {
      set((state) => ({
        pieces: state.pieces.map((p) =>
          p.id === id
            ? {
                ...p,
                currentX: result.targetX,
                currentY: result.targetY,
                isPlaced: true,
              }
            : p
        ),
      }));
      get().checkComplete();
      return true;
    } else {
      set((state) => ({
        pieces: state.pieces.map((p) =>
          p.id === id ? { ...p, currentX: x, currentY: y, isPlaced: true } : p
        ),
      }));
      return false;
    }
  },

  rotatePiece: (id: number) => {
    set((state) => ({
      pieces: state.pieces.map((p) => (p.id === id ? rotatePieceUtil(p) : p)),
    }));
    get().checkComplete();
  },

  undoMove: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;

      const newStack = [...state.undoStack];
      const snapshot = newStack.pop()!;

      return {
        pieces: snapshot.pieces,
        undoStack: newStack,
        isComplete: false,
      };
    });
  },

  checkComplete: () => {
    const { pieces } = get();
    const allPlaced = pieces.every((p) => p.isPlaced);
    if (!allPlaced) {
      set({ isComplete: false });
      return;
    }

    const complete = checkAllComplete(pieces);
    set({ isComplete: complete });
  },

  reset: () => {
    const pieces = createInitialPieces();
    set({
      pieces,
      selectedPieceId: null,
      isComplete: false,
      undoStack: [],
    });
  },

  pushUndo: () => {
    set((state) => {
      const snapshot: PuzzleSnapshot = {
        pieces: state.pieces.map((p) => ({ ...p })),
      };
      const newStack = [...state.undoStack, snapshot];
      if (newStack.length > state.maxUndoSteps) {
        newStack.shift();
      }
      return { undoStack: newStack };
    });
  },
}));

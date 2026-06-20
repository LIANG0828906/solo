import { create } from 'zustand';

export interface PuzzlePiece {
  id: number;
  originalIndex: number;
  currentIndex: number;
  isPlaced: boolean;
  isFlashing: boolean;
}

export interface PuzzleRecord {
  id: string;
  thumbnail: string;
  completionTime: number;
  completedAt: number;
}

interface PuzzleState {
  image: string | null;
  pieces: PuzzlePiece[];
  gridSize: number;
  moves: number;
  time: number;
  isCompleted: boolean;
  isPlaying: boolean;
  showHint: boolean;
  recentPuzzles: PuzzleRecord[];
  currentPage: 'home' | 'puzzle';
  setImage: (image: string) => void;
  initializePieces: () => void;
  shufflePieces: () => void;
  movePiece: (fromIndex: number, toIndex: number) => void;
  placePiece: (pieceId: number, targetIndex: number) => void;
  setFlash: (pieceId: number, value: boolean) => void;
  incrementMoves: () => void;
  incrementTime: () => void;
  setIsCompleted: (value: boolean) => void;
  setIsPlaying: (value: boolean) => void;
  setShowHint: (value: boolean) => void;
  setCurrentPage: (page: 'home' | 'puzzle') => void;
  addRecentPuzzle: (record: PuzzleRecord) => void;
  resetGame: () => void;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const loadRecentPuzzles = (): PuzzleRecord[] => {
  try {
    const stored = localStorage.getItem('recentPuzzles');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentPuzzles = (puzzles: PuzzleRecord[]) => {
  try {
    localStorage.setItem('recentPuzzles', JSON.stringify(puzzles));
  } catch {
    // ignore
  }
};

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  image: null,
  pieces: [],
  gridSize: 3,
  moves: 0,
  time: 0,
  isCompleted: false,
  isPlaying: false,
  showHint: false,
  recentPuzzles: loadRecentPuzzles(),
  currentPage: 'home',

  setImage: (image) => set({ image }),

  initializePieces: () => {
    const { gridSize } = get();
    const totalPieces = gridSize * gridSize;
    const pieces: PuzzlePiece[] = [];

    for (let i = 0; i < totalPieces; i++) {
      pieces.push({
        id: i,
        originalIndex: i,
        currentIndex: i,
        isPlaced: false,
        isFlashing: false,
      });
    }

    const shuffled = shuffleArray(pieces);
    shuffled.forEach((piece, index) => {
      piece.currentIndex = index;
    });

    set({ pieces: shuffled, moves: 0, time: 0, isCompleted: false, isPlaying: true });
  },

  shufflePieces: () => {
    const { pieces } = get();
    const shuffled = shuffleArray([...pieces]);
    shuffled.forEach((piece, index) => {
      piece.currentIndex = index;
      piece.isPlaced = false;
    });
    set({ pieces: shuffled });
  },

  movePiece: (fromIndex, toIndex) => {
    const { pieces } = get();
    const newPieces = [...pieces];
    const fromPiece = newPieces.find(p => p.currentIndex === fromIndex);
    const toPiece = newPieces.find(p => p.currentIndex === toIndex);

    if (fromPiece && toPiece) {
      fromPiece.currentIndex = toIndex;
      toPiece.currentIndex = fromIndex;
    }

    set({ pieces: newPieces });
  },

  placePiece: (pieceId, targetIndex) => {
    const { pieces } = get();
    const newPieces = [...pieces];
    const piece = newPieces.find(p => p.id === pieceId);
    const occupyingPiece = newPieces.find(p => p.currentIndex === targetIndex && p.id !== pieceId);

    if (piece) {
      const oldIndex = piece.currentIndex;
      piece.currentIndex = targetIndex;
      piece.isPlaced = piece.originalIndex === targetIndex;

      if (occupyingPiece) {
        occupyingPiece.currentIndex = oldIndex;
        occupyingPiece.isPlaced = occupyingPiece.originalIndex === oldIndex;
      }

      const allPlaced = newPieces.every(p => p.isPlaced);
      set({ pieces: newPieces, isCompleted: allPlaced });
    }
  },

  setFlash: (pieceId, value) => {
    const { pieces } = get();
    const newPieces = pieces.map(p =>
      p.id === pieceId ? { ...p, isFlashing: value } : p
    );
    set({ pieces: newPieces });
  },

  incrementMoves: () => set(state => ({ moves: state.moves + 1 })),

  incrementTime: () => set(state => ({ time: state.time + 1 })),

  setIsCompleted: (value) => set({ isCompleted: value }),

  setIsPlaying: (value) => set({ isPlaying: value }),

  setShowHint: (value) => set({ showHint: value }),

  setCurrentPage: (page) => set({ currentPage: page }),

  addRecentPuzzle: (record) => {
    const { recentPuzzles } = get();
    const updated = [record, ...recentPuzzles].slice(0, 4);
    set({ recentPuzzles: updated });
    saveRecentPuzzles(updated);
  },

  resetGame: () => {
    set({
      image: null,
      pieces: [],
      moves: 0,
      time: 0,
      isCompleted: false,
      isPlaying: false,
      showHint: false,
    });
  },
}));

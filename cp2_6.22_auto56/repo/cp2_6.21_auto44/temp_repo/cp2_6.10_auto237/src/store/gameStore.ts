import { create } from 'zustand';
import { ClothPiece, GameState, GameActions, Era } from '../types';
import { generateClothPieceData, INITIAL_PIECES_COUNT, TOTAL_PIECES_TO_WIN, generateId } from '../data/storyData';
import { exportAsImage } from '../utils/export';

const initialState: Omit<GameState, keyof GameActions> = {
  clothPieces: [],
  sewnOrder: [],
  currentEra: 'ancient',
  puzzle: {
    isActive: false,
    type: 'symbol-match',
    clothId: null,
    attempts: 0
  },
  collection: {
    ancient: [],
    medieval: [],
    renaissance: [],
    industrial: [],
    modern: [],
    future: []
  },
  isComplete: false,
  showCollection: false,
  selectedCloth: null,
  particles: [],
  feedback: {
    type: null,
    clothId: null,
    timestamp: 0
  }
};

function initializePieces(): ClothPiece[] {
  const pieces: ClothPiece[] = [];
  for (let i = 0; i < INITIAL_PIECES_COUNT; i++) {
    const data = generateClothPieceData();
    pieces.push({
      ...data,
      status: 'inventory',
      createdAt: Date.now() + i
    });
  }
  return pieces;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,
  clothPieces: initializePieces(),

  generateClothPiece: () => {
    const { clothPieces } = get();
    if (clothPieces.length >= 8) return;
    
    const data = generateClothPieceData();
    const newPiece: ClothPiece = {
      ...data,
      status: 'inventory',
      createdAt: Date.now()
    };

    set((state) => ({
      clothPieces: [...state.clothPieces, newPiece]
    }));
  },

  selectCloth: (cloth: ClothPiece | null) => {
    set({ selectedCloth: cloth });
  },

  attemptSew: (clothId: string, targetOrder: number): boolean => {
    const { clothPieces, sewnOrder, collection } = get();
    const piece = clothPieces.find((p) => p.id === clothId);
    
    if (!piece || piece.status !== 'inventory') return false;

    const expectedOrder = sewnOrder.length;
    const isCorrect = piece.correctOrder === targetOrder && targetOrder === expectedOrder;

    if (isCorrect) {
      set((state) => ({
        clothPieces: state.clothPieces.map((p) =>
          p.id === clothId ? { ...p, status: 'sewn' as const } : p
        ),
        sewnOrder: [...state.sewnOrder, clothId],
        isComplete: state.sewnOrder.length + 1 >= TOTAL_PIECES_TO_WIN,
        collection: {
          ...state.collection,
          [piece.era]: state.collection[piece.era].includes(piece.id)
            ? state.collection[piece.era]
            : [...state.collection[piece.era], piece.id]
        },
        feedback: {
          type: 'success',
          clothId,
          timestamp: Date.now()
        }
      }));
    } else {
      set((state) => ({
        feedback: {
          type: 'error',
          clothId,
          timestamp: Date.now()
        },
        puzzle: {
          isActive: true,
          type: Math.random() > 0.5 ? 'symbol-match' : 'sequence-click',
          clothId,
          attempts: 0
        }
      }));
    }

    return isCorrect;
  },

  triggerPuzzle: (clothId: string) => {
    set((state) => ({
      puzzle: {
        isActive: true,
        type: Math.random() > 0.5 ? 'symbol-match' : 'sequence-click',
        clothId,
        attempts: 0
      }
    }));
  },

  solvePuzzle: (success: boolean) => {
    const { puzzle } = get();
    
    if (success) {
      set((state) => ({
        puzzle: {
          ...state.puzzle,
          isActive: false,
          clothId: null,
          attempts: 0
        }
      }));
    } else {
      set((state) => ({
        puzzle: {
          ...state.puzzle,
          attempts: state.puzzle.attempts + 1
        }
      }));
    }
  },

  toggleCollection: () => {
    set((state) => ({
      showCollection: !state.showCollection
    }));
  },

  exportImage: async () => {
    try {
      await exportAsImage();
    } catch (error) {
      console.error('Export failed:', error);
    }
  },

  resetGame: () => {
    const savedCollection = get().collection;
    set({
      ...initialState,
      clothPieces: initializePieces(),
      collection: savedCollection
    });
  },

  addParticles: (x: number, y: number) => {
    const { particles } = get();
    if (particles.length >= 500) return;

    const colors = ['#f5e6b8', '#b87333', '#2a6f97', '#FFD700', '#FFA500'];
    const types: Array<'petal' | 'star'> = ['petal', 'star'];
    const newParticles = [];

    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: generateId(),
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
        createdAt: Date.now()
      });
    }

    set((state) => ({
      particles: [...state.particles, ...newParticles]
    }));
  },

  clearParticles: () => {
    const now = Date.now();
    set((state) => ({
      particles: state.particles.filter((p) => now - p.createdAt < 2000)
    }));
  },

  setFeedback: (type: 'success' | 'error' | null, clothId: string | null) => {
    set((state) => ({
      feedback: {
        type,
        clothId,
        timestamp: type ? Date.now() : 0
      }
    }));
  }
}));

export function useInventoryPieces() {
  return useGameStore((state) => state.clothPieces.filter((p) => p.status === 'inventory'));
}

export function useSewnPieces() {
  const { clothPieces, sewnOrder } = useGameStore((state) => ({
    clothPieces: state.clothPieces,
    sewnOrder: state.sewnOrder
  }));
  return sewnOrder.map((id) => clothPieces.find((p) => p.id === id)!).filter(Boolean);
}

export function useCollectionCount() {
  const collection = useGameStore((state) => state.collection);
  return Object.values(collection).reduce((sum, arr) => sum + arr.length, 0);
}

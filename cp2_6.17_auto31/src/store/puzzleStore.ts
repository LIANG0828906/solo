import { create } from 'zustand';
import { splitImage, imageDataToDataUrl, dataUrlToImageData, PieceImageData } from '../utils/ImageProcessor';
import { saveSnapshot, loadSnapshot, PuzzleSnapshot } from '../utils/FileManager';

export interface Piece {
  id: string;
  imgData: ImageData;
  correctX: number;
  correctY: number;
  curX: number;
  curY: number;
  width: number;
  height: number;
  locked: boolean;
  zIndex: number;
  highlighted: boolean;
}

interface PuzzleState {
  pieces: Piece[];
  gridSize: number;
  canvasSize: number;
  isCompleted: boolean;
  maxZIndex: number;
  isShuffling: boolean;
  isAnimating: boolean;

  setGridSize: (size: number) => void;
  setImageAndSplit: (file: File, canvasSize: number) => Promise<void>;
  updatePiecePosition: (id: string, x: number, y: number) => void;
  bringToFront: (id: string) => void;
  lockPiece: (id: string) => void;
  highlightPiece: (id: string) => void;
  clearHighlight: (id: string) => void;
  shufflePieces: (animate?: boolean) => void;
  resetPuzzle: () => void;
  checkCompletion: () => void;
  saveCurrentSnapshot: () => void;
  loadSnapshotFromFile: (file: File) => Promise<void>;
}

const SNAP_THRESHOLD = 30;

export const usePuzzleStore = create<PuzzleState>((set, get) => ({
  pieces: [],
  gridSize: 4,
  canvasSize: 600,
  isCompleted: false,
  maxZIndex: 0,
  isShuffling: false,
  isAnimating: false,

  setGridSize: (size: number) => {
    set({ gridSize: size, pieces: [], isCompleted: false });
  },

  setImageAndSplit: async (file: File, canvasSize: number) => {
    const gridSize = get().gridSize;
    const { pieces: pieceData } = await splitImage(file, gridSize, canvasSize);

    const pieces: Piece[] = pieceData.map((p: PieceImageData, idx: number) => {
      const margin = 20;
      const maxX = canvasSize - p.width - margin;
      const maxY = canvasSize - p.height - margin;
      return {
        id: p.id,
        imgData: p.imgData,
        correctX: p.correctX,
        correctY: p.correctY,
        curX: margin + Math.random() * Math.max(0, maxX - margin),
        curY: margin + Math.random() * Math.max(0, maxY - margin),
        width: p.width,
        height: p.height,
        locked: false,
        zIndex: idx,
        highlighted: false,
      };
    });

    set({
      pieces,
      canvasSize,
      maxZIndex: pieces.length - 1,
      isCompleted: false,
    });
  },

  updatePiecePosition: (id: string, x: number, y: number) => {
    set((state) => ({
      pieces: state.pieces.map((p) =>
        p.id === id && !p.locked ? { ...p, curX: x, curY: y } : p
      ),
    }));
  },

  bringToFront: (id: string) => {
    const newZ = get().maxZIndex + 1;
    set((state) => ({
      maxZIndex: newZ,
      pieces: state.pieces.map((p) =>
        p.id === id ? { ...p, zIndex: newZ } : p
      ),
    }));
  },

  lockPiece: (id: string) => {
    set((state) => {
      const pieces = state.pieces.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            curX: p.correctX,
            curY: p.correctY,
            locked: true,
          };
        }
        return p;
      });
      const allLocked = pieces.every((p) => p.locked);
      return {
        pieces,
        isCompleted: allLocked,
      };
    });
  },

  highlightPiece: (id: string) => {
    set((state) => ({
      pieces: state.pieces.map((p) =>
        p.id === id ? { ...p, highlighted: true } : p
      ),
    }));
  },

  clearHighlight: (id: string) => {
    set((state) => ({
      pieces: state.pieces.map((p) =>
        p.id === id ? { ...p, highlighted: false } : p
      ),
    }));
  },

  shufflePieces: (animate: boolean = true) => {
    set({ isShuffling: animate });
    const { canvasSize, pieces } = get();
    const margin = 20;

    const newPieces = pieces.map((p) => {
      if (p.locked) return p;
      const maxX = canvasSize - p.width - margin;
      const maxY = canvasSize - p.height - margin;
      return {
        ...p,
        curX: margin + Math.random() * Math.max(0, maxX - margin),
        curY: margin + Math.random() * Math.max(0, maxY - margin),
      };
    });

    setTimeout(() => {
      set({ isShuffling: false });
    }, 500);

    set({ pieces: newPieces, isCompleted: false });
  },

  resetPuzzle: () => {
    set({ pieces: [], isCompleted: false, maxZIndex: 0 });
  },

  checkCompletion: () => {
    const { pieces } = get();
    const allLocked = pieces.length > 0 && pieces.every((p) => p.locked);
    set({ isCompleted: allLocked });
  },

  saveCurrentSnapshot: () => {
    const { pieces, gridSize, canvasSize } = get();
    if (pieces.length === 0) return;

    const snapshot: PuzzleSnapshot = {
      version: '1.0',
      gridSize,
      canvasSize,
      pieces: pieces.map((p) => ({
        id: p.id,
        correctX: p.correctX,
        correctY: p.correctY,
        curX: p.curX,
        curY: p.curY,
        locked: p.locked,
        zIndex: p.zIndex,
        pieceWidth: p.width,
        pieceHeight: p.height,
        imgDataBase64: imageDataToDataUrl(p.imgData),
      })),
      savedAt: new Date().toISOString(),
    };

    saveSnapshot(snapshot);
  },

  loadSnapshotFromFile: async (file: File) => {
    const snapshot = await loadSnapshot(file);
    const piecesPromises = snapshot.pieces.map(async (sp) => {
      const imgData = await dataUrlToImageData(sp.imgDataBase64);
      const piece: Piece = {
        id: sp.id,
        imgData,
        correctX: sp.correctX,
        correctY: sp.correctY,
        curX: sp.curX,
        curY: sp.curY,
        width: sp.pieceWidth,
        height: sp.pieceHeight,
        locked: sp.locked,
        zIndex: sp.zIndex,
        highlighted: false,
      };
      return piece;
    });

    const pieces = await Promise.all(piecesPromises);
    const maxZ = pieces.reduce((max, p) => Math.max(max, p.zIndex), 0);
    const allLocked = pieces.length > 0 && pieces.every((p) => p.locked);

    set({
      pieces,
      gridSize: snapshot.gridSize,
      canvasSize: snapshot.canvasSize,
      maxZIndex: maxZ,
      isCompleted: allLocked,
    });
  },
}));

export function isPieceAligned(piece: Piece): boolean {
  const centerX = piece.curX + piece.width / 2;
  const centerY = piece.curY + piece.height / 2;
  const correctCenterX = piece.correctX + piece.width / 2;
  const correctCenterY = piece.correctY + piece.height / 2;
  const distance = Math.sqrt(
    Math.pow(centerX - correctCenterX, 2) + Math.pow(centerY - correctCenterY, 2)
  );
  return distance < SNAP_THRESHOLD;
}

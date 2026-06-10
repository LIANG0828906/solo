import { create } from 'zustand';

export type BrushType = 'jianhao' | 'langhao' | 'yanghao';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface ScoreRecord {
  strokeIndex: number;
  strokeName: string;
  score: number;
  suggestion: string;
  timestamp: number;
}

export interface DeviationArea {
  x: number;
  y: number;
  radius: number;
  deviationPercent: number;
}

interface BrushState {
  currentStrokeIndex: number;
  brushType: BrushType;
  isAnimating: boolean;
  canWrite: boolean;
  userStrokePoints: Point[];
  scoreHistory: ScoreRecord[];
  currentScore: number | null;
  currentSuggestion: string | null;
  deviationAreas: DeviationArea[];
  isWriting: boolean;
  gridSize: number;
  cameraZoom: number;
  showCardBack: boolean;
  brushPosition: { x: number; y: number } | null;
}

interface BrushActions {
  setCurrentStrokeIndex: (index: number) => void;
  setBrushType: (type: BrushType) => void;
  setIsAnimating: (value: boolean) => void;
  setCanWrite: (value: boolean) => void;
  addStrokePoint: (point: Point) => void;
  clearStrokePoints: () => void;
  addScoreRecord: (record: ScoreRecord) => void;
  setCurrentScore: (score: number | null) => void;
  setCurrentSuggestion: (suggestion: string | null) => void;
  setDeviationAreas: (areas: DeviationArea[]) => void;
  setIsWriting: (value: boolean) => void;
  setGridSize: (size: number) => void;
  setCameraZoom: (zoom: number) => void;
  setShowCardBack: (value: boolean) => void;
  setBrushPosition: (pos: { x: number; y: number } | null) => void;
  nextStroke: () => void;
  prevStroke: () => void;
  resetForNewStroke: () => void;
}

export const useStore = create<BrushState & BrushActions>((set, get) => ({
  currentStrokeIndex: 0,
  brushType: 'jianhao',
  isAnimating: true,
  canWrite: false,
  userStrokePoints: [],
  scoreHistory: [],
  currentScore: null,
  currentSuggestion: null,
  deviationAreas: [],
  isWriting: false,
  gridSize: typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 80,
  cameraZoom: 1,
  showCardBack: false,
  brushPosition: null,

  setCurrentStrokeIndex: (index) => set({ currentStrokeIndex: index }),
  setBrushType: (type) => set({ brushType: type }),
  setIsAnimating: (value) => set({ isAnimating: value }),
  setCanWrite: (value) => set({ canWrite: value }),
  addStrokePoint: (point) =>
    set((state) => ({
      userStrokePoints: [...state.userStrokePoints, point],
    })),
  clearStrokePoints: () => set({ userStrokePoints: [], deviationAreas: [] }),
  addScoreRecord: (record) =>
    set((state) => ({
      scoreHistory: [...state.scoreHistory, record],
    })),
  setCurrentScore: (score) => set({ currentScore: score }),
  setCurrentSuggestion: (suggestion) => set({ currentSuggestion: suggestion }),
  setDeviationAreas: (areas) => set({ deviationAreas: areas }),
  setIsWriting: (value) => set({ isWriting: value }),
  setGridSize: (size) => set({ gridSize: size }),
  setCameraZoom: (zoom) => set({ cameraZoom: zoom }),
  setShowCardBack: (value) => set({ showCardBack: value }),
  setBrushPosition: (pos) => set({ brushPosition: pos }),

  nextStroke: () =>
    set((state) => ({
      currentStrokeIndex: Math.min(state.currentStrokeIndex + 1, 6),
    })),
  prevStroke: () =>
    set((state) => ({
      currentStrokeIndex: Math.max(state.currentStrokeIndex - 1, 0),
    })),
  resetForNewStroke: () =>
    set({
      userStrokePoints: [],
      currentScore: null,
      currentSuggestion: null,
      deviationAreas: [],
      isWriting: false,
      isAnimating: true,
      canWrite: false,
      showCardBack: false,
    }),
}));

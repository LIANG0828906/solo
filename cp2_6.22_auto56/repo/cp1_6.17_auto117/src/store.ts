import { create } from "zustand";
import type { Point } from "./RuneData";
import type { StrokeMatchResult } from "./CanvasEngine";

export interface HistoryRecord {
  id: string;
  runeName: string;
  date: string;
  success: boolean;
  matchScore: number;
}

interface AppState {
  selectedRuneId: string | null;
  currentStrokes: Point[][];
  currentStroke: Point[];
  matchResults: StrokeMatchResult[];
  isActivated: boolean;
  consecutiveFailures: number;
  showHint: boolean;
  history: HistoryRecord[];
  isDrawing: boolean;
  activationAnimation: boolean;
  lastStrokeScore: number | null;

  selectRune: (id: string) => void;
  startStroke: (point: Point) => void;
  addPoint: (point: Point) => void;
  endStroke: (result: StrokeMatchResult) => void;
  setMatchResults: (results: StrokeMatchResult[]) => void;
  activate: () => void;
  failActivation: () => void;
  resetCanvas: () => void;
  addHistory: (record: HistoryRecord) => void;
  setActivationAnimation: (v: boolean) => void;
  setLastStrokeScore: (score: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedRuneId: null,
  currentStrokes: [],
  currentStroke: [],
  matchResults: [],
  isActivated: false,
  consecutiveFailures: 0,
  showHint: false,
  history: [],
  isDrawing: false,
  activationAnimation: false,
  lastStrokeScore: null,

  selectRune: (id) =>
    set({
      selectedRuneId: id,
      currentStrokes: [],
      currentStroke: [],
      matchResults: [],
      isActivated: false,
      activationAnimation: false,
      lastStrokeScore: null,
      showHint: false,
    }),

  startStroke: (point) =>
    set((state) => ({
      isDrawing: true,
      currentStroke: [point],
      currentStrokes: state.isActivated ? [] : state.currentStrokes,
      isActivated: state.isActivated ? false : state.isActivated,
      activationAnimation: state.isActivated ? false : state.activationAnimation,
      matchResults: state.isActivated ? [] : state.matchResults,
      lastStrokeScore: null,
    })),

  addPoint: (point) =>
    set((state) => ({
      currentStroke: [...state.currentStroke, point],
    })),

  endStroke: (result) =>
    set((state) => ({
      isDrawing: false,
      currentStrokes: [...state.currentStrokes, state.currentStroke],
      currentStroke: [],
      matchResults: [...state.matchResults, result],
      lastStrokeScore: result.score,
    })),

  setMatchResults: (results) => set({ matchResults: results }),

  activate: () =>
    set({
      isActivated: true,
      activationAnimation: true,
      consecutiveFailures: 0,
    }),

  failActivation: () =>
    set((state) => {
      const newFailures = state.consecutiveFailures + 1;
      return {
        isActivated: false,
        consecutiveFailures: newFailures,
        showHint: newFailures >= 3,
      };
    }),

  resetCanvas: () =>
    set((state) => ({
      currentStrokes: [],
      currentStroke: [],
      matchResults: [],
      isActivated: false,
      activationAnimation: false,
      lastStrokeScore: null,
      isDrawing: false,
      showHint: state.consecutiveFailures >= 3,
    })),

  addHistory: (record) =>
    set((state) => ({
      history: [record, ...state.history].slice(0, 10),
    })),

  setActivationAnimation: (v) => set({ activationAnimation: v }),
  setLastStrokeScore: (score) => set({ lastStrokeScore: score }),
}));

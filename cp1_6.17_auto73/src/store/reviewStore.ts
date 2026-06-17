import { create } from 'zustand';

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  createdAt: number;
  order: number;
}

export interface DiffPixel {
  x: number;
  y: number;
  diffValue: number;
}

export interface SketchPair {
  left: string | null;
  right: string | null;
  leftDimensions: { width: number; height: number } | null;
  rightDimensions: { width: number; height: number } | null;
}

interface ReviewStore {
  sketchPair: SketchPair;
  diffPixels: DiffPixel[];
  diffPercentage: number;
  annotations: Annotation[];
  annotationCounter: number;
  isCompared: boolean;
  isComparing: boolean;
  comparisonProgress: number;
  uploadSketch: (side: 'left' | 'right', base64: string, dimensions: { width: number; height: number }) => void;
  setCurrentPair: (pair: Partial<SketchPair>) => void;
  setDiffResult: (pixels: DiffPixel[], percentage: number) => void;
  addAnnotation: (x: number, y: number, text: string) => void;
  setComparing: (comparing: boolean) => void;
  setProgress: (progress: number) => void;
  clearAll: () => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  sketchPair: {
    left: null,
    right: null,
    leftDimensions: null,
    rightDimensions: null,
  },
  diffPixels: [],
  diffPercentage: 0,
  annotations: [],
  annotationCounter: 0,
  isCompared: false,
  isComparing: false,
  comparisonProgress: 0,
  uploadSketch: (side, base64, dimensions) =>
    set((state) => ({
      sketchPair: {
        ...state.sketchPair,
        [side]: base64,
        [`${side}Dimensions`]: dimensions,
      },
      isCompared: false,
      diffPixels: [],
      diffPercentage: 0,
      annotations: [],
      annotationCounter: 0,
    })),
  setCurrentPair: (pair) =>
    set((state) => ({
      sketchPair: { ...state.sketchPair, ...pair },
    })),
  setDiffResult: (pixels, percentage) =>
    set({
      diffPixels: pixels,
      diffPercentage: percentage,
      isCompared: true,
      isComparing: false,
      comparisonProgress: 100,
    }),
  addAnnotation: (x, y, text) =>
    set((state) => {
      const newCounter = state.annotationCounter + 1;
      const annotation: Annotation = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x,
        y,
        text,
        createdAt: Date.now(),
        order: newCounter,
      };
      return {
        annotations: [...state.annotations, annotation],
        annotationCounter: newCounter,
      };
    }),
  setComparing: (comparing) => set({ isComparing: comparing }),
  setProgress: (progress) => set({ comparisonProgress: progress }),
  clearAll: () =>
    set({
      sketchPair: {
        left: null,
        right: null,
        leftDimensions: null,
        rightDimensions: null,
      },
      diffPixels: [],
      diffPercentage: 0,
      annotations: [],
      annotationCounter: 0,
      isCompared: false,
      isComparing: false,
      comparisonProgress: 0,
    }),
}));

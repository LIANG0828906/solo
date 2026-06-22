import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  timestamp: number;
}

export type ToolType = 'select' | 'pen' | 'eraser';

export interface GestureResult {
  type: 'none' | 'three-finger-swipe-left' | 'pinch' | 'rotate';
  params: Record<string, number>;
  timestamp: number;
}

export interface RecognitionResult {
  latex: string;
  confidence: number;
  timestamp: number;
  segments: RecognizedSegment[];
}

export interface RecognizedSegment {
  latex: string;
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  strokeIds: string[];
}

interface CanvasState {
  strokes: Stroke[];
  currentTool: ToolType;
  zoom: number;
  offset: { x: number; y: number };
  gestureState: GestureResult;
  recognitionResult: RecognitionResult;
  isDrawing: boolean;
  currentPoints: Point[];
  selectedStrokeId: string | null;
  showClearConfirm: boolean;

  addStroke: (points: Point[]) => string;
  removeLastStroke: () => void;
  clearStrokes: () => void;
  setCurrentTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  setGestureState: (state: GestureResult) => void;
  setRecognitionResult: (result: RecognitionResult) => void;
  setIsDrawing: (drawing: boolean) => void;
  setCurrentPoints: (points: Point[]) => void;
  addPoint: (point: Point) => void;
  eraseAt: (x: number, y: number, radius: number) => void;
  setSelectedStrokeId: (id: string | null) => void;
  setShowClearConfirm: (show: boolean) => void;
}

const defaultGesture: GestureResult = {
  type: 'none',
  params: {},
  timestamp: 0,
};

const defaultRecognition: RecognitionResult = {
  latex: '',
  confidence: 0,
  timestamp: 0,
  segments: [],
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  strokes: [],
  currentTool: 'pen',
  zoom: 1,
  offset: { x: 0, y: 0 },
  gestureState: defaultGesture,
  recognitionResult: defaultRecognition,
  isDrawing: false,
  currentPoints: [],
  selectedStrokeId: null,
  showClearConfirm: false,

  addStroke: (points: Point[]) => {
    if (points.length < 2) return '';
    const id = uuidv4();
    const stroke: Stroke = {
      id,
      points,
      color: '#1A237E',
      timestamp: Date.now(),
    };
    set((state) => ({
      strokes: [...state.strokes, stroke],
      currentPoints: [],
      isDrawing: false,
    }));
    return id;
  },

  removeLastStroke: () => {
    set((state) => {
      if (state.strokes.length === 0) return state;
      const newStrokes = state.strokes.slice(0, -1);
      return { strokes: newStrokes };
    });
  },

  clearStrokes: () => {
    set({
      strokes: [],
      currentPoints: [],
      selectedStrokeId: null,
      recognitionResult: defaultRecognition,
      showClearConfirm: false,
    });
  },

  setCurrentTool: (tool) => set({ currentTool: tool }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setOffset: (offset) => set({ offset }),

  setGestureState: (gestureState) => set({ gestureState }),

  setRecognitionResult: (recognitionResult) => set({ recognitionResult }),

  setIsDrawing: (isDrawing) => set({ isDrawing }),

  setCurrentPoints: (currentPoints) => set({ currentPoints }),

  addPoint: (point) => {
    set((state) => ({
      currentPoints: [...state.currentPoints, point],
    }));
  },

  eraseAt: (x, y, radius) => {
    set((state) => ({
      strokes: state.strokes.filter((stroke) => {
        return !stroke.points.some(
          (p) =>
            Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) <= radius
        );
      }),
    }));
  },

  setSelectedStrokeId: (id) => set({ selectedStrokeId: id }),

  setShowClearConfirm: (show) => set({ showClearConfirm: show }),
}));

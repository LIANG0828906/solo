import { create } from 'zustand';
import type { Point, PathData, Viewport, BrushType } from '@/utils/geometry';
import { generateId, generateSymmetricPaths, exportPathsToSvg } from '@/utils/geometry';

const MAX_HISTORY = 50;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;
const DISTANCE_THRESHOLD = 2.5;

export type FadeState = 'active' | 'fadingOut' | 'fadingIn';

export interface CanvasPath extends PathData {
  symmetricPaths: Point[][];
  timestamp: number;
  fadeState: FadeState;
  fadeOpacity: number;
}

interface CanvasState {
  paths: CanvasPath[];
  redoStack: CanvasPath[];
  viewport: Viewport;
  brush: BrushType;
  symmetry: number;
  currentColor: string;
  isDrawing: boolean;
  currentPathPoints: Point[];
  currentSymmetricPaths: Point[][];
  canvasSize: { width: number; height: number };
  transitioningViewport: Viewport | null;

  startDrawing: (p: Point) => void;
  continueDrawing: (p: Point) => void;
  endDrawing: () => void;
  setBrush: (b: BrushType) => void;
  setSymmetry: (n: number) => void;
  setColor: (c: string) => void;
  setViewport: (v: Partial<Viewport>) => void;
  setTransitionViewport: (v: Viewport | null) => void;
  setCanvasSize: (w: number, h: number) => void;
  undo: () => void;
  redo: () => void;
  markFadeComplete: (id: string, action: 'remove' | 'activate') => void;
  getCenter: () => Point;
  exportSVG: () => string;
}

function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  paths: [],
  redoStack: [],
  viewport: { scale: 1, offsetX: 0, offsetY: 0 },
  brush: 'dot',
  symmetry: 6,
  currentColor: '#E91E63',
  isDrawing: false,
  currentPathPoints: [],
  currentSymmetricPaths: [],
  canvasSize: { width: 800, height: 600 },
  transitioningViewport: null,

  getCenter: (): Point => {
    const { canvasSize, viewport } = get();
    return {
      x: canvasSize.width / 2 - viewport.offsetX / viewport.scale,
      y: canvasSize.height / 2 - viewport.offsetY / viewport.scale
    };
  },

  setCanvasSize: (w: number, h: number) => {
    set({ canvasSize: { width: w, height: h } });
  },

  startDrawing: (p: Point) => {
    const center = get().getCenter();
    const pts = [p];
    const symPaths = generateSymmetricPaths(pts, center, get().symmetry);
    set({
      isDrawing: true,
      currentPathPoints: pts,
      currentSymmetricPaths: symPaths
    });
  },

  continueDrawing: (p: Point) => {
    const s = get();
    if (!s.isDrawing) return;
    const last = s.currentPathPoints[s.currentPathPoints.length - 1];
    if (last && distance(last, p) < DISTANCE_THRESHOLD) return;
    const newPoints = [...s.currentPathPoints, p];
    const center = s.getCenter();
    const symPaths = generateSymmetricPaths(newPoints, center, s.symmetry);
    set({
      currentPathPoints: newPoints,
      currentSymmetricPaths: symPaths
    });
  },

  endDrawing: () => {
    const s = get();
    if (!s.isDrawing || s.currentPathPoints.length < 1) {
      set({ isDrawing: false, currentPathPoints: [], currentSymmetricPaths: [] });
      return;
    }
    const center = s.getCenter();
    const symPaths = generateSymmetricPaths(s.currentPathPoints, center, s.symmetry);
    const newPath: CanvasPath = {
      id: generateId(),
      points: [...s.currentPathPoints],
      symmetricPaths: symPaths,
      brush: s.brush,
      color: s.currentColor,
      startHue: 0,
      endHue: 360,
      opacity: 0.8,
      timestamp: Date.now(),
      fadeState: 'active',
      fadeOpacity: 1
    };
    const newPaths = [...s.paths, newPath];
    if (newPaths.length > MAX_HISTORY) {
      newPaths.splice(0, newPaths.length - MAX_HISTORY);
    }
    set({
      paths: newPaths,
      redoStack: [],
      isDrawing: false,
      currentPathPoints: [],
      currentSymmetricPaths: []
    });
  },

  setBrush: (b: BrushType) => set({ brush: b }),

  setSymmetry: (n: number) => {
    const clamped = Math.max(3, Math.min(12, Math.round(n)));
    const s = get();
    set({ symmetry: clamped });
    if (s.isDrawing && s.currentPathPoints.length > 0) {
      const center = s.getCenter();
      set({ currentSymmetricPaths: generateSymmetricPaths(s.currentPathPoints, center, clamped) });
    }
  },

  setColor: (c: string) => set({ currentColor: c }),

  setViewport: (v: Partial<Viewport>) => {
    const cur = get().viewport;
    const next: Viewport = {
      scale: v.scale !== undefined ? Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale)) : cur.scale,
      offsetX: v.offsetX !== undefined ? v.offsetX : cur.offsetX,
      offsetY: v.offsetY !== undefined ? v.offsetY : cur.offsetY
    };
    set({ viewport: next });
  },

  setTransitionViewport: (v: Viewport | null) => {
    set({ transitioningViewport: v });
  },

  undo: () => {
    const s = get();
    if (s.paths.length === 0) return;
    const pathsCopy = [...s.paths];
    const last = pathsCopy.pop()!;
    const updatedLast: CanvasPath = { ...last, fadeState: 'fadingOut', fadeOpacity: 1 };
    pathsCopy.push(updatedLast);
    set({
      paths: pathsCopy,
      redoStack: [...s.redoStack, { ...last, fadeState: 'fadingIn', fadeOpacity: 0 }]
    });
    setTimeout(() => {
      const cur = get();
      set({
        paths: cur.paths.filter(p => p.id !== last.id),
        redoStack: cur.redoStack.map(p =>
          p.id === last.id ? { ...p, fadeState: 'fadingIn', fadeOpacity: 0 } : p
        )
      });
    }, 400);
  },

  redo: () => {
    const s = get();
    if (s.redoStack.length === 0) return;
    const redoCopy = [...s.redoStack];
    const first = redoCopy.pop()!;
    const restored: CanvasPath = { ...first, fadeState: 'fadingIn', fadeOpacity: 0 };
    set({
      paths: [...s.paths, restored],
      redoStack: redoCopy
    });
    requestAnimationFrame(() => {
      set(state => ({
        paths: state.paths.map(p =>
          p.id === first.id ? { ...p, fadeState: 'active', fadeOpacity: 1 } : p
        )
      }));
    });
  },

  markFadeComplete: (id: string, action: 'remove' | 'activate') => {
    set(state => {
      if (action === 'remove') {
        return { paths: state.paths.filter(p => p.id !== id) };
      }
      return {
        paths: state.paths.map(p =>
          p.id === id ? { ...p, fadeState: 'active', fadeOpacity: 1 } : p
        )
      };
    });
  },

  exportSVG: (): string => {
    const s = get();
    const center = s.getCenter();
    const pathDataList: PathData[] = s.paths.map(p => ({
      id: p.id,
      points: p.points,
      brush: p.brush,
      color: p.color,
      startHue: p.startHue,
      endHue: p.endHue,
      opacity: p.opacity * p.fadeOpacity
    }));
    return exportPathsToSvg(pathDataList, s.symmetry, center);
  }
}));

export function screenToWorld(sx: number, sy: number, viewport: Viewport): Point {
  return {
    x: (sx - viewport.offsetX) / viewport.scale,
    y: (sy - viewport.offsetY) / viewport.scale
  };
}

import { create } from 'zustand';

export interface Point2D {
  x: number;
  y: number;
  timestamp: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface CameraState {
  x: number;
  y: number;
  z: number;
}

interface AppState {
  pathPoints: Point2D[];
  isDrawing: boolean;
  particleDensity: number;
  pathColor: string;
  cameraPosition: CameraState;
  lastDrawTime: number;
  growthPhase: 'idle' | 'drawing' | 'growing' | 'complete';
  setPathPoints: (points: Point2D[] | ((prev: Point2D[]) => Point2D[])) => void;
  addPathPoint: (point: Point2D) => void;
  setIsDrawing: (drawing: boolean) => void;
  setParticleDensity: (density: number) => void;
  setPathColor: (color: string) => void;
  setCameraPosition: (pos: CameraState) => void;
  setLastDrawTime: (time: number) => void;
  setGrowthPhase: (phase: 'idle' | 'drawing' | 'growing' | 'complete') => void;
  resetPath: () => void;
}

const douglasPeucker = (points: Point2D[], epsilon: number): Point2D[] => {
  if (points.length < 3) return points;

  const perpDistance = (p: Point2D, p1: Point2D, p2: Point2D): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return Math.sqrt((p.x - p1.x) ** 2 + (p.y - p1.y) ** 2);
    return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / len;
  };

  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = perpDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      index = i;
      maxDist = dist;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[end]];
};

const simplifyPath = (points: Point2D[]): Point2D[] => {
  if (points.length <= 500) return points;
  return douglasPeucker(points, 0.1);
};

export const useAppStore = create<AppState>((set, get) => ({
  pathPoints: [],
  isDrawing: false,
  particleDensity: 12,
  pathColor: '#FF6B6B',
  cameraPosition: { x: 0, y: 6, z: 8 },
  lastDrawTime: 0,
  growthPhase: 'idle',

  setPathPoints: (points) => {
    const newPoints = typeof points === 'function' ? points(get().pathPoints) : points;
    set({ pathPoints: simplifyPath(newPoints) });
  },

  addPathPoint: (point) => {
    const current = get().pathPoints;
    const updated = [...current, point];
    set({ pathPoints: simplifyPath(updated) });
  },

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setParticleDensity: (density) => set({ particleDensity: Math.max(5, Math.min(20, density)) }),
  setPathColor: (color) => set({ pathColor: color }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setLastDrawTime: (time) => set({ lastDrawTime: time }),
  setGrowthPhase: (phase) => set({ growthPhase: phase }),

  resetPath: () => set({
    pathPoints: [],
    growthPhase: 'idle',
    isDrawing: false
  })
}));

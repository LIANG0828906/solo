import { create } from 'zustand';

export interface InkPoint {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  birthTime: number;
  explosionDuration: number;
  diffusionDuration: number;
  isGrowing: boolean;
  opacity: number;
  connectedTo: string | null;
  blendOpacity: number;
}

interface SimState {
  inkPoints: InkPoint[];
  canvasWidth: number;
  canvasHeight: number;
  isSimulating: boolean;
  maxInkPoints: number;

  addInkPoint: (x: number, y: number, connectedTo?: string) => void;
  advanceDiffusion: (deltaTime: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  clearAll: () => void;
  undoLast: (count: number) => void;
}

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useSimStore = create<SimState>((set, get) => ({
  inkPoints: [],
  canvasWidth: window.innerWidth,
  canvasHeight: window.innerHeight,
  isSimulating: true,
  maxInkPoints: 500,

  addInkPoint: (x: number, y: number, connectedTo?: string) => {
    const state = get();
    if (state.inkPoints.length >= state.maxInkPoints) return;

    const now = performance.now();
    const initialRadius = 8;
    const maxRadius = initialRadius * Math.pow(1.005, 1800);

    const newPoint: InkPoint = {
      id: generateId(),
      x,
      y,
      radius: 0,
      maxRadius,
      birthTime: now,
      explosionDuration: 200,
      diffusionDuration: 30000,
      isGrowing: true,
      opacity: 1,
      connectedTo: connectedTo || null,
      blendOpacity: 0,
    };

    set((state) => ({
      inkPoints: [...state.inkPoints, newPoint],
    }));
  },

  advanceDiffusion: (deltaTime: number) => {
    set((state) => {
      const now = performance.now();
      const updatedPoints = state.inkPoints.map((point) => {
        if (!point.isGrowing) return point;

        const age = now - point.birthTime;
        let newRadius = point.radius;
        let newBlendOpacity = 0;

        if (age < point.explosionDuration) {
          const progress = age / point.explosionDuration;
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          newRadius = 8 * easeProgress;
        } else if (age < point.explosionDuration + point.diffusionDuration) {
          const growthRate = 0.005 * (deltaTime / 16.67);
          newRadius = point.radius * (1 + growthRate);
          if (newRadius >= point.maxRadius) {
            newRadius = point.maxRadius;
          }
        }

        const isGrowing = age < point.explosionDuration + point.diffusionDuration && newRadius < point.maxRadius;

        for (const other of state.inkPoints) {
          if (other.id === point.id) continue;
          const dx = point.x - other.x;
          const dy = point.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = newRadius + other.radius;

          if (dist < minDist) {
            const overlap = (minDist - dist) / Math.min(newRadius, other.radius);
            newBlendOpacity = Math.min(0.5, Math.max(newBlendOpacity, overlap * 0.5));
          }
        }

        return {
          ...point,
          radius: newRadius,
          isGrowing,
          blendOpacity: newBlendOpacity,
        };
      });

      return { inkPoints: updatedPoints };
    });
  },

  setCanvasSize: (width: number, height: number) => {
    set({ canvasWidth: width, canvasHeight: height });
  },

  clearAll: () => {
    set({ inkPoints: [] });
  },

  undoLast: (count: number) => {
    set((state) => ({
      inkPoints: state.inkPoints.slice(0, Math.max(0, state.inkPoints.length - count)),
    }));
  },
}));

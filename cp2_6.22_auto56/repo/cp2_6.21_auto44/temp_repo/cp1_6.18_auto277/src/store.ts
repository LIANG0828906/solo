import { create } from 'zustand';

export type Step = 'shaping' | 'glazing' | 'firing';

export interface GlazeSpot {
  x: number;
  y: number;
  intensity: number;
  color: string;
}

interface PotteryState {
  shapePoints: number[];
  currentStep: Step;
  glazeCoverage: number;
  firingProgress: number;
  isDragging: boolean;
  dragStartY: number;
  dragStartPointIndex: number;
  glazeSpots: GlazeSpot[];
  potteryHeight: number;
  potteryWeight: number;
  isFiring: boolean;
  deformPottery: (pointIndex: number, delta: number) => void;
  addGlazeSpot: (x: number, y: number) => void;
  calculateCoverage: () => number;
  startFiring: () => void;
  updateFiringProgress: (delta: number) => void;
  setCurrentStep: (step: Step) => void;
  setDragging: (dragging: boolean, y?: number, index?: number) => void;
}

const interpolateColor = (t: number): string => {
  const r1 = 135, g1 = 206, b1 = 235;
  const r2 = 138, g2 = 43, b2 = 226;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const usePotteryStore = create<PotteryState>((set) => ({
  shapePoints: Array(24).fill(1),
  currentStep: 'shaping',
  glazeCoverage: 0,
  firingProgress: 0,
  isDragging: false,
  dragStartY: 0,
  dragStartPointIndex: 0,
  glazeSpots: [],
  potteryHeight: 3,
  potteryWeight: 3.6,
  isFiring: false,

  deformPottery: (pointIndex: number, delta: number) => {
    set((state) => {
      const newPoints = [...state.shapePoints];
      const clamp = (val: number) => Math.max(0.1, Math.min(2.5, val));
      
      newPoints[pointIndex] = clamp(newPoints[pointIndex] + delta);
      
      const prevIndex = (pointIndex - 1 + 24) % 24;
      const nextIndex = (pointIndex + 1) % 24;
      newPoints[prevIndex] = clamp(newPoints[prevIndex] + delta * 0.3);
      newPoints[nextIndex] = clamp(newPoints[nextIndex] + delta * 0.3);
      
      const height = newPoints.reduce((sum, p) => sum + p, 0) / 24;
      const weight = height * 1.2;
      
      return {
        shapePoints: newPoints,
        potteryHeight: height,
        potteryWeight: weight,
      };
    });
  },

  addGlazeSpot: (x: number, y: number) => {
    set((state) => {
      const spots = [...state.glazeSpots];
      let foundNearby = false;
      
      for (let i = 0; i < spots.length; i++) {
        const spot = spots[i];
        const dist = Math.sqrt((spot.x - x) ** 2 + (spot.y - y) ** 2);
        if (dist < 0.15) {
          spots[i] = {
            ...spot,
            intensity: Math.min(5, spot.intensity + 1),
          };
          foundNearby = true;
          break;
        }
      }
      
      if (!foundNearby) {
        const t = Math.random();
        spots.push({
          x,
          y,
          intensity: 1,
          color: interpolateColor(t),
        });
      }
      
      const newState = { glazeSpots: spots };
      
      const gridSize = 50;
      const spotRadius = 0.3;
      let covered = 0;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const gx = i / gridSize;
          const gy = j / gridSize;
          for (const spot of spots) {
            const dist = Math.sqrt((spot.x - gx) ** 2 + (spot.y - gy) ** 2);
            if (dist < spotRadius) {
              covered++;
              break;
            }
          }
        }
      }
      
      return {
        ...newState,
        glazeCoverage: covered / (gridSize * gridSize),
      };
    });
  },

  calculateCoverage: () => {
    set((state) => {
      const gridSize = 50;
      const spotRadius = 0.3;
      let covered = 0;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const gx = i / gridSize;
          const gy = j / gridSize;
          for (const spot of state.glazeSpots) {
            const dist = Math.sqrt((spot.x - gx) ** 2 + (spot.y - gy) ** 2);
            if (dist < spotRadius) {
              covered++;
              break;
            }
          }
        }
      }
      
      return {
        glazeCoverage: covered / (gridSize * gridSize),
      };
    });
  },

  startFiring: () => {
    set({
      isFiring: true,
      currentStep: 'firing',
    });
  },

  updateFiringProgress: (delta: number) => {
    set((state) => {
      if (!state.isFiring) return {};
      
      const newProgress = state.firingProgress + delta / 8000;
      
      if (newProgress >= 1) {
        return {
          firingProgress: 1,
          isFiring: false,
        };
      }
      
      return {
        firingProgress: newProgress,
      };
    });
  },

  setCurrentStep: (step: Step) => {
    set((state) => {
      if (state.isFiring) return {};
      return { currentStep: step };
    });
  },

  setDragging: (dragging: boolean, y?: number, index?: number) => {
    set((state) => ({
      isDragging: dragging,
      dragStartY: y !== undefined ? y : state.dragStartY,
      dragStartPointIndex: index !== undefined ? index : state.dragStartPointIndex,
    }));
  },
}));

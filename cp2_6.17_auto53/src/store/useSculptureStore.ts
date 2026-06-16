import { create } from 'zustand';

export type NeonColor = '#FF007F' | '#00F0FF' | '#39FF14' | '#BF00FF';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface LightLine {
  id: string;
  points: Point3D[];
  color: NeonColor;
  createdAt: number;
}

interface SculptureState {
  lines: LightLine[];
  currentColor: NeonColor;
  isDrawing: boolean;
  currentPoints: Point3D[];
  backgroundColor: string;
  isDissolving: boolean;

  startDrawing: () => void;
  addPoint: (point: Point3D) => void;
  finishDrawing: () => void;
  setColor: (color: NeonColor) => void;
  clearAll: () => void;
  setDissolving: (value: boolean) => void;
  resetAfterDissolve: () => void;
}

export const NEON_COLORS: NeonColor[] = ['#FF007F', '#00F0FF', '#39FF14', '#BF00FF'];

export const COLOR_BACKGROUNDS: Record<NeonColor, string> = {
  '#FF007F': '#1A0033',
  '#00F0FF': '#001A2E',
  '#39FF14': '#0A1F00',
  '#BF00FF': '#1A0033',
};

export const MAX_LINES = 50;
export const MAX_POINTS_PER_LINE = 50;

const getRandomColor = (): NeonColor => {
  return NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useSculptureStore = create<SculptureState>((set, get) => ({
  lines: [],
  currentColor: getRandomColor(),
  isDrawing: false,
  currentPoints: [],
  backgroundColor: '#0D0D2B',
  isDissolving: false,

  startDrawing: () => {
    set({ isDrawing: true, currentPoints: [] });
  },

  addPoint: (point: Point3D) => {
    const { currentPoints } = get();
    if (currentPoints.length < MAX_POINTS_PER_LINE) {
      set({ currentPoints: [...currentPoints, point] });
    }
  },

  finishDrawing: () => {
    const { currentPoints, currentColor, lines } = get();
    if (currentPoints.length >= 2) {
      const newLine: LightLine = {
        id: generateId(),
        points: [...currentPoints],
        color: currentColor,
        createdAt: Date.now(),
      };
      const newLines = [...lines, newLine];
      if (newLines.length > MAX_LINES) {
        newLines.shift();
      }
      set({ lines: newLines });
    }
    set({ isDrawing: false, currentPoints: [] });
  },

  setColor: (color: NeonColor) => {
    set({ currentColor: color, backgroundColor: COLOR_BACKGROUNDS[color] });
  },

  clearAll: () => {
    set({ isDissolving: true });
  },

  setDissolving: (value: boolean) => {
    set({ isDissolving: value });
  },

  resetAfterDissolve: () => {
    set({ lines: [], isDissolving: false });
  },
}));

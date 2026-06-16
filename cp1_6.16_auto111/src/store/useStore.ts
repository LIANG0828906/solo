import { create } from 'zustand';
import type { ColorItem, Shape, CanvasSize } from '@/types';
import {
  DEFAULT_COLORS,
  MIN_COLORS,
  MAX_COLORS,
  MIN_CANVAS_WIDTH,
  MAX_CANVAS_WIDTH,
  MIN_CANVAS_HEIGHT,
  MAX_CANVAS_HEIGHT,
} from '@/types';
import { generateShapes, createShapeAtPosition } from '@/utils/shapeGenerator';
import { clampShapeToCanvas } from '@/utils/collision';

interface PosterState {
  colors: ColorItem[];
  shapes: Shape[];
  canvasSize: CanvasSize;
  draggingShapeId: string | null;

  setColors: (colors: ColorItem[]) => void;
  updateColor: (id: string, color: string) => void;
  addColor: () => void;
  removeColor: (id: string) => void;
  reorderColors: (fromIndex: number, toIndex: number) => void;

  setShapes: (shapes: Shape[]) => void;
  updateShapePosition: (id: string, x: number, y: number) => void;
  addShapeAt: (x: number, y: number) => void;
  removeShape: (id: string) => void;
  regenerateShapes: () => void;
  setDraggingShapeId: (id: string | null) => void;

  setCanvasSize: (width: number, height: number) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const initialColors: ColorItem[] = DEFAULT_COLORS.map((color) => ({
  id: generateId(),
  color,
}));

const initialCanvasSize: CanvasSize = {
  width: 800,
  height: 600,
};

const initialShapes = generateShapes(initialCanvasSize, initialColors.length);

export const useStore = create<PosterState>((set, get) => ({
  colors: initialColors,
  shapes: initialShapes,
  canvasSize: initialCanvasSize,
  draggingShapeId: null,

  setColors: (colors) => set({ colors }),

  updateColor: (id, color) =>
    set((state) => ({
      colors: state.colors.map((c) =>
        c.id === id ? { ...c, color } : c
      ),
    })),

  addColor: () =>
    set((state) => {
      if (state.colors.length >= MAX_COLORS) return state;
      const newColor: ColorItem = {
        id: generateId(),
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      };
      return {
        colors: [...state.colors, newColor],
      };
    }),

  removeColor: (id) =>
    set((state) => {
      if (state.colors.length <= MIN_COLORS) return state;
      const newColors = state.colors.filter((c) => c.id !== id);
      const newShapes = state.shapes.map((shape) => ({
        ...shape,
        colorIndex: shape.colorIndex % newColors.length,
      }));
      return {
        colors: newColors,
        shapes: newShapes,
      };
    }),

  reorderColors: (fromIndex, toIndex) =>
    set((state) => {
      const newColors = [...state.colors];
      const [removed] = newColors.splice(fromIndex, 1);
      newColors.splice(toIndex, 0, removed);
      return { colors: newColors };
    }),

  setShapes: (shapes) => set({ shapes }),

  updateShapePosition: (id, x, y) =>
    set((state) => {
      const { canvasSize } = state;
      const shape = state.shapes.find((s) => s.id === id);
      if (!shape) return state;

      const clampedShape = clampShapeToCanvas(
        { ...shape, x, y },
        canvasSize.width,
        canvasSize.height
      );

      return {
        shapes: state.shapes.map((s) =>
          s.id === id
            ? { ...s, x: clampedShape.x, y: clampedShape.y }
            : s
        ),
      };
    }),

  addShapeAt: (x, y) =>
    set((state) => {
      const newShape = createShapeAtPosition(x, y, state.colors.length);
      const clampedShape = clampShapeToCanvas(
        newShape,
        state.canvasSize.width,
        state.canvasSize.height
      );
      return {
        shapes: [...state.shapes, clampedShape],
      };
    }),

  removeShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
    })),

  regenerateShapes: () =>
    set((state) => ({
      shapes: generateShapes(state.canvasSize, state.colors.length),
    })),

  setDraggingShapeId: (id) => set({ draggingShapeId: id }),

  setCanvasSize: (width, height) => {
    const clampedWidth = Math.max(
      MIN_CANVAS_WIDTH,
      Math.min(MAX_CANVAS_WIDTH, width)
    );
    const clampedHeight = Math.max(
      MIN_CANVAS_HEIGHT,
      Math.min(MAX_CANVAS_HEIGHT, height)
    );

    set((state) => {
      const newSize = { width: clampedWidth, height: clampedHeight };
      const newShapes = generateShapes(newSize, state.colors.length);
      return {
        canvasSize: newSize,
        shapes: newShapes,
      };
    });
  },
}));

import type { Shape, ShapeType, CanvasSize } from '@/types';
import {
  MIN_SHAPES,
  MAX_SHAPES,
  MIN_SHAPE_SIZE,
  MAX_SHAPE_SIZE,
} from '@/types';
import { checkCollisionsWithAll, isInCanvas } from './collision';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomShapeType(): ShapeType {
  const types: ShapeType[] = ['circle', 'triangle', 'diamond'];
  return types[randomInt(0, types.length - 1)];
}

export function generateRandomShape(
  canvasWidth: number,
  canvasHeight: number,
  colorsCount: number,
  existingShapes: Shape[] = []
): Shape | null {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const size = randomInt(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);
    const halfSize = size / 2;
    const x = randomInt(halfSize, canvasWidth - halfSize);
    const y = randomInt(halfSize, canvasHeight - halfSize);
    const colorIndex = randomInt(0, colorsCount - 1);

    const shape: Shape = {
      id: generateId(),
      type: getRandomShapeType(),
      x,
      y,
      size,
      colorIndex,
    };

    if (
      isInCanvas(shape, canvasWidth, canvasHeight) &&
      !checkCollisionsWithAll(shape, existingShapes)
    ) {
      return shape;
    }

    attempts++;
  }

  return null;
}

export function generateShapes(
  canvasSize: CanvasSize,
  colorsCount: number
): Shape[] {
  const shapes: Shape[] = [];
  const targetCount = randomInt(MIN_SHAPES, MAX_SHAPES);
  const maxAttempts = targetCount * 10;
  let attempts = 0;

  while (shapes.length < targetCount && attempts < maxAttempts) {
    const shape = generateRandomShape(
      canvasSize.width,
      canvasSize.height,
      colorsCount,
      shapes
    );
    if (shape) {
      shapes.push(shape);
    }
    attempts++;
  }

  return shapes;
}

export function createShapeAtPosition(
  x: number,
  y: number,
  colorsCount: number
): Shape {
  const size = randomInt(MIN_SHAPE_SIZE, MAX_SHAPE_SIZE);
  const colorIndex = randomInt(0, colorsCount - 1);

  return {
    id: generateId(),
    type: getRandomShapeType(),
    x,
    y,
    size,
    colorIndex,
  };
}

import { v4 as uuidv4 } from 'uuid';
import type {
  Point,
  BoardElement,
  ShapeElement,
  PathElement,
  TextElement,
  ImageElement,
  ShapeType,
} from '../types/board';

export const GRID_SIZE = 20;

export function generateId(): string {
  return uuidv4();
}

export function getMousePos(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  zoom: number,
  offset: Point
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / zoom - offset.x,
    y: (clientY - rect.top) / zoom - offset.y,
  };
}

export function snapToGrid(value: number, gridSize: number = GRID_SIZE): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(point: Point, gridSize: number = GRID_SIZE): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getElementCenter(element: BoardElement): Point {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
}

export function pointInRect(point: Point, element: BoardElement, padding: number = 0): boolean {
  const cos = Math.cos((element.rotation * Math.PI) / 180);
  const sin = Math.sin((element.rotation * Math.PI) / 180);
  const center = getElementCenter(element);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  const localX = dx * cos + dy * sin;
  const localY = -dx * sin + dy * cos;

  const halfW = element.width / 2 + padding;
  const halfH = element.height / 2 + padding;

  return localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH;
}

export function getHandlePositions(element: BoardElement): Record<string, Point> {
  const cos = Math.cos((element.rotation * Math.PI) / 180);
  const sin = Math.sin((element.rotation * Math.PI) / 180);
  const center = getElementCenter(element);
  const hw = element.width / 2;
  const hh = element.height / 2;

  const handles: Record<string, { x: number; y: number }> = {
    nw: { x: -hw, y: -hh },
    n:  { x: 0,    y: -hh },
    ne: { x: hw,  y: -hh },
    e:  { x: hw,  y: 0 },
    se: { x: hw,  y: hh },
    s:  { x: 0,    y: hh },
    sw: { x: -hw, y: hh },
    w:  { x: -hw, y: 0 },
    rotate: { x: 0, y: -hh - 40 },
  };

  const result: Record<string, Point> = {};
  for (const [key, pos] of Object.entries(handles)) {
    result[key] = {
      x: center.x + pos.x * cos - pos.y * sin,
      y: center.y + pos.x * sin + pos.y * cos,
    };
  }
  return result;
}

export function getHandleAtPoint(
  point: Point,
  element: BoardElement,
  zoom: number
): string | null {
  const handleSize = 10 / zoom;
  const handles = getHandlePositions(element);

  for (const [name, pos] of Object.entries(handles)) {
    if (
      point.x >= pos.x - handleSize &&
      point.x <= pos.x + handleSize &&
      point.y >= pos.y - handleSize &&
      point.y <= pos.y + handleSize
    ) {
      return name;
    }
  }
  return null;
}

export function createShapeElement(
  shapeType: ShapeType,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  zIndex: number
): ShapeElement {
  return {
    id: generateId(),
    type: 'shape',
    shapeType,
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    zIndex,
    fillColor,
    strokeColor,
    strokeWidth,
  };
}

export function createPathElement(
  points: Point[],
  strokeColor: string,
  strokeWidth: number,
  zIndex: number
): PathElement {
  if (points.length === 0) {
    points = [{ x: 0, y: 0 }];
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const localPoints = points.map((p) => ({ x: p.x - minX, y: p.y - minY }));

  return {
    id: generateId(),
    type: 'path',
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    rotation: 0,
    opacity: 1,
    zIndex,
    points: localPoints,
    strokeColor,
    strokeWidth,
  };
}

export function createTextElement(
  x: number,
  y: number,
  text: string,
  color: string,
  zIndex: number
): TextElement {
  const fontSize = 20;
  const fontFamily = 'Inter, sans-serif';
  const width = Math.max(text.length * fontSize * 0.6, 40);
  const height = fontSize * 1.4;

  return {
    id: generateId(),
    type: 'text',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    zIndex,
    text,
    fontFamily,
    fontSize,
    color,
  };
}

export function createImageElement(
  x: number,
  y: number,
  width: number,
  height: number,
  src: string,
  zIndex: number,
  alt?: string
): ImageElement {
  return {
    id: generateId(),
    type: 'image',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    zIndex,
    src,
    alt,
  };
}

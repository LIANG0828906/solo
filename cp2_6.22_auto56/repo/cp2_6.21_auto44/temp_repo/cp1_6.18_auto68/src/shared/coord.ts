export function gridToPixel(col: number, row: number, cellSize: number): { x: number; y: number } {
  return { x: col * cellSize, y: row * cellSize };
}

export function pixelToGrid(x: number, y: number, cellSize: number): { col: number; row: number } {
  return { col: Math.floor(x / cellSize), row: Math.floor(y / cellSize) };
}

export function gridToCenter(col: number, row: number, cellSize: number): { x: number; y: number } {
  return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += Math.PI * 2;
  while (angle >= Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function getCellKey(col: number, row: number): string {
  return `${col},${row}`;
}

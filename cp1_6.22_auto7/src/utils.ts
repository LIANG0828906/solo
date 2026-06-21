export type Tool = 'pencil' | 'eraser' | 'eyedropper' | 'fill';
export type Pixel = { x: number; y: number; color: string };
export type HistoryEntry = {
  pixels: Pixel[];
  previousColors: string[];
};

export const CANVAS_SIZE = 32;
export const PIXEL_SIZE = 20;
export const MAX_HISTORY = 50;

export const PRESET_COLORS = [
  '#000000', '#ffffff', '#ff6b6b', '#4ecdc4',
  '#ffe66d', '#95e1d3', '#f38181', '#aa96da',
  '#fcbad3', '#a8d8ea', '#6c5ce7', '#00b894',
  '#e17055', '#fdcb6e', '#74b9ff', '#a29bfe'
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function isValidColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

export function createEmptyGrid(size: number, bgColor: string = '#ffffff'): string[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => bgColor)
  );
}

export function cloneGrid(grid: string[][]): string[][] {
  return grid.map(row => [...row]);
}

export function getPixelFromEvent(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  scale: number
): { x: number; y: number } | null {
  const x = Math.floor((clientX - rect.left) / (PIXEL_SIZE * scale));
  const y = Math.floor((clientY - rect.top) / (PIXEL_SIZE * scale));
  if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return null;
  return { x, y };
}

export function floodFill(
  grid: string[][],
  startX: number,
  startY: number,
  fillColor: string
): { pixels: Pixel[]; newGrid: string[][] } {
  const targetColor = grid[startY][startX];
  if (targetColor === fillColor) {
    return { pixels: [], newGrid: grid };
  }

  const newGrid = cloneGrid(grid);
  const pixels: Pixel[] = [];
  const stack: Array<{ x: number; y: number; depth: number }> = [{ x: startX, y: startY, depth: 0 }];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const { x, y, depth } = stack.pop()!;
    if (depth > 1000) continue;

    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) continue;
    if (newGrid[y][x] !== targetColor) continue;

    visited.add(key);
    newGrid[y][x] = fillColor;
    pixels.push({ x, y, color: fillColor });

    stack.push({ x: x + 1, y, depth: depth + 1 });
    stack.push({ x: x - 1, y, depth: depth + 1 });
    stack.push({ x, y: y + 1, depth: depth + 1 });
    stack.push({ x, y: y - 1, depth: depth + 1 });
  }

  return { pixels, newGrid };
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  push(entry: HistoryEntry): void {
    if (this.undoStack.length >= MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.undoStack.push(entry);
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (entry) {
      this.redoStack.push(entry);
    }
    return entry || null;
  }

  redo(): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (entry) {
      this.undoStack.push(entry);
    }
    return entry || null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export function playInkSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);

    setTimeout(() => ctx.close(), 100);
  } catch {
    // ignore audio errors
  }
}

export function getEraserPixels(centerX: number, centerY: number, size: number): Pixel[] {
  const pixels: Pixel[] = [];
  const half = Math.floor(size / 2);

  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE) {
        pixels.push({ x, y, color: '#ffffff' });
      }
    }
  }

  return pixels;
}

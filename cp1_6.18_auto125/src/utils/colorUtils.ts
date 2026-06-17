export type AlgorithmType = 'eightQueens' | 'aStar' | 'binaryTree';

export type PlaybackState = 'idle' | 'playing' | 'paused';

export interface EightQueensInfo {
  currentRow: number;
  placedQueens: number;
  backtrackCount: number;
}

export interface AStarInfo {
  exploredNodes: number;
  currentPathLength: number;
  heuristicEstimate: number;
}

export interface BinaryTreeInfo {
  currentNodeValue: number | null;
  visitOrderIndex: number;
}

export type InfoData = EightQueensInfo | AStarInfo | BinaryTreeInfo;

export interface HighlightItem {
  id: string;
  type: 'queen' | 'cell' | 'node' | 'path' | 'obstacle' | 'edge';
  position?: { row: number; col: number } | { x: number; y: number } | { id: string };
  effect: 'pulse' | 'border' | 'scale';
}

export interface StepSnapshot {
  stepIndex: number;
  description: string;
  highlightedItems: HighlightItem[];
  completedItems: string[];
  placedItems: string[];
  infoData: InfoData;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getGradientColor(index: number, total: number, startColor = '#4ECDC4', endColor = '#FF6B6B'): string {
  if (total <= 1) return startColor;
  const t = index / (total - 1);
  return lerpColor(startColor, endColor, t);
}

export type Tag = 'urgent' | 'inspiration' | 'pending';

export interface InspirationNode {
  id: string;
  title: string;
  tag: Tag;
  color: string;
  priority: number;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
  collapsed: boolean;
  createdAt: number;
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'strong' | 'weak';
}

export interface AnimatedNode {
  node: InspirationNode;
  scale: number;
  opacity: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
  type: 'add' | 'move';
}

export interface Fragment {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  startTime: number;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export const TAG_COLORS: Record<Tag, string> = {
  urgent: '#FF6B6B',
  inspiration: '#4ECDC4',
  pending: '#FFD93D',
};

export const TAG_LABELS: Record<Tag, string> = {
  urgent: '紧急',
  inspiration: '灵感',
  pending: '待定',
};

export const PRIORITY_GRADIENT = [
  { value: 0, color: '#4ECDC4' },
  { value: 50, color: '#FFD93D' },
  { value: 100, color: '#FF6B6B' },
];

export function getPriorityColor(priority: number): string {
  if (priority <= 50) {
    const t = priority / 50;
    return interpolateColor('#4ECDC4', '#FFD93D', t);
  } else {
    const t = (priority - 50) / 50;
    return interpolateColor('#FFD93D', '#FF6B6B', t);
  }
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

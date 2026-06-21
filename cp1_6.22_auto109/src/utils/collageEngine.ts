import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';

export type FragmentType = 'circle' | 'triangle' | 'polygon';

export interface Fragment {
  id: string;
  type: FragmentType;
  color: string;
  texture: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
  groupId?: string;
}

export type ActionType = 'add' | 'move' | 'rotate' | 'scale' | 'delete' | 'group' | 'ungroup' | 'clear';

export interface HistoryState {
  id: string;
  timestamp: number;
  fragments: Fragment[];
  thumbnail: string;
  actionType: ActionType;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface MaterialVariant {
  color: string;
  texture: string;
}

export interface MaterialConfig {
  type: FragmentType;
  variants: MaterialVariant[];
}

const COLORS = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD',
  '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
  '#4DB6AC', '#81C784', '#AED581', '#DCE775',
  '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F'
];

const generateTexturePattern = (baseColor: string, index: number): string => {
  const patterns = ['dots', 'lines', 'crosshatch', 'waves', 'none'];
  return patterns[index % patterns.length];
};

export const MATERIALS: MaterialConfig[] = [
  {
    type: 'circle',
    variants: Array.from({ length: 10 }, (_, i) => ({
      color: COLORS[i % COLORS.length],
      texture: generateTexturePattern(COLORS[i % COLORS.length], i)
    }))
  },
  {
    type: 'triangle',
    variants: Array.from({ length: 10 }, (_, i) => ({
      color: COLORS[(i + 5) % COLORS.length],
      texture: generateTexturePattern(COLORS[(i + 5) % COLORS.length], i + 3)
    }))
  },
  {
    type: 'polygon',
    variants: Array.from({ length: 10 }, (_, i) => ({
      color: COLORS[(i + 10) % COLORS.length],
      texture: generateTexturePattern(COLORS[(i + 10) % COLORS.length], i + 6)
    }))
  }
];

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GRID_SIZE = 40;
export const SNAP_RANGE = 20;
export const BASE_FRAGMENT_SIZE = 30;

export function snapToGrid(x: number, y: number, gridSize = GRID_SIZE, snapRange = SNAP_RANGE): { x: number; y: number } {
  const gridX = Math.round(x / gridSize) * gridSize;
  const gridY = Math.round(y / gridSize) * gridSize;
  const dist = Math.sqrt((x - gridX) ** 2 + (y - gridY) ** 2);
  if (dist <= snapRange) {
    return { x: gridX, y: gridY };
  }
  return { x, y };
}

export function elasticEaseOut(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

export function createFragment(
  type: FragmentType,
  color: string,
  texture: string,
  x: number,
  y: number,
  zIndex: number
): Fragment {
  return {
    id: uuidv4(),
    type,
    color,
    texture,
    x,
    y,
    rotation: 0,
    scale: 1,
    zIndex
  };
}

export function createParticles(x: number, y: number, color: string, count = 20): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 60,
      maxLife: 60,
      size: 3 + Math.random() * 4
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.1,
      life: p.life - 1
    }))
    .filter(p => p.life > 0);
}

function transformPointToLocal(px: number, py: number, f: Fragment): { x: number; y: number } {
  const dx = px - f.x;
  const dy = py - f.y;
  const rad = (-f.rotation * Math.PI) / 180;
  return {
    x: (dx * Math.cos(rad) - dy * Math.sin(rad)) / f.scale,
    y: (dx * Math.sin(rad) + dy * Math.cos(rad)) / f.scale
  };
}

function pointInCircle(x: number, y: number, radius: number): boolean {
  return x * x + y * y <= radius * radius;
}

function pointInTriangle(x: number, y: number): boolean {
  const size = BASE_FRAGMENT_SIZE;
  const area = 0.5 * (-size * Math.sqrt(3) / 2) * (size - (-size / 2));
  const s = 1 / (2 * area) * (-y * size - x * (size * Math.sqrt(3) / 2));
  const t = 1 / (2 * area) * (x * size - y * (-size / 2));
  return s > 0 && t > 0 && 1 - s - t > 0;
}

function getPolygonVertices(): { x: number; y: number }[] {
  const size = BASE_FRAGMENT_SIZE;
  const vertices: { x: number; y: number }[] = [];
  const sides = 6;
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    const r = size * (0.8 + Math.sin(i * 2.5) * 0.2);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    });
  }
  return vertices;
}

function pointInPolygon(x: number, y: number, vertices: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function isPointInFragment(px: number, py: number, fragment: Fragment): boolean {
  const local = transformPointToLocal(px, py, fragment);
  switch (fragment.type) {
    case 'circle':
      return pointInCircle(local.x, local.y, BASE_FRAGMENT_SIZE);
    case 'triangle':
      return pointInTriangle(local.x, local.y);
    case 'polygon':
      return pointInPolygon(local.x, local.y, getPolygonVertices());
    default:
      return false;
  }
}

export function getFragmentBounds(fragment: Fragment): { minX: number; maxX: number; minY: number; maxY: number } {
  const size = BASE_FRAGMENT_SIZE * fragment.scale * 1.2;
  return {
    minX: fragment.x - size,
    maxX: fragment.x + size,
    minY: fragment.y - size,
    maxY: fragment.y + size
  };
}

export function getFragmentsBounds(fragments: Fragment[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (fragments.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  fragments.forEach(f => {
    const bounds = getFragmentBounds(f);
    minX = Math.min(minX, bounds.minX);
    maxX = Math.max(maxX, bounds.maxX);
    minY = Math.min(minY, bounds.minY);
    maxY = Math.max(maxY, bounds.maxY);
  });
  return { minX, maxX, minY, maxY };
}

export function generateThumbnail(canvas: HTMLCanvasElement, width = 80, height = 60): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = '#FAF8F3';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(canvas, 0, 0, width, height);
  return offscreen.toDataURL('image/png');
}

export function exportCanvas(canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (blob) {
      saveAs(blob, `collage-${Date.now()}.png`);
    }
  }, 'image/png');
}

export function alignFragmentsHorizontally(fragments: Fragment[]): Fragment[] {
  if (fragments.length <= 1) return fragments;
  const bounds = getFragmentsBounds(fragments);
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return fragments.map(f => ({ ...f, y: centerY }));
}

export function alignFragmentsVertically(fragments: Fragment[]): Fragment[] {
  if (fragments.length <= 1) return fragments;
  const bounds = getFragmentsBounds(fragments);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  return fragments.map(f => ({ ...f, x: centerX }));
}

export function groupFragments(fragments: Fragment[], ids: string[], groupId: string): Fragment[] {
  return fragments.map(f => ids.includes(f.id) ? { ...f, groupId } : f);
}

export function ungroupFragments(fragments: Fragment[], groupId: string): Fragment[] {
  return fragments.map(f => f.groupId === groupId ? { ...f, groupId: undefined } : f);
}

export function createHistoryState(fragments: Fragment[], thumbnail: string, actionType: ActionType): HistoryState {
  return {
    id: uuidv4(),
    timestamp: Date.now(),
    fragments: JSON.parse(JSON.stringify(fragments)),
    thumbnail,
    actionType
  };
}

export function getNextZIndex(fragments: Fragment[]): number {
  return fragments.length > 0 ? Math.max(...fragments.map(f => f.zIndex)) + 1 : 1;
}

export function moveZIndex(fragments: Fragment[], id: string, direction: 'up' | 'down' | 'top' | 'bottom'): Fragment[] {
  const sorted = [...fragments].sort((a, b) => a.zIndex - b.zIndex);
  const index = sorted.findIndex(f => f.id === id);
  if (index === -1) return fragments;
  
  const updated = [...sorted];
  const fragment = { ...updated[index] };
  
  switch (direction) {
    case 'up':
      if (index < sorted.length - 1) {
        const nextZ = updated[index + 1].zIndex;
        updated[index] = { ...updated[index + 1], zIndex: fragment.zIndex };
        fragment.zIndex = nextZ;
        updated[index + 1] = fragment;
      }
      break;
    case 'down':
      if (index > 0) {
        const prevZ = updated[index - 1].zIndex;
        updated[index] = { ...updated[index - 1], zIndex: fragment.zIndex };
        fragment.zIndex = prevZ;
        updated[index - 1] = fragment;
      }
      break;
    case 'top':
      fragment.zIndex = Math.max(...sorted.map(f => f.zIndex)) + 1;
      updated[index] = fragment;
      break;
    case 'bottom':
      fragment.zIndex = Math.min(...sorted.map(f => f.zIndex)) - 1;
      updated[index] = fragment;
      break;
  }
  
  return updated;
}

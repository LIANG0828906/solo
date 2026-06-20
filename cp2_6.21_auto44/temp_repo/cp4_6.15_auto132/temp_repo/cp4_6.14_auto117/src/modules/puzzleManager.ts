import { v4 as uuidv4 } from 'uuid';

export interface Fragment {
  id: string;
  name: string;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  currentX: number;
  currentY: number;
  rotation: number;
  isPlaced: boolean;
  isCorrect: boolean;
  bgColor: string;
  previewX: number;
  previewY: number;
  previewW: number;
  previewH: number;
}

interface FragmentPreset {
  name: string;
  targetX: number;
  targetY: number;
  w: number;
  h: number;
  color: string;
  minW: number;
  maxW: number;
  minH: number;
  maxH: number;
}

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 700;
export const DEFAULT_PLACEMENT_THRESHOLD = 20;
export const DEFAULT_ROTATION_RANGE = 6;

const presets: FragmentPreset[] = [
  { name: '导航栏', targetX: 0, targetY: 0, w: 600, h: 60, color: '#334155', minW: 200, maxW: 240, minH: 50, maxH: 60 },
  { name: 'Hero卡片', targetX: 50, targetY: 80, w: 500, h: 150, color: '#3b82f6', minW: 200, maxW: 240, minH: 120, maxH: 150 },
  { name: '功能卡片1', targetX: 50, targetY: 250, w: 240, h: 160, color: '#10b981', minW: 180, maxW: 240, minH: 120, maxH: 160 },
  { name: '功能卡片2', targetX: 310, targetY: 250, w: 240, h: 160, color: '#f59e0b', minW: 180, maxW: 240, minH: 120, maxH: 160 },
  { name: '按钮组', targetX: 200, targetY: 430, w: 200, h: 50, color: '#8b5cf6', minW: 120, maxW: 200, minH: 45, maxH: 50 },
  { name: '信息卡片', targetX: 50, targetY: 500, w: 500, h: 100, color: '#ec4899', minW: 200, maxW: 240, minH: 80, maxH: 100 },
  { name: '底部区域', targetX: 0, targetY: 620, w: 600, h: 80, color: '#1e293b', minW: 200, maxW: 240, minH: 60, maxH: 80 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function generateFragments(): Fragment[] {
  const count = randomInt(5, 7);
  const selectedPresets = shuffle(presets).slice(0, count);

  return shuffle(
    selectedPresets.map((preset) => {
      const width = randomInt(Math.max(80, preset.minW), Math.min(240, preset.maxW));
      const height = randomInt(Math.max(60, preset.minH), Math.min(180, preset.maxH));
      const rotation = (Math.random() - 0.5) * DEFAULT_ROTATION_RANGE;

      return {
        id: uuidv4(),
        name: preset.name,
        width,
        height,
        targetX: preset.targetX,
        targetY: preset.targetY,
        targetWidth: preset.w,
        targetHeight: preset.h,
        currentX: 0,
        currentY: 0,
        rotation,
        isPlaced: false,
        isCorrect: false,
        bgColor: preset.color,
        previewX: (preset.targetX / CANVAS_WIDTH) * 100,
        previewY: (preset.targetY / CANVAS_HEIGHT) * 100,
        previewW: (preset.w / CANVAS_WIDTH) * 100,
        previewH: (preset.h / CANVAS_HEIGHT) * 100,
      };
    })
  );
}

export function addFragment(
  fragments: Fragment[],
  fragment: Omit<Fragment, 'id'> & Partial<Pick<Fragment, 'id'>>
): Fragment[] {
  const newFragment: Fragment = {
    ...fragment,
    id: fragment.id || uuidv4(),
  };
  return [...fragments, newFragment];
}

export function getRotatedCenter(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
): { cx: number; cy: number } {
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (rotation === 0) {
    return { cx, cy };
  }

  const angle = toRadians(rotation);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const corners = [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + height },
    { x: x, y: y + height },
  ];

  const rotatedCorners = corners.map((corner) => ({
    x: cos * (corner.x - cx) - sin * (corner.y - cy) + cx,
    y: sin * (corner.x - cx) + cos * (corner.y - cy) + cy,
  }));

  const minX = Math.min(...rotatedCorners.map((c) => c.x));
  const maxX = Math.max(...rotatedCorners.map((c) => c.x));
  const minY = Math.min(...rotatedCorners.map((c) => c.y));
  const maxY = Math.max(...rotatedCorners.map((c) => c.y));

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function checkPlacement(
  fragment: Pick<Fragment, 'targetX' | 'targetY' | 'targetWidth' | 'targetHeight' | 'width' | 'height' | 'rotation' | 'currentX' | 'currentY'>,
  threshold: number = DEFAULT_PLACEMENT_THRESHOLD
): boolean {
  const target = getRotatedCenter(
    fragment.targetX,
    fragment.targetY,
    fragment.targetWidth,
    fragment.targetHeight,
    0
  );

  const current = getRotatedCenter(
    fragment.currentX,
    fragment.currentY,
    fragment.width,
    fragment.height,
    fragment.rotation
  );

  const dx = target.cx - current.cx;
  const dy = target.cy - current.cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < threshold;
}

export function calculateDistance(
  fragment: Pick<Fragment, 'targetX' | 'targetY' | 'targetWidth' | 'targetHeight' | 'width' | 'height' | 'rotation' | 'currentX' | 'currentY'>
): number {
  const target = getRotatedCenter(
    fragment.targetX,
    fragment.targetY,
    fragment.targetWidth,
    fragment.targetHeight,
    0
  );

  const current = getRotatedCenter(
    fragment.currentX,
    fragment.currentY,
    fragment.width,
    fragment.height,
    fragment.rotation
  );

  const dx = target.cx - current.cx;
  const dy = target.cy - current.cy;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isComplete(fragments: Fragment[]): boolean {
  return fragments.every((f) => f.isCorrect);
}

export function getPlacedCount(fragments: Fragment[]): number {
  return fragments.filter((f) => f.isCorrect).length;
}

export function getTotalCount(fragments: Fragment[]): number {
  return fragments.length;
}

export function getProgress(fragments: Fragment[]): number {
  const total = fragments.length;
  if (total === 0) return 0;
  return getPlacedCount(fragments) / total;
}

export function resetFragments(fragments: Fragment[]): Fragment[] {
  return shuffle(
    fragments.map((f) => ({
      ...f,
      currentX: 0,
      currentY: 0,
      isPlaced: false,
      isCorrect: false,
      rotation: (Math.random() - 0.5) * DEFAULT_ROTATION_RANGE,
    }))
  );
}

export const puzzleManager = {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_PLACEMENT_THRESHOLD,
  DEFAULT_ROTATION_RANGE,
  generateFragments,
  addFragment,
  checkPlacement,
  calculateDistance,
  getRotatedCenter,
  isComplete,
  getPlacedCount,
  getTotalCount,
  getProgress,
  resetFragments,
};

export default puzzleManager;

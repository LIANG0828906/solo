import { v4 as uuidv4 } from 'uuid';

export interface Fragment {
  id: string;
  name: string;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
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

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;
const PLACEMENT_THRESHOLD = 30;

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

export function generateFragments(): Fragment[] {
  const count = randomInt(5, 7);
  const selectedPresets = shuffle(presets).slice(0, count);
  
  return shuffle(selectedPresets.map((preset) => {
    const width = randomInt(Math.max(80, preset.minW), Math.min(240, preset.maxW));
    const height = randomInt(Math.max(60, preset.minH), Math.min(180, preset.maxH));
    const rotation = (Math.random() - 0.5) * 6;
    
    return {
      id: uuidv4(),
      name: preset.name,
      width,
      height,
      targetX: preset.targetX,
      targetY: preset.targetY,
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
  }));
}

export function checkPlacement(
  targetX: number,
  targetY: number,
  currentX: number,
  currentY: number,
  threshold: number = PLACEMENT_THRESHOLD
): boolean {
  const dx = targetX - currentX;
  const dy = targetY - currentY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < threshold;
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

export const puzzleManager = {
  generateFragments,
  checkPlacement,
  isComplete,
  getPlacedCount,
  getTotalCount,
};

export default puzzleManager;

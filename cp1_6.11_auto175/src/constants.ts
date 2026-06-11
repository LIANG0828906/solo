import type { IconType } from './types';

export const CHALK_COLORS = ['#FFFFFF', '#FFE066', '#FF9E9E', '#66E0C0'] as const;

export const FONT_FAMILIES = [
  { name: 'Caveat', label: '手写体1' },
  { name: 'Patrick Hand', label: '手写体2' },
  { name: 'Schoolbell', label: '手写体3' },
  { name: 'sans-serif', label: '常规体' },
] as const;

export const TAG_COLORS = ['#FF6B6B', '#4FD1C5', '#F6AD55'] as const;

export const CANVAS_SIZES = {
  'A3-portrait': { width: 420, height: 594, label: 'A3 竖版' },
  'A4-landscape': { width: 297, height: 210, label: 'A4 横版' },
} as const;

export const ICON_TYPES: { type: IconType; label: string }[] = [
  { type: 'hotCoffee', label: '热咖啡' },
  { type: 'icedCoffee', label: '冰咖啡' },
  { type: 'latte', label: '拿铁' },
  { type: 'croissant', label: '可颂' },
  { type: 'mapleLeaf', label: '枫叶' },
  { type: 'flower', label: '花朵' },
];

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

import { FLAG_COLORS, FlagColor } from '../types';

export const getRandomFlagColor = (): FlagColor => {
  const randomIndex = Math.floor(Math.random() * FLAG_COLORS.length);
  return FLAG_COLORS[randomIndex];
};

export const getColorName = (color: string): string => {
  const colorNames: Record<string, string> = {
    '#c0392b': '赤红',
    '#f1c40f': '明黄',
    '#27ae60': '墨绿',
    '#2c3e50': '玄青',
    '#ecf0f1': '素白',
    '#2d2d2d': '缁黑',
    '#8e44ad': '降紫',
    '#2980b9': '藏蓝',
  };
  return colorNames[color] || '未知';
};

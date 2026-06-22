import type { CardType } from './types';

export const PRESET_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#a29bfe',
  '#fd79a8',
];

export const TYPE_ICONS: Record<CardType, string> = {
  text: '📝',
  image: '🖼️',
  todo: '✅',
};

export const TYPE_NAMES: Record<CardType, string> = {
  text: '文本',
  image: '图片',
  todo: '待办清单',
};

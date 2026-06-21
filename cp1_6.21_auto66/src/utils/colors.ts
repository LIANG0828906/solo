import type { ColorItem } from './types';

export const CLASSIC_COLORS: ColorItem[] = [
  { value: '#c41e3a', name: '经典红' },
  { value: '#ffd500', name: '经典黄' },
  { value: '#0054a6', name: '经典蓝' },
  { value: '#287c37', name: '经典绿' },
  { value: '#ffffff', name: '白色' },
  { value: '#1c1c1c', name: '黑色' }
];

export const getColorName = (hex: string): string => {
  const color = CLASSIC_COLORS.find(c => c.value.toLowerCase() === hex.toLowerCase());
  return color?.name || hex;
};

export const GLOW_START = '#ffe066';
export const GLOW_END = '#ffffff';

export const BACKGROUND_COLOR = '#f0f4f8';
export const PANEL_BACKGROUND = '#fafafa';
export const GRID_LINE_COLOR = '#d0d5dd';
export const BORDER_COLOR = '#e0e0e0';
export const HOVER_BLUE = '#e3f2fd';
export const GRADIENT_START = '#ff6b6b';
export const GRADIENT_END = '#ee5a24';
export const SCROLLBAR_COLOR = '#c5cae0';
export const MODAL_OVERLAY = '#00000066';
export const REJECT_COLOR = 'rgba(255, 0, 0, 0.5)';

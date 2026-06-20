export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  actionType: 'popup' | 'animation';
  popupText: string;
  animationType: 'fadeInOut' | 'rotateScale' | 'bounce';
}

export interface Page {
  id: string;
  pageNumber: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  hotspots: Hotspot[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

export const PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'] as const;
export type PaletteColor = typeof PALETTE[number];

export const LABEL_OPTIONS = ['角色', '道具', '背景', '文字', '特效'] as const;

export const ANIMATION_PRESETS = {
  fadeInOut: { name: '缓慢淡入-淡出', duration: '0.5s' },
  rotateScale: { name: '旋转缩放', duration: '1s' },
  bounce: { name: '弹跳抖动', duration: '0.8s' },
} as const;

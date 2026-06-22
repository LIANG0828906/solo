import type { Style, Wood, Metal, StyleId } from '../types';

export const STYLES: Style[] = [
  { id: 'short-wallet', name: '短夹', width: 220, height: 100, corners: 12 },
  { id: 'long-wallet', name: '长夹', width: 200, height: 180, corners: 10 },
  { id: 'key-case', name: '钥匙包', width: 120, height: 70, corners: 20 }
];

export const WOODS: Wood[] = [
  { id: 'oak', name: '橡木', color: '#8B5E3C', grainPattern: 'vertical' },
  { id: 'walnut', name: '胡桃木', color: '#3E2723', grainPattern: 'wave' },
  { id: 'cherry', name: '樱桃木', color: '#A0522D', grainPattern: 'horizontal' },
  { id: 'maple', name: '枫木', color: '#B8860B', grainPattern: 'diagonal' },
  { id: 'ebony', name: '乌木', color: '#1A1A1A', grainPattern: 'fine' },
  { id: 'ash', name: '白蜡', color: '#C4A882', grainPattern: 'bold' }
];

export const METALS: Metal[] = [
  { id: 'copper', name: '复古铜', color: '#B87333', shine: 'warm' },
  { id: 'silver', name: '哑光银', color: '#C0C0C0', shine: 'matte' },
  { id: 'nickel', name: '黑镍', color: '#333333', shine: 'dark' },
  { id: 'rose-gold', name: '玫瑰金', color: '#D4AF37', shine: 'golden' },
  { id: 'antique-silver', name: '古银', color: '#A9A9A9', shine: 'antique' }
];

export const DEFAULT_STYLE_ID: StyleId = 'short-wallet';
export const DEFAULT_WOOD_ID = 'oak';
export const DEFAULT_METAL_ID = 'copper';

export const MAX_FAVORITES = 6;

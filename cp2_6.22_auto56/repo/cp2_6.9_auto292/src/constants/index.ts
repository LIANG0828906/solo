import type { Flower, Oil, StickerTypeConfig, Step, ThemeColors } from '../types';

// 4种花香配置
export const FLOWERS: Flower[] = [
  { id: 'osmanthus', name: '桂花', color: '#f5b041' },
  { id: 'rose', name: '玫瑰', color: '#c0392b' },
  { id: 'jasmine', name: '茉莉', color: '#f0f3f4' },
  { id: 'plum', name: '梅花', color: '#fadbd8' },
];

// 4种油脂配置，包含深浅渐变色
export const OILS: Oil[] = [
  {
    id: 'olive',
    name: '橄榄油',
    color: '#8b9a46',
    gradient: ['#a8b86e', '#8b9a46', '#6b7a34'],
  },
  {
    id: 'coconut',
    name: '椰子油',
    color: '#f5f5dc',
    gradient: ['#ffffff', '#f5f5dc', '#e8e8c8'],
  },
  {
    id: 'almond',
    name: '甜杏仁油',
    color: '#fdebd0',
    gradient: ['#fff5e6', '#fdebd0', '#f5d7a8'],
  },
  {
    id: 'jojoba',
    name: '荷荷巴油',
    color: '#daa520',
    gradient: ['#f0c860', '#daa520', '#b8860b'],
  },
];

// 6种云纹贴纸类型
export const STICKER_TYPES: StickerTypeConfig[] = [
  { type: 'cloud', name: '祥云' },
  { type: 'crane', name: '仙鹤' },
  { type: 'peony', name: '牡丹' },
  { type: 'wave', name: '海浪' },
  { type: 'meander', name: '回纹' },
  { type: 'lotus', name: '莲花' },
];

// 5个制作步骤配置
export const STEPS: Step[] = [
  {
    type: 'select',
    name: '选料',
    description: '选择心仪的花香与基底油脂',
  },
  {
    type: 'mix',
    name: '调配',
    description: '调整花油比例与定香剂用量',
  },
  {
    type: 'heat',
    name: '融蜡',
    description: '隔水加热使原料充分融合',
  },
  {
    type: 'cool',
    name: '冷却',
    description: '静置等待香膏凝固成型',
  },
  {
    type: 'decorate',
    name: '装饰',
    description: '为香膏添加精美贴纸点缀',
  },
];

// 主题色配置
export const COLORS: ThemeColors = {
  background: '#fdf6e3',
  panel: '#fffaf0',
  potDark: '#8b4513',
  potLight: '#cd853f',
  wood: '#d2b48c',
  gold: '#ffd700',
  textPrimary: '#3e2723',
  textSecondary: '#795548',
};

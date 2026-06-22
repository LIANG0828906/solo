export interface TemplateColors {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
}

export interface LayoutItem {
  x: number;
  y: number;
  fontSize?: number;
  fontWeight?: number;
  size?: number;
  width?: number;
  height?: number;
  lineHeight?: number;
}

export interface LayoutConfig {
  title: LayoutItem;
  body: LayoutItem;
  logo: LayoutItem;
  divider: LayoutItem;
  icon: LayoutItem;
}

export interface CardTemplate {
  id: string;
  name: string;
  colors: TemplateColors;
  defaultLayout: LayoutConfig;
  fontFamily: string;
  slogan: string;
}

export const templates: CardTemplate[] = [
  {
    id: 'minimal-white',
    name: '极简白',
    colors: {
      primary: '#333333',
      secondary: '#666666',
      background: '#ffffff',
      accent: '#000000',
    },
    fontFamily: '"Noto Sans SC", sans-serif',
    slogan: '简约·不简单',
    defaultLayout: {
      title: { x: 40, y: 60, fontSize: 48, fontWeight: 900 },
      body: { x: 40, y: 140, fontSize: 20, lineHeight: 1.6 },
      logo: { x: 40, y: 300, size: 48 },
      divider: { x: 40, y: 280, width: 80, height: 3 },
      icon: { x: 560, y: 280, size: 32 },
    },
  },
  {
    id: 'tech-blue',
    name: '科技蓝',
    colors: {
      primary: '#1976d2',
      secondary: '#42a5f5',
      background: '#e3f2fd',
      accent: '#0d47a1',
    },
    fontFamily: '"Noto Sans SC", sans-serif',
    slogan: '科技改变世界',
    defaultLayout: {
      title: { x: 40, y: 50, fontSize: 44, fontWeight: 700 },
      body: { x: 40, y: 120, fontSize: 18, lineHeight: 1.7 },
      logo: { x: 40, y: 310, size: 44 },
      divider: { x: 40, y: 260, width: 100, height: 2 },
      icon: { x: 580, y: 60, size: 36 },
    },
  },
  {
    id: 'warm-orange',
    name: '暖橙手写',
    colors: {
      primary: '#ff6b35',
      secondary: '#ffa726',
      background: '#fff8e1',
      accent: '#bf360c',
    },
    fontFamily: '"Ma Shan Zheng", cursive',
    slogan: '用笔尖记录温暖',
    defaultLayout: {
      title: { x: 50, y: 70, fontSize: 52, fontWeight: 400 },
      body: { x: 50, y: 150, fontSize: 22, lineHeight: 1.8 },
      logo: { x: 50, y: 300, size: 40 },
      divider: { x: 50, y: 290, width: 60, height: 2 },
      icon: { x: 550, y: 290, size: 28 },
    },
  },
  {
    id: 'dark-night',
    name: '暗夜高端',
    colors: {
      primary: '#bb86fc',
      secondary: '#03dac6',
      background: '#121212',
      accent: '#cf6679',
    },
    fontFamily: '"Noto Sans SC", sans-serif',
    slogan: '在黑暗中寻找光明',
    defaultLayout: {
      title: { x: 40, y: 55, fontSize: 46, fontWeight: 700 },
      body: { x: 40, y: 130, fontSize: 19, lineHeight: 1.7 },
      logo: { x: 40, y: 310, size: 46 },
      divider: { x: 40, y: 270, width: 90, height: 2 },
      icon: { x: 570, y: 70, size: 34 },
    },
  },
];

export const getTemplateById = (id: string): CardTemplate => {
  return templates.find((t) => t.id === id) || templates[0];
};

export const platformSizes = [
  { id: 'twitter', name: 'Twitter', width: 1200, height: 675 },
  { id: 'wechat', name: '微信公众号', width: 900, height: 383 },
  { id: 'xiaohongshu', name: '小红书', width: 1080, height: 1440 },
];

export type PlatformId = 'twitter' | 'wechat' | 'xiaohongshu';

export const BASE_CARD_WIDTH = 640;
export const BASE_CARD_HEIGHT = 400;
export const GRID_SIZE = 16;

export interface ThemeTile {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  imageUrl?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  tiles: ThemeTile[];
  accentColor: string;
}

export const FRUIT_THEME: Theme = {
  id: 'fruit',
  name: '水果乐园',
  description: '清新可爱的水果主题',
  accentColor: '#FF6B6B',
  tiles: [
    { id: 'fruit-1', name: '苹果', color: '#FF6B6B', emoji: '🍎' },
    { id: 'fruit-2', name: '香蕉', color: '#FFD93D', emoji: '🍌' },
    { id: 'fruit-3', name: '葡萄', color: '#9B59B6', emoji: '🍇' },
    { id: 'fruit-4', name: '橙子', color: '#FF8C00', emoji: '🍊' },
    { id: 'fruit-5', name: '西瓜', color: '#2ECC71', emoji: '🍉' },
    { id: 'fruit-6', name: '草莓', color: '#E74C3C', emoji: '🍓' },
  ],
};

export const PIXEL_THEME: Theme = {
  id: 'pixel',
  name: '复古像素',
  description: '怀旧的像素艺术风格',
  accentColor: '#00D4FF',
  tiles: [
    { id: 'pixel-1', name: '爱心', color: '#FF4757', emoji: '❤️' },
    { id: 'pixel-2', name: '星星', color: '#FFA502', emoji: '⭐' },
    { id: 'pixel-3', name: '月亮', color: '#5352ED', emoji: '🌙' },
    { id: 'pixel-4', name: '太阳', color: '#FF6348', emoji: '☀️' },
    { id: 'pixel-5', name: '云朵', color: '#74B9FF', emoji: '☁️' },
    { id: 'pixel-6', name: '闪电', color: '#FDCB6E', emoji: '⚡' },
  ],
};

export const NATURE_THEME: Theme = {
  id: 'nature',
  name: '自然风光',
  description: '宁静的自然元素',
  accentColor: '#00B894',
  tiles: [
    { id: 'nature-1', name: '树木', color: '#27AE60', emoji: '🌳' },
    { id: 'nature-2', name: '花朵', color: '#FD79A8', emoji: '🌸' },
    { id: 'nature-3', name: '山峰', color: '#636E72', emoji: '⛰️' },
    { id: 'nature-4', name: '海浪', color: '#0984E3', emoji: '🌊' },
    { id: 'nature-5', name: '落叶', color: '#E17055', emoji: '🍂' },
    { id: 'nature-6', name: '彩虹', color: '#A29BFE', emoji: '🌈' },
  ],
};

export const PRESET_THEMES: Theme[] = [FRUIT_THEME, PIXEL_THEME, NATURE_THEME];

export const DEFAULT_THEME = FRUIT_THEME;

export const MAX_CUSTOM_IMAGES = 18;
export const MAX_IMAGE_SIZE_MB = 3;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

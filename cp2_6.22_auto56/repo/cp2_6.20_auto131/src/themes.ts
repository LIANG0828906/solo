import { ThemeType, ThemeConfig } from './types';

export const THEMES: Record<ThemeType, ThemeConfig> = {
  fire: {
    type: 'fire',
    name: '火焰',
    colors: ['#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00'],
    glowColor: 'rgba(255, 100, 0, 0.5)',
    bgGradient: { start: 'rgba(139, 0, 0, 0.6)', end: 'rgba(139, 0, 0, 0)' },
    defaultDirection: { x: 0, y: -1 }
  },
  ice: {
    type: 'ice',
    name: '冰雪',
    colors: ['#ffffff', '#e0f0ff', '#b0d4ff', '#80bfff', '#4da6ff', '#1a8cff'],
    glowColor: 'rgba(130, 180, 255, 0.5)',
    bgGradient: { start: 'rgba(173, 216, 230, 0.5)', end: 'rgba(173, 216, 230, 0)' },
    defaultDirection: { x: 0, y: 1 }
  },
  sand: {
    type: 'sand',
    name: '沙尘',
    colors: ['#d4a574', '#c4956a', '#b8865a', '#a67750', '#8b6914', '#f5deb3'],
    glowColor: 'rgba(210, 180, 140, 0.4)',
    bgGradient: { start: 'rgba(245, 222, 179, 0.4)', end: 'rgba(245, 222, 179, 0)' },
    defaultDirection: { x: 1, y: 0 }
  },
  petal: {
    type: 'petal',
    name: '花瓣',
    colors: ['#ffb6c1', '#ff69b4', '#ff1493', '#db7093', '#ffc0cb', '#ff91a4'],
    glowColor: 'rgba(255, 182, 193, 0.5)',
    bgGradient: { start: 'rgba(255, 192, 203, 0.5)', end: 'rgba(255, 192, 203, 0)' },
    defaultDirection: { x: 0.3, y: 1 }
  }
};

export const THEME_LIST: ThemeConfig[] = Object.values(THEMES);

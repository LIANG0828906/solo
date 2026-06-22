import type { ThemeKey, ThemeConfig } from '@/types';

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  minimal: {
    name: '简约白底',
    bg: '#ffffff',
    fg: '#333333',
    accent: '#6c63ff',
    font: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    badge: '简约',
  },
  business: {
    name: '深色商务',
    bg: '#1a1a2e',
    fg: '#eaeaea',
    accent: '#d4af37',
    font: '"Georgia", "Noto Serif SC", "Songti SC", serif',
    badge: '商务',
  },
  cartoon: {
    name: '手绘卡通',
    bg: '#fff8e1',
    fg: '#5d4037',
    accent: '#ff7043',
    font: '"Comic Sans MS", "Segoe Print", "KaiTi", cursive',
    badge: '卡通',
  },
};

export const THEME_KEYS: ThemeKey[] = ['minimal', 'business', 'cartoon'];

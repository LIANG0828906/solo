import type { ThemeConfig } from './types';

export const THEMES: ThemeConfig[] = [
  {
    key: 'aurora',
    name: '蓝紫极光',
    colors: [
      '#7C5CFF', '#5B8DEF', '#4ECDC4', '#9D72FF',
      '#3AB3E5', '#2CC99A', '#8E7CFF', '#36D1DC',
    ],
    bgPrimary: '#1a1a2e',
    bgSecondary: '#22223b',
    borderColor: 'rgba(255,255,255,0.12)',
    glowColor: 'rgba(124,92,255,0.4)',
    textPrimary: 'rgba(255,255,255,0.92)',
    textSecondary: 'rgba(255,255,255,0.65)',
    rowAlt: 'rgba(255,255,255,0.025)',
    rowSelected: 'rgba(124,92,255,0.18)',
    scrollbar: 'rgba(124,92,255,0.5)',
  },
  {
    key: 'sunset',
    name: '暖阳橙黄',
    colors: [
      '#FF6B35', '#FFB454', '#F7931E', '#FF8A65',
      '#FFCA28', '#FF5252', '#FFA726', '#FF7043',
    ],
    bgPrimary: '#1e1a1a',
    bgSecondary: '#292323',
    borderColor: 'rgba(255,180,84,0.15)',
    glowColor: 'rgba(255,107,53,0.4)',
    textPrimary: 'rgba(255,245,230,0.92)',
    textSecondary: 'rgba(255,220,180,0.68)',
    rowAlt: 'rgba(255,180,84,0.03)',
    rowSelected: 'rgba(255,107,53,0.18)',
    scrollbar: 'rgba(255,107,53,0.5)',
  },
  {
    key: 'forest',
    name: '森林绿褐',
    colors: [
      '#52B788', '#95D5B2', '#40916C', '#74C69D',
      '#A68A64', '#D4A373', '#2D6A4F', '#B7E4C7',
    ],
    bgPrimary: '#17201d',
    bgSecondary: '#1f2a26',
    borderColor: 'rgba(82,183,136,0.15)',
    glowColor: 'rgba(82,183,136,0.4)',
    textPrimary: 'rgba(235,245,238,0.92)',
    textSecondary: 'rgba(180,210,190,0.68)',
    rowAlt: 'rgba(82,183,136,0.03)',
    rowSelected: 'rgba(82,183,136,0.18)',
    scrollbar: 'rgba(82,183,136,0.5)',
  },
];

export function applyThemeToRoot(theme: ThemeConfig): void {
  const root = document.documentElement;
  root.style.setProperty('--bg-primary', theme.bgPrimary);
  root.style.setProperty('--bg-secondary', theme.bgSecondary);
  root.style.setProperty('--border-color', theme.borderColor);
  root.style.setProperty('--glow-color', theme.glowColor);
  root.style.setProperty('--accent', theme.colors[0]);
  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-secondary', theme.textSecondary);
  root.style.setProperty('--row-alt', theme.rowAlt);
  root.style.setProperty('--row-selected', theme.rowSelected);
  root.style.setProperty('--scrollbar', theme.scrollbar);
}

export const DEFAULT_THEME_KEY = 'aurora';

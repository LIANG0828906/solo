import { ThemeType, ThemeColors } from '@/types';

export const themeColors: Record<ThemeType, ThemeColors> = {
  night: {
    primary: '#0f0c29',
    gradientStart: '#302b63',
    gradientEnd: '#24243e',
    accent: '#00d4ff',
  },
  retro: {
    primary: '#3c2a21',
    gradientStart: '#d5a473',
    gradientEnd: '#e8d5b7',
    accent: '#8b4513',
  },
  minimal: {
    primary: '#2c2c2c',
    gradientStart: '#f5f5f5',
    gradientEnd: '#e0e0e0',
    accent: '#666666',
  },
  cyber: {
    primary: '#1a1a2e',
    gradientStart: '#ff00ff',
    gradientEnd: '#00ffff',
    accent: '#ff0080',
  },
};

export const themeNames: Record<ThemeType, string> = {
  night: '暗夜星空',
  retro: '复古棕调',
  minimal: '极简灰白',
  cyber: '赛博粉紫',
};

export function applyTheme(theme: ThemeType): void {
  const colors = themeColors[theme];
  const root = document.documentElement;
  
  root.style.setProperty('--theme-primary', colors.primary);
  root.style.setProperty('--theme-gradient-start', colors.gradientStart);
  root.style.setProperty('--theme-gradient-end', colors.gradientEnd);
  root.style.setProperty('--theme-accent', colors.accent);
}

import type { ThemeConfig, ThemeType } from '@/types';

export const themes: Record<ThemeType, ThemeConfig> = {
  aurora: {
    background: '#0a0a1a',
    ambientColor: '#1a1a3a',
    particleColorStart: '#00ffff',
    particleColorEnd: '#ff00ff',
    surfaceColorStart: '#00ffff',
    surfaceColorEnd: '#0044aa',
    particleSizeMultiplier: 1.0,
  },
  neon: {
    background: '#0d0d0d',
    ambientColor: '#2a1a2a',
    particleColorStart: '#ff6b9d',
    particleColorEnd: '#ffd93d',
    surfaceColorStart: '#9b59b6',
    surfaceColorEnd: '#e74c3c',
    particleSizeMultiplier: 1.2,
  },
  ink: {
    background: '#1a1a1a',
    ambientColor: '#2a2a2a',
    particleColorStart: '#ffffff',
    particleColorEnd: '#666666',
    surfaceColorStart: '#bbbbbb',
    surfaceColorEnd: '#333333',
    particleSizeMultiplier: 0.9,
  },
};

import { ThemeColors } from '../types';

export const PARTICLE_COUNT = 300;
export const PARTICLE_LAYERS = {
  far: { opacity: 0.2, sizeRange: [0.5, 1.2] as [number, number], speedRange: [0.1, 0.3] as [number, number] },
  mid: { opacity: 0.5, sizeRange: [1.2, 2.2] as [number, number], speedRange: [0.3, 0.6] as [number, number] },
  near: { opacity: 1.0, sizeRange: [2.2, 4.0] as [number, number], speedRange: [0.6, 1.2] as [number, number] },
};

export const SPREAD_CONFIG = {
  baseRadius: 80,
  maxRadius: 200,
  intensityDuration: 1000,
  fastInterval: 200,
  fastMultiplier: 2,
};

export const COLOR_CYCLE_SPEED = 0.0003;

export const WRITING_PAUSE_THRESHOLD = 60000;
export const STATS_REFRESH_INTERVAL = 5000;
export const RECENT_WINDOW_MS = 5 * 60 * 1000;

export const LAYOUT = {
  topPadding: 80,
  bottomPadding: 40,
  sidePadding: 40,
  mobileSidePadding: 20,
  mobileBreakpoint: 768,
};

export const ANIMATION = {
  glowDuration: 1000,
  cardTransition: 300,
  themeTransition: 400,
  numberTransition: 200,
  exportRotate: 500,
  toastSlide: 300,
};

export const DARK_COLORS: ThemeColors = {
  bg: '#0B0E14',
  text: '#E2E8F0',
  textareaBg: 'rgba(11,14,20,0.85)',
  cardBg: 'rgba(30,41,59,0.6)',
  cursor: '#94A3B8',
  glow: 'rgba(99,102,241,0.3)',
  particleStart: [30, 58, 138],
  particleEnd: [124, 58, 237],
};

export const LIGHT_COLORS: ThemeColors = {
  bg: '#F8FAFC',
  text: '#334155',
  textareaBg: 'rgba(248,250,252,0.85)',
  cardBg: 'rgba(255,255,255,0.6)',
  cursor: '#64748B',
  glow: 'rgba(245,158,11,0.3)',
  particleStart: [245, 158, 11],
  particleEnd: [239, 68, 68],
};

export const FONT_STACK = "'JetBrains Mono', 'Courier New', Consolas, monospace";

export type DifficultyLevel = 'easy' | 'normal' | 'hard';
export type GameMode = 'standard' | 'practice';
export type JudgmentType = 'perfect' | 'good' | 'miss';
export type ThemeType = 'retro' | 'neon' | 'minimal';
export type GameState = 'idle' | 'playing' | 'finished';

export interface Beat {
  id: string;
  track: number;
  time: number;
  hit: boolean;
  judgment?: JudgmentType;
  deviation?: number;
}

export interface Score {
  total: number;
  perfect: number;
  good: number;
  miss: number;
  combo: number;
  maxCombo: number;
  totalDeviation: number;
  hitCount: number;
}

export interface DifficultyConfig {
  timeSignature: [number, number];
  bpm: number;
  tracks: number;
  pattern: 'single' | 'alternate' | 'random';
  duration: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  type: 'pixel' | 'glow' | 'dot';
}

export interface JudgmentEvent {
  type: JudgmentType;
  track: number;
  deviation?: number;
  timestamp: number;
}

export interface ThemeColors {
  background: string;
  backgroundGradient: string;
  trackBg: string;
  trackBorder: string;
  judgmentLine: string;
  perfect: string;
  good: string;
  miss: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
}

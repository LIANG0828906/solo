export type Theme = 'dark' | 'light';

export interface Stats {
  wordCount: number;
  writingDuration: number;
  keystrokeCount: number;
  keystrokeFrequency: number;
  recentKeystrokeFrequency: number;
  lastKeystrokeTime: number;
  startTime: number | null;
  isPaused: boolean;
}

export interface EditorContextType {
  text: string;
  setText: (text: string) => void;
  cursorPosition: number;
  setCursorPosition: (pos: number) => void;
  stats: Stats;
  updateStatsOnKeystroke: () => void;
  refreshStats: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export interface Particle {
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  opacity: number;
  baseOpacity: number;
  layer: 'far' | 'mid' | 'near';
  colorPhase: number;
  spreadIntensity: number;
  spreadOriginX: number;
  spreadOriginY: number;
}

export interface KeystrokeEvent {
  time: number;
  interval: number;
}

export interface ThemeColors {
  bg: string;
  text: string;
  textareaBg: string;
  cardBg: string;
  cursor: string;
  glow: string;
  particleStart: [number, number, number];
  particleEnd: [number, number, number];
}

export type ExportFormat = 'txt' | 'md';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

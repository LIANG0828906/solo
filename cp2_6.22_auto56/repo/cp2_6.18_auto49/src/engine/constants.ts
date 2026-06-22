export const JUMP_HEIGHT = 150;
export const JUMP_UP_TIME = 0.4;
export const JUMP_DOWN_TIME = 0.3;
export const SLIDE_DURATION = 0.8;
export const PLAYER_SPEED = 8;
export const LANE_LEFT_X = 250;
export const LANE_CENTER_X = 400;
export const LANE_RIGHT_X = 550;
export const PLAYER_WIDTH = 50;
export const PLAYER_HEIGHT = 80;
export const PLAYER_SLIDE_HEIGHT = 40;
export const GROUND_Y = 500;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const SCROLL_SPEED_BASE = 5;
export const BEAT_TOLERANCE_MS = 50;
export const INITIAL_HEALTH = 5;
export const COIN_VALUE_NORMAL = 10;
export const COIN_VALUE_CHORUS = 20;
export const OBSTACLE_WIDTH = 60;
export const OBSTACLE_HEIGHT = 80;
export const COIN_RADIUS = 15;

export const SECTIONS = {
  intro: 'intro',
  verse: 'verse',
  chorus: 'chorus',
} as const;

export const COLORS = {
  playerIdle: '#4ade80',
  playerJump: '#fbbf24',
  playerSlide: '#60a5fa',
  obstacle: '#ef4444',
  coin: '#facc15',
  background: '#1e1b4b',
  ground: '#4c1d95',
  bgPrimary: '#1e1b4b',
  bgAlt: '#312e81',
  accentPrimary: '#8b5cf6',
  accentSecondary: '#a78bfa',
  beatIntro: '#6C5CE7',
  beatVerse: '#00B894',
  beatChorus: '#E74C3C',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

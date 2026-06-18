export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const SCROLL_WIDTH = 2000;

export const SCROLL_SPEED = 2;

export const PLAYER_SIZE = 20;
export const PLAYER_X = Math.floor(CANVAS_WIDTH / 3);
export const PLAYER_MIN_Y = 50;
export const PLAYER_MAX_Y = 450;
export const PLAYER_SPEED = 4;
export const PLAYER_LIVES = 3;

export const ENEMY_WIDTH = 10;
export const ENEMY_HEIGHT = 20;
export const ENEMY_SPEED = 1.5;
export const ENEMY_SPAWN_MIN = 1.5;
export const ENEMY_SPAWN_MAX = 3.0;

export const DART_SIZE = 3;
export const DART_SPEED = 6;

export const PARTICLE_COUNT = 8;
export const PARTICLE_LIFETIME = 0.5;
export const PARTICLE_MIN_SIZE = 2;
export const PARTICLE_MAX_SIZE = 6;

export const SCORE_PER_KILL = 100;
export const RIPPLE_THRESHOLD = 1000;
export const RIPPLE_DURATION = 0.8;

export const SCROLL_SWITCH_DISTANCE = 1000;
export const FADE_DURATION = 0.5;

export const FLASH_DURATION = 0.2;
export const FLASH_COUNT = 2;

export const AFTERIMAGE_COUNT = 3;
export const AFTERIMAGE_ALPHA = 0.3;

export const COLORS = {
  BACKGROUND: '#F5F0E1',
  TEXTURE: '#D3C5A3',
  PLAYER: '#000000',
  PLAYER_GLOW: '#FFFFFF',
  ENEMY_BODY: '#FFFFFF',
  ENEMY_EYE: '#FF0000',
  DART: '#000000',
  PARTICLE: '#000000',
  FLASH: '#FF0000',
  TEXT: '#FFFFFF',
  TEXT_STROKE: '#000000',
  RIPPLE: '#FFD700',
  MOUNTAIN: '#8B7355',
  BIRD: '#D4A373',
  CALLIGRAPHY: '#333333'
};

export const SCROLL_STYLES = ['default', 'mountain', 'bird', 'calligraphy'] as const;
export type ScrollStyle = typeof SCROLL_STYLES[number];

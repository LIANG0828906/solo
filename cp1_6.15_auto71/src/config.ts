export const RUNE_TYPES = ['fire', 'water', 'wind', 'earth'] as const;
export type RuneType = typeof RUNE_TYPES[number];

export const RUNE_COLORS: Record<RuneType, number> = {
  fire: 0xff4500,
  water: 0x00bfff,
  wind: 0x90ee90,
  earth: 0xdaa520
};

export const RUNE_SYMBOLS: Record<RuneType, string> = {
  fire: '🔥',
  water: '💧',
  wind: '�',
  earth: '🌍'
};

export const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    sequenceLength: 3,
    interval: 2000,
    description: '3个符文，2秒间隔'
  },
  normal: {
    name: '普通',
    sequenceLength: 4,
    interval: 1500,
    description: '4个符文，1.5秒间隔'
  },
  hard: {
    name: '困难',
    sequenceLength: 5,
    interval: 1000,
    description: '5个符文，1秒间隔'
  }
} as const;

export type Difficulty = keyof typeof DIFFICULTY_CONFIG;

export const GAME_CONFIG = {
  INITIAL_TIME: 30,
  TIME_SUCCESS_BONUS: 3,
  TIME_FAILURE_PENALTY: 2,
  MAX_PARTICLES: 300,
  ALTAR_HEIGHT_RATIO: 0.7,
  ALTAR_HEIGHT_RATIO_MOBILE: 0.9,
  RUNE_DIAMETER: 60,
  RUNE_DIAMETER_MOBILE: 50,
  HEXAGRAM_ROTATION_SPEED_NORMAL: 0.5,
  HEXAGRAM_ROTATION_SPEED_FAST: 0.8,
  HEXAGRAM_ROTATION_TRANSITION: 300,
  MOBILE_BREAKPOINT: 768,
  UI_SCALE_MOBILE: 0.8
} as const;

export const CONFIG = {
  RUNE_COUNT: 12,
  RUNE_BASE_SIZE: 90,
  RUNE_HOVER_SIZE: 120,
  RUNE_DRIFT_SPEED: 2,
  RUNE_PULSE_PERIOD: 2000,
  RUNE_PULSE_MIN_ALPHA: 0.6,
  RUNE_PULSE_MAX_ALPHA: 0.9,
  
  CIRCLE_RADIUS_RATIO: 0.4,
  
  ENERGY_BAR_WIDTH_RATIO: 0.8,
  ENERGY_BAR_HEIGHT: 18,
  ENERGY_PER_CORRECT: 0.08,
  
  SHOCKWAVE_START_RADIUS: 50,
  SHOCKWAVE_END_RADIUS: 200,
  SHOCKWAVE_DURATION: 500,
  
  LIGHT_BEAM_WIDTH_RATIO: 0.04,
  LIGHT_BEAM_DURATION: 2000,
  
  FLASH_DURATION: 300,
  
  TEXT_ANIMATION_DURATION: 2000,
  TEXT_ANIMATION_OFFSET: 30,
  
  WRONG_SHAKE_AMPLITUDE: 5,
  WRONG_SHAKE_FREQUENCY: 15,
  WRONG_SHAKE_DURATION: 300,
  
  GUARDIAN_PARTICLE_COUNT: 80,
  GUARDIAN_PARTICLE_MIN_SIZE: 3,
  GUARDIAN_PARTICLE_MAX_SIZE: 6,
  
  MIN_SCREEN_WIDTH: 800,
  MAX_SCREEN_WIDTH: 1920,
  BASE_SCREEN_WIDTH: 1280,
  
  TARGET_FPS: 60,
} as const;

export const AURORA_COLORS = [
  { name: '青绿', hex: '#00FFC6', glow: 'rgba(0, 255, 198, 0.6)' },
  { name: '蓝紫', hex: '#9D4EDD', glow: 'rgba(157, 78, 221, 0.6)' },
  { name: '粉红', hex: '#FF6B9D', glow: 'rgba(255, 107, 157, 0.6)' },
  { name: '玫红', hex: '#FF1493', glow: 'rgba(255, 20, 147, 0.6)' },
  { name: '亮黄', hex: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' },
  { name: '翠绿', hex: '#00FF7F', glow: 'rgba(0, 255, 127, 0.6)' },
  { name: '浅蓝', hex: '#87CEEB', glow: 'rgba(135, 206, 235, 0.6)' },
  { name: '淡紫', hex: '#DDA0DD', glow: 'rgba(221, 160, 221, 0.6)' },
  { name: '金橙', hex: '#FFA500', glow: 'rgba(255, 165, 0, 0.6)' },
  { name: '银白', hex: '#E8E8E8', glow: 'rgba(232, 232, 232, 0.6)' },
  { name: '深红', hex: '#DC143C', glow: 'rgba(220, 20, 60, 0.6)' },
  { name: '冰蓝', hex: '#00BFFF', glow: 'rgba(0, 191, 255, 0.6)' },
];

export const RUNE_SYMBOLS = [
  'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ',
  'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ',
];

export const NEON_CYAN = '#00FFFF';
export const NEON_GOLD = '#FFD700';
export const DARK_BG = '#0a0e27';
export const GRAY_STONE = '#4a4a5a';
export const MOSS_GREEN = '#2d5a3d';

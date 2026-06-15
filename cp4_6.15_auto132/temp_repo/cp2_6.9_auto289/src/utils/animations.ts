export type TimeOfDay = 'dawn' | 'noon' | 'dusk' | 'night';

export const SKY_GRADIENTS: Record<TimeOfDay, [string, string]> = {
  dawn: ['#a0c4ff', '#ffd166'],
  noon: ['#87ceeb', '#f0e68c'],
  dusk: ['#ff7f50', '#4b0082'],
  night: ['#2c2c54', '#1a1a2e'],
};

export const AMBIENT_COLORS: Record<TimeOfDay, string> = {
  dawn: '#a0c4ff',
  noon: '#fffacd',
  dusk: '#ffd166',
  night: '#2c2c54',
};

export const RATTLE_DURATION = 0.5;
export const PRODUCT_HOVER_DURATION = 0.2;
export const WEATHER_TRANSITION = 0.8;
export const TIME_TRANSITION = 1.2;
export const COIN_FLOAT_DURATION = 1.5;
export const PASSERBY_STOP_DURATION = 2;
export const WIPE_SWEAT_DURATION = 0.5;

export const EASE_OUT = 'ease-out';

export type EasingType = typeof EASE_OUT;

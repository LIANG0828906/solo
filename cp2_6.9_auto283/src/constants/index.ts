import type { QinzhenMaterial, StringType } from '../types';

export const STRING_BASE_FREQUENCIES: number[] = [65.41, 73.42, 82.41, 98.00, 110.00, 130.81, 146.83];

export const STRING_TENSION: Record<StringType, number> = {
  taigu: 1.15,
  zhongqing: 1.0,
  xihe: 0.85,
};

export const QINZHEN_COLORS: Record<QinzhenMaterial, string> = {
  jade: '#a0c4c8',
  bone: '#f5deb3',
  wood: '#8b4513',
  copper: '#b87333',
};

export const LACQUER_COLORS: string[] = [
  '#4a2c1a',
  '#2c1810',
  '#5c3d2e',
  '#3d2314',
  '#6b4423',
  '#1a0f0a',
];

export const KEYBOARD_MAP: Record<string, number> = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
  j: 4,
  k: 5,
  l: 6,
};

export const SCALE_VALIDATION = {
  MAX_DEVIATION_CENTS: 10,
  WARNING_DEVIATION_CENTS: 5,
  PERFECT_ACCURACY_THRESHOLD: 98,
  GOOD_ACCURACY_THRESHOLD: 90,
  PASSING_ACCURACY_THRESHOLD: 80,
} as const;

export const STRING_NAMES: string[] = ['一弦', '二弦', '三弦', '四弦', '五弦', '六弦', '七弦'];

export const NOTE_NAMES: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const A4_FREQUENCY = 440;
export const A4_MIDI = 69;

export const TUNING_RANGE = {
  MIN: -45,
  MAX: 45,
} as const;

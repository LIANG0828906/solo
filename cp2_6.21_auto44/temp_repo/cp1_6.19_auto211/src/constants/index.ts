import { NoteColor } from '@/types';

export const NOTE_FREQUENCIES: Record<NoteColor, number> = {
  red: 261.63,
  orange: 293.66,
  yellow: 329.63,
  green: 349.23,
  blue: 392.00,
};

export const NOTE_COLORS: Record<NoteColor, string> = {
  red: '#FF4136',
  orange: '#FF851B',
  yellow: '#FFDC00',
  green: '#2ECC40',
  blue: '#0074D9',
};

export const CORRECT_ORDER: NoteColor[] = ['red', 'orange', 'yellow', 'green', 'blue'];

export const GRID_SIZE = 20;
export const CELL_SIZE = 32;
export const CELL_SIZE_SMALL = 24;
export const WALL_THICKNESS = 4;
export const WAVE_DURATION = 1500;
export const WAVE_AMPLITUDE = 4;
export const MOVE_DURATION = 0.2;
export const COLLECT_ANIMATION_DURATION = 0.3;
export const COLOR_TRANSITION_DURATION = 0.3;
export const NOTE_DURATION = 500;

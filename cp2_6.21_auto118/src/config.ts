export const COLORS = {
  red: '#ff4444',
  blue: '#4488ff',
  green: '#44cc44',
  yellow: '#ffdd44',
  orange: '#ff8844',
  purple: '#bb44ff',
  white: '#ffffff',
  gray: '#888888'
};

export const COLOR_LIST = [
  { name: 'red', value: '#ff4444' },
  { name: 'blue', value: '#4488ff' },
  { name: 'green', value: '#44cc44' },
  { name: 'yellow', value: '#ffdd44' },
  { name: 'orange', value: '#ff8844' },
  { name: 'purple', value: '#bb44ff' },
  { name: 'white', value: '#ffffff' },
  { name: 'gray', value: '#888888' }
];

export const GRID = {
  CELL_SIZE: 32,
  GRID_SIZE: 16,
  GRID_MIN: -8,
  GRID_MAX: 8
};

export const CAMERA = {
  FREE: { x: 120, y: 100, z: 120 },
  FRONT: { x: 0, y: 0, z: 200 },
  SIDE: { x: 200, y: 0, z: 0 },
  TOP: { x: 0, y: 200, z: 0.01 },
  PERSPECTIVE: { x: 150, y: 80, z: 150 }
};

export const DAMPING = 0.95;

export const ANIMATION = {
  PLACE_DURATION: 150,
  REMOVE_DURATION: 150,
  HIGHLIGHT_FADE_DELAY: 150,
  ERROR_MESSAGE_DURATION: 500,
  CAMERA_SHAKE_INTENSITY: 2,
  CAMERA_SHAKE_DURATION: 300
};

export const HIGHLIGHT_COLOR = '#aaddff';
export const ERROR_COLOR = 'rgba(255, 68, 68, 0.8)';
export const BACKGROUND_COLOR = '#1a1a1a';
export const GRID_COLOR = '#3a3a3a';

export const MAX_VOXELS = 2000;

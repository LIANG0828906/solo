export const GRID_SIZE = 6;
export const CABINET_COUNT = GRID_SIZE * GRID_SIZE;

export const CABINET_WIDTH = 1.2;
export const CABINET_DEPTH = 1.2;
export const CABINET_SPACING = 2.2;

export const POWER_MIN = 200;
export const POWER_MAX = 800;
export const HEIGHT_MIN = 1;
export const HEIGHT_MAX = 4;

export const TEMP_MIN = 20;
export const TEMP_MAX = 60;

export const HISTORY_FRAMES = 12;
export const FRAME_INTERVAL = 5;

export const COLORS = {
  bg: '#1a1a2e',
  panel: '#16213e',
  primary: '#0f3460',
  accent: '#e94560',
  text: '#e0e0e0',
  textSecondary: '#8892b0',
  ground: 'rgba(255, 255, 255, 0.04)',
  gridLine: 'rgba(255, 255, 255, 0.08)',
};

export const ANIMATION = {
  modeTransition: 0.3,
  filterFade: 0.5,
  focusCamera: 1,
  haloDuration: 2,
  tooltipFade: 0.2,
};

export const ZONE_RANGES = {
  A: { start: 1, end: 12 },
  B: { start: 13, end: 24 },
  C: { start: 25, end: 36 },
};

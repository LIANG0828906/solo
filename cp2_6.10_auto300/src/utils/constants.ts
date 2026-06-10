export const CELL_SIZE = 2;
export const WALL_HEIGHT = 2;
export const PLAYER_RADIUS = 0.3;
export const PLAYER_SPEED = 4;
export const DASH_SPEED = 10;
export const DASH_DURATION = 0.2;
export const DASH_COOLDOWN = 2;
export const BEAM_ROTATION_BASE_SPEED = 0.5;
export const SHARD_COLLECT_DISTANCE = 0.8;
export const PORTAL_ACTIVATE_DISTANCE = 1.2;
export const TRAIL_LENGTH = 30;

export const LEVEL_CONFIGS = [
  {
    size: 7,
    shardsRequired: 5,
    beamCount: 2,
    beamSpeed: 0.8,
    colors: {
      primary: '#9b59b6',
      secondary: '#8e44ad',
      accent: '#00e5ff',
      wall: 'rgba(155, 89, 182, 0.6)',
      beam: '#e74c3c',
      shard: '#00e5ff',
    },
  },
  {
    size: 9,
    shardsRequired: 8,
    beamCount: 3,
    beamSpeed: 1.2,
    colors: {
      primary: '#e67e22',
      secondary: '#d35400',
      accent: '#f1c40f',
      wall: 'rgba(230, 126, 34, 0.6)',
      beam: '#2ecc71',
      shard: '#f1c40f',
    },
  },
  {
    size: 11,
    shardsRequired: 12,
    beamCount: 4,
    beamSpeed: 1.8,
    colors: {
      primary: '#1abc9c',
      secondary: '#16a085',
      accent: '#9b59b6',
      wall: 'rgba(26, 188, 156, 0.6)',
      beam: '#e91e63',
      shard: '#9b59b6',
    },
  },
];

export const TOTAL_LEVELS = LEVEL_CONFIGS.length;

export const BOARD_SIZE = 8;

export const CELL_SIZE = 60;

export const MERCURY_POOL = {
  x: 2,
  y: 2,
  width: 4,
  height: 4,
};

export const BOI_POSITIONS = [
  { x: 2, y: 2 },
  { x: 5, y: 2 },
  { x: 2, y: 5 },
  { x: 5, y: 5 },
];

export const FISH_COUNT = 12;

export const ZHU_COUNT = 6;

export const PIECE_COUNT_PER_PLAYER = 6;

export const COLORS = {
  darkGold: '#b8860b',
  inkBlack: '#1a1a1a',
  stoneGray: '#5a5a5a',
  tigerRed: '#d4322f',
  leopardBlue: '#3c3b6e',
  bronzeGreen: '#4a7c59',
  bronzeYellow: '#cda434',
  mercuryLight: '#c0c0c0',
  mercuryDark: '#808080',
  gold: '#ffd700',
  silver: '#c0c0c0',
};

export const INITIAL_TIGER_POSITIONS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 5, y: 0 },
  { x: 6, y: 0 },
  { x: 7, y: 0 },
];

export const INITIAL_LEOPARD_POSITIONS = [
  { x: 0, y: 7 },
  { x: 1, y: 7 },
  { x: 2, y: 7 },
  { x: 5, y: 7 },
  { x: 6, y: 7 },
  { x: 7, y: 7 },
];

export const FISH_POOL_POSITIONS = Array.from({ length: 12 }, (_, i) => ({
  x: 2 + (i % 4),
  y: 2 + Math.floor(i / 4),
}));

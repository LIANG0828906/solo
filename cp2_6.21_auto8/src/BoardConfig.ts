import type { BoardCell, PlayerColor } from './types';

export const TOTAL_CELLS = 28;

export const PLAYER_START_POSITIONS: Record<PlayerColor, number> = {
  red: 0,
  blue: 7,
  yellow: 14,
  green: 21,
};

export const PLAYER_COLORS: Record<PlayerColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  green: '#22C55E',
};

export const ZONE_COLORS: Record<string, string> = {
  red: 'rgba(239, 68, 68, 0.15)',
  blue: 'rgba(59, 130, 246, 0.15)',
  yellow: 'rgba(245, 158, 11, 0.15)',
  green: 'rgba(34, 197, 94, 0.15)',
  center: 'rgba(148, 163, 184, 0.08)',
};

export function getColorForZone(zone: string): string {
  return ZONE_COLORS[zone] ?? ZONE_COLORS.center;
}

const ZONE_MAP: Record<number, BoardCell['zone']> = {};
[0, 1, 2, 3].forEach((i) => { ZONE_MAP[i] = 'red'; });
[7, 8, 9, 10].forEach((i) => { ZONE_MAP[i] = 'blue'; });
[14, 15, 16, 17].forEach((i) => { ZONE_MAP[i] = 'yellow'; });
[21, 22, 23, 24].forEach((i) => { ZONE_MAP[i] = 'green'; });
[4, 5, 6, 11, 12, 13, 18, 19, 20, 25, 26, 27].forEach((i) => { ZONE_MAP[i] = 'center'; });

const START_MAP: Record<number, PlayerColor> = {
  0: 'red',
  7: 'blue',
  14: 'yellow',
  21: 'green',
};

const EVENT_CELLS = new Set([3, 10, 17, 24]);

const SHORTCUT_MAP: Record<number, number> = {
  5: 11,
  12: 18,
  19: 25,
  26: 4,
};

const POSITIONS: Array<[number, number]> = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
  [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
  [7, 7], [7, 6], [7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0],
  [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0],
];

export const BOARD_CELLS: BoardCell[] = Array.from({ length: TOTAL_CELLS }, (_, i) => {
  const [row, col] = POSITIONS[i];
  const isShortcut = i in SHORTCUT_MAP;
  return {
    index: i,
    zone: ZONE_MAP[i],
    row,
    col,
    isStart: i in START_MAP,
    startForColor: START_MAP[i],
    isEvent: EVENT_CELLS.has(i),
    isShortcut,
    shortcutTarget: isShortcut ? SHORTCUT_MAP[i] : undefined,
  };
});

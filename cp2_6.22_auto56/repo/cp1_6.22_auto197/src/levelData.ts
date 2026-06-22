import type { LevelData, Platform, PressurePlate, Door, PushableBox } from './types';

const TILE = 40;

function makePlatform(col: number, row: number, cols: number = 1, rows: number = 1, type: Platform['type'] = 'solid'): Platform {
  return {
    x: col * TILE,
    y: row * TILE,
    w: cols * TILE,
    h: rows * TILE,
    type
  };
}

function makePlate(id: string, col: number, row: number, linkedDoorIds: string[]): PressurePlate {
  return {
    id,
    x: col * TILE,
    y: row * TILE + TILE - 8,
    w: TILE,
    h: 8,
    activated: false,
    linkedDoorIds
  };
}

function makeDoor(id: string, col: number, row: number, rows: number = 2, isTimed: boolean = false, maxTimer: number = 0): Door {
  return {
    id,
    x: col * TILE,
    y: row * TILE,
    w: TILE * 0.6,
    h: rows * TILE,
    open: false,
    timer: 0,
    maxTimer,
    isTimed
  };
}

function makeBox(id: string, col: number, row: number): PushableBox {
  return {
    id,
    x: col * TILE + 4,
    y: row * TILE,
    w: TILE - 8,
    h: TILE - 8,
    vx: 0,
    vy: 0
  };
}

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: '第一关 · 初遇时空',
    width: 800,
    height: 600,
    spawn: { x: 60, y: 480 },
    platforms: [
      makePlatform(0, 14, 20),
      makePlatform(5, 11, 3),
      makePlatform(10, 8, 3),
      makePlatform(15, 11, 3),
      makePlatform(7, 7, 1, 1, 'spike'),
      makePlatform(12, 7, 1, 1, 'spike'),
    ],
    plates: [
      makePlate('plate1', 6, 10, ['door1']),
    ],
    doors: [
      makeDoor('door1', 14, 9, 2),
    ],
    boxes: [
      makeBox('box1', 3, 13),
    ],
    goal: {
      x: 18 * TILE,
      y: 13 * TILE - TILE,
      w: TILE,
      h: TILE
    }
  },
  {
    id: 2,
    name: '第二关 · 分身协作',
    width: 800,
    height: 600,
    spawn: { x: 60, y: 480 },
    platforms: [
      makePlatform(0, 14, 20),
      makePlatform(3, 11, 2),
      makePlatform(7, 11, 2),
      makePlatform(11, 11, 2),
      makePlatform(15, 11, 2),
      makePlatform(0, 7, 5),
      makePlatform(15, 7, 5),
      makePlatform(9, 4, 2),
      makePlatform(5, 13, 1, 1, 'spike'),
      makePlatform(10, 13, 1, 1, 'spike'),
    ],
    plates: [
      makePlate('plate1', 1, 6, ['door1']),
      makePlate('plate2', 17, 6, ['door1']),
    ],
    doors: [
      makeDoor('door1', 9, 2, 2),
    ],
    boxes: [
      makeBox('box1', 8, 10),
      makeBox('box2', 12, 10),
    ],
    goal: {
      x: 9 * TILE + 10,
      y: 3 * TILE,
      w: TILE - 20,
      h: TILE
    }
  },
  {
    id: 3,
    name: '第三关 · 限时之门',
    width: 800,
    height: 600,
    spawn: { x: 60, y: 480 },
    platforms: [
      makePlatform(0, 14, 20),
      makePlatform(0, 10, 2),
      makePlatform(4, 10, 2),
      makePlatform(8, 10, 2),
      makePlatform(12, 10, 2),
      makePlatform(16, 10, 4),
      makePlatform(2, 6, 3),
      makePlatform(9, 6, 3),
      makePlatform(16, 6, 2),
      makePlatform(6, 13, 1, 1, 'spike'),
      makePlatform(11, 13, 1, 1, 'spike'),
      makePlatform(14, 13, 1, 1, 'spike'),
    ],
    plates: [
      makePlate('plate1', 0, 9, ['door1']),
      makePlate('plate2', 9, 5, ['door2']),
    ],
    doors: [
      makeDoor('door1', 5, 8, 2, true, 3),
      makeDoor('door2', 15, 5, 2, false, 0),
    ],
    boxes: [
      makeBox('box1', 10, 9),
      makeBox('box2', 3, 5),
    ],
    goal: {
      x: 17 * TILE,
      y: 5 * TILE - TILE,
      w: TILE,
      h: TILE
    }
  }
];

export function getLevelById(id: number): LevelData | undefined {
  return LEVELS.find(l => l.id === id);
}

export function getTotalLevels(): number {
  return LEVELS.length;
}

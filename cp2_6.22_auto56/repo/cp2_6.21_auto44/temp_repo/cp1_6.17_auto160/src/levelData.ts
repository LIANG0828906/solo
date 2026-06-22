export const CELL_SIZE = 40;
export const COLS = 20;
export const ROWS = 15;
export const CANVAS_W = 800;
export const CANVAS_H = 600;

export interface EnemySpawn {
  gridX: number;
  gridY: number;
  facing: 'up' | 'down' | 'left' | 'right';
  patrolPath: { gridX: number; gridY: number }[];
}

export interface LevelConfig {
  map: number[][];
  playerStart: { gridX: number; gridY: number };
  enemies: EnemySpawn[];
}

const MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,0,1,0,1,1,0,1,1,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,0,1,0,1,1,1,1,0,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,0,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
  [1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const levelData: LevelConfig = {
  map: MAP,
  playerStart: { gridX: 1, gridY: 1 },
  enemies: [
    {
      gridX: 5,
      gridY: 5,
      facing: 'right',
      patrolPath: [
        { gridX: 5, gridY: 5 },
        { gridX: 5, gridY: 7 },
        { gridX: 5, gridY: 5 },
      ],
    },
    {
      gridX: 14,
      gridY: 11,
      facing: 'left',
      patrolPath: [
        { gridX: 14, gridY: 11 },
        { gridX: 14, gridY: 9 },
        { gridX: 14, gridY: 11 },
      ],
    },
  ],
};

export function isWall(gridX: number, gridY: number): boolean {
  if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return true;
  return MAP[gridY][gridX] === 1;
}

export function isWallPixel(px: number, py: number): boolean {
  const gx = Math.floor(px / CELL_SIZE);
  const gy = Math.floor(py / CELL_SIZE);
  return isWall(gx, gy);
}

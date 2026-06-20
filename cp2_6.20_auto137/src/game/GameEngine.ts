export enum TerrainType {
  GRASS = 'grass',
  BUSH = 'bush',
  MUD = 'mud',
  RIVER = 'river',
}

export interface Cell {
  x: number;
  y: number;
  terrain: TerrainType;
}

export interface Entity {
  x: number;
  y: number;
  stamina: number;
  maxStamina: number;
}

export interface Fruit {
  x: number;
  y: number;
}

export interface AnimationState {
  isAnimating: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  entity: 'cheetah' | 'antelope';
}

export interface GameState {
  grid: Cell[][];
  cheetah: Entity;
  antelope: Entity;
  fruits: Fruit[];
  turn: number;
  isGameOver: boolean;
  winner: 'cheetah' | 'antelope' | null;
  selectedCell: { x: number; y: number } | null;
  animation: AnimationState | null;
}

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 8;
export const INITIAL_STAMINA = 50;
export const FRUIT_STAMINA_BONUS = 15;
export const CHEETAH_MOVE_COST = 2;
export const ANTELOPE_MOVE_COST = 1;
export const FRUIT_SPAWN_INTERVAL = 5;
export const FRUIT_SPAWN_COUNT = 3;
export const MOVE_ANIMATION_DURATION = 300;

const TERRAIN_WEIGHTS: Record<TerrainType, number> = {
  [TerrainType.GRASS]: 55,
  [TerrainType.BUSH]: 25,
  [TerrainType.MUD]: 12,
  [TerrainType.RIVER]: 8,
};

export const TERRAIN_COST: Record<TerrainType, number> = {
  [TerrainType.GRASS]: 1,
  [TerrainType.BUSH]: 2,
  [TerrainType.MUD]: 3,
  [TerrainType.RIVER]: Infinity,
};

function weightedRandomTerrain(): TerrainType {
  const total = Object.values(TERRAIN_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [terrain, weight] of Object.entries(TERRAIN_WEIGHTS)) {
    r -= weight;
    if (r <= 0) return terrain as TerrainType;
  }
  return TerrainType.GRASS;
}

export function generateGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ x, y, terrain: weightedRandomTerrain() });
    }
    grid.push(row);
  }
  grid[0][0].terrain = TerrainType.GRASS;
  grid[height - 1][width - 1].terrain = TerrainType.GRASS;
  return grid;
}

export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT;
}

export function canMoveTo(state: GameState, x: number, y: number): boolean {
  if (!isInBounds(x, y)) return false;
  return state.grid[y][x].terrain !== TerrainType.RIVER;
}

export function getMoveCost(state: GameState, x: number, y: number): number {
  if (!isInBounds(x, y)) return Infinity;
  return TERRAIN_COST[state.grid[y][x].terrain];
}

export function isAdjacent(x1: number, y1: number, x2: number, y2: number): boolean {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function findPath(
  state: GameState,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] | null {
  if (startX === endX && startY === endY) return [];

  const visited = new Set<string>();
  const queue: { x: number; y: number; path: { x: number; y: number }[] }[] = [
    { x: startX, y: startY, path: [] },
  ];
  visited.add(`${startX},${startY}`);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const { dx, dy } of directions) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      if (!canMoveTo(state, nx, ny)) continue;
      const newPath = [...current.path, { x: nx, y: ny }];
      if (nx === endX && ny === endY) return newPath;
      visited.add(key);
      queue.push({ x: nx, y: ny, path: newPath });
    }
  }
  return null;
}

export function getCheetahNextMove(state: GameState): { x: number; y: number } | null {
  const { cheetah, antelope } = state;
  const path = findPath(state, cheetah.x, cheetah.y, antelope.x, antelope.y);
  if (!path || path.length === 0) return null;
  return path[0];
}

export function spawnFruits(state: GameState, count: number): Fruit[] {
  const occupied = new Set<string>();
  occupied.add(`${state.cheetah.x},${state.cheetah.y}`);
  occupied.add(`${state.antelope.x},${state.antelope.y}`);
  for (const f of state.fruits) occupied.add(`${f.x},${f.y}`);

  const candidates: Fruit[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (occupied.has(`${x},${y}`)) continue;
      if (state.grid[y][x].terrain === TerrainType.RIVER) continue;
      candidates.push({ x, y });
    }
  }

  const results: Fruit[] = [...state.fruits];
  for (let i = 0; i < count && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    results.push(candidates[idx]);
    candidates.splice(idx, 1);
  }
  return results;
}

export function checkCollision(state: GameState): boolean {
  return state.cheetah.x === state.antelope.x && state.cheetah.y === state.antelope.y;
}

export function checkGameOver(state: GameState): {
  isOver: boolean;
  winner: 'cheetah' | 'antelope' | null;
} {
  if (checkCollision(state)) {
    return { isOver: true, winner: 'cheetah' };
  }
  if (state.cheetah.stamina <= 0) {
    return { isOver: true, winner: 'antelope' };
  }
  if (state.antelope.stamina <= 0) {
    return { isOver: true, winner: 'cheetah' };
  }
  return { isOver: false, winner: null };
}

export function collectFruit(state: GameState): {
  fruits: Fruit[];
  staminaGained: number;
} {
  const newFruits = state.fruits.filter(
    (f) => !(f.x === state.antelope.x && f.y === state.antelope.y)
  );
  const collected = state.fruits.length - newFruits.length;
  return {
    fruits: newFruits,
    staminaGained: collected * FRUIT_STAMINA_BONUS,
  };
}

export function createInitialState(): GameState {
  const grid = generateGrid(GRID_WIDTH, GRID_HEIGHT);
  const state: GameState = {
    grid,
    cheetah: { x: 0, y: 0, stamina: INITIAL_STAMINA, maxStamina: INITIAL_STAMINA },
    antelope: {
      x: GRID_WIDTH - 1,
      y: GRID_HEIGHT - 1,
      stamina: INITIAL_STAMINA,
      maxStamina: INITIAL_STAMINA,
    },
    fruits: [],
    turn: 0,
    isGameOver: false,
    winner: null,
    selectedCell: null,
    animation: null,
  };
  state.fruits = spawnFruits(state, FRUIT_SPAWN_COUNT);
  return state;
}

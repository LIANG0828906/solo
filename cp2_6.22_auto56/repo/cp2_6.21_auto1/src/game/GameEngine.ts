export enum TerrainType {
  GRASS = 0,
  BUSH = 1,
  MUD = 2,
  RIVER = 3,
}

export interface Position {
  x: number;
  y: number;
}

export interface Afterimage {
  pos: Position;
  type: 'cheetah' | 'antelope';
  opacity: number;
  lifetime: number;
  maxLifetime: number;
}

export interface GameState {
  grid: TerrainType[][];
  cheetahPos: Position;
  antelopePos: Position;
  cheetahStamina: number;
  antelopeStamina: number;
  fruits: Position[];
  steps: number;
  round: number;
  isGameOver: boolean;
  winner: 'cheetah' | 'antelope' | null;
  currentTurn: 'cheetah' | 'antelope';
  animatingCharacter: 'cheetah' | 'antelope' | null;
  animationProgress: number;
  fromPosition: Position | null;
  toPosition: Position | null;
  selectedCell: Position | null;
  afterimages: Afterimage[];
}

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 8;
export const INITIAL_STAMINA = 50;
export const CHEETAH_MOVE_COST = 2;
export const ANTELOPE_MOVE_COST = 1;
export const FRUIT_STAMINA_BONUS = 15;
export const FRUITS_PER_REFRESH = 3;
export const FRUIT_REFRESH_INTERVAL = 5;

const TERRAIN_COST: Record<TerrainType, number> = {
  [TerrainType.GRASS]: 1,
  [TerrainType.BUSH]: 2,
  [TerrainType.MUD]: 3,
  [TerrainType.RIVER]: Infinity,
};

function weightedRandomTerrain(): TerrainType {
  const r = Math.random();
  if (r < 0.5) return TerrainType.GRASS;
  if (r < 0.75) return TerrainType.BUSH;
  if (r < 0.9) return TerrainType.MUD;
  return TerrainType.RIVER;
}

function generateGrid(): TerrainType[][] {
  const grid: TerrainType[][] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: TerrainType[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push(weightedRandomTerrain());
    }
    grid.push(row);
  }
  return grid;
}

function ensurePassableAround(grid: TerrainType[][], pos: Position): void {
  const dirs = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  for (const d of dirs) {
    const nx = pos.x + d.x;
    const ny = pos.y + d.y;
    if (nx >= 0 && nx < GRID_WIDTH && ny >= 0 && ny < GRID_HEIGHT) {
      if (grid[ny][nx] === TerrainType.RIVER) {
        grid[ny][nx] = TerrainType.GRASS;
      }
    }
  }
}

export function posEq(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isAdjacent(a: Position, b: Position): boolean {
  return manhattan(a, b) === 1;
}

export function inBounds(p: Position): boolean {
  return p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT;
}

export function getTerrainCost(grid: TerrainType[][], pos: Position): number {
  return TERRAIN_COST[grid[pos.y][pos.x]];
}

export function isPassable(grid: TerrainType[][], pos: Position): boolean {
  if (!inBounds(pos)) return false;
  return grid[pos.y][pos.x] !== TerrainType.RIVER;
}

export function createInitialState(): GameState {
  let grid = generateGrid();
  const cheetahPos: Position = { x: 1, y: Math.floor(GRID_HEIGHT / 2) };
  const antelopePos: Position = { x: GRID_WIDTH - 2, y: Math.floor(GRID_HEIGHT / 2) };
  ensurePassableAround(grid, cheetahPos);
  ensurePassableAround(grid, antelopePos);

  return {
    grid,
    cheetahPos,
    antelopePos,
    cheetahStamina: INITIAL_STAMINA,
    antelopeStamina: INITIAL_STAMINA,
    fruits: [],
    steps: 0,
    round: 1,
    isGameOver: false,
    winner: null,
    currentTurn: 'cheetah',
    animatingCharacter: null,
    animationProgress: 0,
    fromPosition: null,
    toPosition: null,
    selectedCell: null,
    afterimages: [],
  };
}

export function getMovableCells(state: GameState, character: 'cheetah' | 'antelope'): Position[] {
  const pos = character === 'cheetah' ? state.cheetahPos : state.antelopePos;
  const stamina = character === 'cheetah' ? state.cheetahStamina : state.antelopeStamina;
  const baseCost = character === 'cheetah' ? CHEETAH_MOVE_COST : ANTELOPE_MOVE_COST;
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const result: Position[] = [];
  for (const d of dirs) {
    const np = { x: pos.x + d.x, y: pos.y + d.y };
    if (!inBounds(np)) continue;
    if (!isPassable(state.grid, np)) continue;
    const terrainCost = getTerrainCost(state.grid, np);
    const total = baseCost + terrainCost - 1;
    if (stamina >= total) {
      result.push(np);
    }
  }
  return result;
}

export interface MoveResult {
  newState: GameState;
  valid: boolean;
}

function getMoveCost(
  state: GameState,
  character: 'cheetah' | 'antelope',
  target: Position
): number {
  const base = character === 'cheetah' ? CHEETAH_MOVE_COST : ANTELOPE_MOVE_COST;
  const terrain = getTerrainCost(state.grid, target);
  return base + terrain - 1;
}

function spawnFruits(state: GameState, count: number): Position[] {
  const occupied = new Set<string>();
  occupied.add(`${state.cheetahPos.x},${state.cheetahPos.y}`);
  occupied.add(`${state.antelopePos.x},${state.antelopePos.y}`);
  state.fruits.forEach((f) => occupied.add(`${f.x},${f.y}`));

  const candidates: Position[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      if (state.grid[y][x] === TerrainType.RIVER) continue;
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        candidates.push({ x, y });
      }
    }
  }

  const newFruits: Position[] = [...state.fruits];
  for (let i = 0; i < count && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    newFruits.push(candidates[idx]);
    candidates.splice(idx, 1);
  }
  return newFruits;
}

export function attemptMove(
  state: GameState,
  character: 'cheetah' | 'antelope',
  target: Position
): MoveResult {
  if (state.isGameOver || state.animatingCharacter !== null) {
    return { newState: state, valid: false };
  }
  if (state.currentTurn !== character) {
    return { newState: state, valid: false };
  }
  const currentPos = character === 'cheetah' ? state.cheetahPos : state.antelopePos;
  if (!isAdjacent(currentPos, target)) {
    return { newState: state, valid: false };
  }
  if (!isPassable(state.grid, target)) {
    return { newState: state, valid: false };
  }
  const stamina = character === 'cheetah' ? state.cheetahStamina : state.antelopeStamina;
  const cost = getMoveCost(state, character, target);
  if (stamina < cost) {
    return { newState: state, valid: false };
  }

  const newState: GameState = {
    ...state,
    animatingCharacter: character,
    animationProgress: 0,
    fromPosition: { ...currentPos },
    toPosition: { ...target },
    selectedCell: null,
  };

  return { newState, valid: true };
}

export function finishAnimation(state: GameState): GameState {
  if (state.animatingCharacter === null || !state.toPosition) {
    return state;
  }
  const character = state.animatingCharacter;
  const target = state.toPosition;

  let newState: GameState = {
    ...state,
    animatingCharacter: null,
    animationProgress: 0,
    fromPosition: null,
    toPosition: null,
  };

  const cost = getMoveCost(state, character, target);

  if (character === 'cheetah') {
    newState.cheetahPos = { ...target };
    newState.cheetahStamina = Math.max(0, newState.cheetahStamina - cost);
  } else {
    newState.antelopePos = { ...target };
    newState.antelopeStamina = Math.max(0, newState.antelopeStamina - cost);
  }

  newState.steps = state.steps + 1;
  if (character === 'antelope') {
    newState.round = state.round + 1;
    newState.currentTurn = 'cheetah';
  } else {
    newState.currentTurn = 'antelope';
  }

  if (posEq(newState.cheetahPos, newState.antelopePos)) {
    newState.isGameOver = true;
    newState.winner = 'cheetah';
    return newState;
  }

  if (newState.cheetahStamina <= 0) {
    newState.isGameOver = true;
    newState.winner = 'antelope';
    return newState;
  }
  if (newState.antelopeStamina <= 0) {
    newState.isGameOver = true;
    newState.winner = 'cheetah';
    return newState;
  }

  if (character === 'antelope') {
    const fruitIdx = newState.fruits.findIndex((f) => posEq(f, newState.antelopePos));
    if (fruitIdx !== -1) {
      newState.antelopeStamina = Math.min(
        INITIAL_STAMINA + 50,
        newState.antelopeStamina + FRUIT_STAMINA_BONUS
      );
      newState.fruits = [
        ...newState.fruits.slice(0, fruitIdx),
        ...newState.fruits.slice(fruitIdx + 1),
      ];
    }
  }

  if (newState.steps % FRUIT_REFRESH_INTERVAL === 0 && newState.steps > 0) {
    newState.fruits = spawnFruits(newState, FRUITS_PER_REFRESH);
  }

  const remainingCheetah = getMovableCells(newState, 'cheetah').length;
  const remainingAntelope = getMovableCells(newState, 'antelope').length;
  if (character === 'cheetah' && remainingAntelope === 0) {
    newState.isGameOver = true;
    newState.winner = 'cheetah';
  } else if (character === 'antelope' && remainingCheetah === 0) {
    newState.isGameOver = true;
    newState.winner = 'antelope';
  }

  return newState;
}

export function updateAfterimages(state: GameState, deltaMs: number): GameState {
  if (state.afterimages.length === 0) return state;
  const updated = state.afterimages
    .map((a) => ({
      ...a,
      lifetime: a.lifetime - deltaMs,
      opacity: Math.max(0, a.lifetime / a.maxLifetime),
    }))
    .filter((a) => a.lifetime > 0);
  return { ...state, afterimages: updated };
}

export function addAfterimage(
  state: GameState,
  pos: Position,
  type: 'cheetah' | 'antelope',
  durationMs = 300
): GameState {
  return {
    ...state,
    afterimages: [
      ...state.afterimages,
      { pos: { ...pos }, type, opacity: 1, lifetime: durationMs, maxLifetime: durationMs },
    ],
  };
}

export type GridCell = {
  id: string;
  level: number;
  row: number;
  col: number;
} | null;

export type Grid = GridCell[][];

export type AnimalConfig = {
  emoji: string;
  color: string;
  bgColor: string;
};

export type TownArea = {
  id: string;
  name: string;
  type: 'forest' | 'lake' | 'residential' | 'park' | 'commercial';
  unlocked: boolean;
  unlockLevel: number;
  baseCoinPer5s: number;
  coinMultiplier: number;
  decorations: string[];
  color: string;
  lockedColor: string;
  position: { x: number; y: number; w: number; h: number };
};

export type FloatingCoin = {
  id: string;
  amount: number;
  x: number;
  y: number;
  createdAt: number;
};

export type MergeAnimation = {
  id: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  level: number;
  startTime: number;
  duration: number;
};

export const ANIMAL_CONFIGS: Record<number, AnimalConfig> = {
  1: { emoji: '🐣', color: '#FFE4B5', bgColor: '#FFF8DC' },
  2: { emoji: '🐥', color: '#FFD700', bgColor: '#FFFACD' },
  3: { emoji: '🐤', color: '#FFA500', bgColor: '#FFE4B5' },
  4: { emoji: '🐰', color: '#FFB6C1', bgColor: '#FFF0F5' },
  5: { emoji: '🐱', color: '#FFA07A', bgColor: '#FFE4E1' },
  6: { emoji: '🐶', color: '#D2691E', bgColor: '#FAEBD7' },
  7: { emoji: '🦊', color: '#FF7F50', bgColor: '#FFF5EE' },
  8: { emoji: '🐼', color: '#2F4F4F', bgColor: '#F5F5F5' },
  9: { emoji: '🦁', color: '#DAA520', bgColor: '#FFF8DC' },
  10: { emoji: '🐲', color: '#32CD32', bgColor: '#F0FFF0' },
};

export const DECORATION_EMOJIS = ['🌳', '🌸', '🏠', '⛲', '🏪', '🌻', '🍄', '🦋'];

export const GRID_SIZE = 4;
export const MAX_LEVEL = 10;
export const MAX_DECORATIONS = 8;
export const COIN_PRODUCTION_INTERVAL = 5000;
export const MERGE_ANIMATION_DURATION = 300;
export const UNLOCK_ANIMATION_DURATION = 500;
export const FLOATING_COIN_DURATION = 1500;

export const createEmptyGrid = (): Grid => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const getRandomEmptyCell = (grid: Grid): { row: number; col: number } | null => {
  const emptyCells: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

export const addRandomAnimal = (grid: Grid, level: number = 1): Grid => {
  const emptyCell = getRandomEmptyCell(grid);
  if (!emptyCell) return grid;
  
  const newGrid = grid.map(row => [...row]);
  newGrid[emptyCell.row][emptyCell.col] = {
    id: generateId(),
    level,
    row: emptyCell.row,
    col: emptyCell.col,
  };
  return newGrid;
};

export const isAdjacent = (
  r1: number, c1: number, 
  r2: number, c2: number
): boolean => {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

export const canMerge = (
  grid: Grid,
  r1: number, c1: number,
  r2: number, c2: number
): boolean => {
  const cell1 = grid[r1]?.[c1];
  const cell2 = grid[r2]?.[c2];
  
  if (!cell1 || !cell2) return false;
  if (cell1.level !== cell2.level) return false;
  if (cell1.level >= MAX_LEVEL) return false;
  return isAdjacent(r1, c1, r2, c2);
};

export type MergeResult = {
  grid: Grid;
  newLevel: number;
  targetRow: number;
  targetCol: number;
  success: boolean;
};

export const mergeCells = (
  grid: Grid,
  r1: number, c1: number,
  r2: number, c2: number
): MergeResult => {
  if (!canMerge(grid, r1, c1, r2, c2)) {
    return { grid, newLevel: 0, targetRow: -1, targetCol: -1, success: false };
  }

  const cell1 = grid[r1][c1]!;
  const newLevel = cell1.level + 1;

  const newGrid = grid.map(row => [...row]);
  newGrid[r1][c1] = null;
  newGrid[r2][c2] = null;
  newGrid[r2][c2] = {
    id: generateId(),
    level: newLevel,
    row: r2,
    col: c2,
  };

  return {
    grid: newGrid,
    newLevel,
    targetRow: r2,
    targetCol: c2,
    success: true,
  };
};

export const getMaxLevel = (grid: Grid): number => {
  let max = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = grid[row][col];
      if (cell && cell.level > max) {
        max = cell.level;
      }
    }
  }
  return max;
};

export const isGridFull = (grid: Grid): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === null) return false;
    }
  }
  return true;
};

export const hasPossibleMerge = (grid: Grid): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = grid[row][col];
      if (!cell) continue;
      
      if (col < GRID_SIZE - 1) {
        const right = grid[row][col + 1];
        if (right && right.level === cell.level && cell.level < MAX_LEVEL) {
          return true;
        }
      }
      if (row < GRID_SIZE - 1) {
        const down = grid[row + 1][col];
        if (down && down.level === cell.level && cell.level < MAX_LEVEL) {
          return true;
        }
      }
    }
  }
  return false;
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const calculateScale = (elapsed: number, duration: number): number => {
  const t = Math.min(elapsed / duration, 1);
  const mid = 0.5;
  if (t < mid) {
    return 1 + easeOutCubic(t / mid) * 0.5;
  } else {
    return 1.5 - easeOutCubic((t - mid) / mid) * 0.5;
  }
};

export const calculatePosition = (
  fromX: number, fromY: number,
  toX: number, toY: number,
  elapsed: number, duration: number
): { x: number; y: number } => {
  const t = Math.min(elapsed / duration, 1);
  const eased = easeOutCubic(t);
  return {
    x: fromX + (toX - fromX) * eased,
    y: fromY + (toY - fromY) * eased,
  };
};

export const calculateFlashAlpha = (elapsed: number, duration: number): number => {
  const t = Math.min(elapsed / duration, 1);
  return Math.sin(t * Math.PI) * 0.8;
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const createInitialAreas = (): TownArea[] => [
  {
    id: 'forest',
    name: '魔法森林',
    type: 'forest',
    unlocked: true,
    unlockLevel: 0,
    baseCoinPer5s: 5,
    coinMultiplier: 1,
    decorations: [],
    color: '#90EE90',
    lockedColor: '#A9A9A9',
    position: { x: 10, y: 10, w: 45, h: 40 },
  },
  {
    id: 'lake',
    name: '静谧湖泊',
    type: 'lake',
    unlocked: false,
    unlockLevel: 3,
    baseCoinPer5s: 8,
    coinMultiplier: 1,
    decorations: [],
    color: '#87CEEB',
    lockedColor: '#A9A9A9',
    position: { x: 55, y: 10, w: 40, h: 35 },
  },
  {
    id: 'residential',
    name: '温馨住宅区',
    type: 'residential',
    unlocked: false,
    unlockLevel: 5,
    baseCoinPer5s: 12,
    coinMultiplier: 1,
    decorations: [],
    color: '#DEB887',
    lockedColor: '#A9A9A9',
    position: { x: 10, y: 55, w: 35, h: 40 },
  },
  {
    id: 'park',
    name: '中央公园',
    type: 'park',
    unlocked: false,
    unlockLevel: 7,
    baseCoinPer5s: 15,
    coinMultiplier: 1,
    decorations: [],
    color: '#98FB98',
    lockedColor: '#A9A9A9',
    position: { x: 50, y: 50, w: 25, h: 30 },
  },
  {
    id: 'commercial',
    name: '繁华商业街',
    type: 'commercial',
    unlocked: false,
    unlockLevel: 9,
    baseCoinPer5s: 20,
    coinMultiplier: 1,
    decorations: [],
    color: '#FFB6C1',
    lockedColor: '#A9A9A9',
    position: { x: 75, y: 55, w: 20, h: 40 },
  },
];

export const getDecorationCost = (decorationCount: number): number => {
  return Math.floor(50 * Math.pow(1.5, decorationCount));
};

export const getCoinMultiplier = (decorationCount: number): number => {
  return 1 + decorationCount * 0.1;
};

export const calculateTotalCoinPerCycle = (areas: TownArea[]): number => {
  return areas
    .filter(area => area.unlocked)
    .reduce((total, area) => {
      const multiplier = getCoinMultiplier(area.decorations.length);
      return total + Math.floor(area.baseCoinPer5s * multiplier);
    }, 0);
};

export const checkAreaUnlock = (
  areas: TownArea[],
  maxAnimalLevel: number
): { areas: TownArea[]; unlocked: TownArea | null } => {
  let newlyUnlocked: TownArea | null = null;
  const updatedAreas = areas.map(area => {
    if (!area.unlocked && maxAnimalLevel >= area.unlockLevel) {
      newlyUnlocked = { ...area, unlocked: true };
      return newlyUnlocked;
    }
    return area;
  });
  return { areas: updatedAreas, unlocked: newlyUnlocked };
};

export const addDecoration = (
  areas: TownArea[],
  areaId: string,
  decoration: string
): { areas: TownArea[]; success: boolean; cost: number } => {
  const area = areas.find(a => a.id === areaId);
  if (!area || !area.unlocked) return { areas, success: false, cost: 0 };
  if (area.decorations.length >= MAX_DECORATIONS) return { areas, success: false, cost: 0 };

  const cost = getDecorationCost(area.decorations.length);
  const updatedAreas = areas.map(a => {
    if (a.id === areaId) {
      return {
        ...a,
        decorations: [...a.decorations, decoration],
        coinMultiplier: getCoinMultiplier(a.decorations.length + 1),
      };
    }
    return a;
  });

  return { areas: updatedAreas, success: true, cost };
};

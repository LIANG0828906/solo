export const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#FD79A8'];
export const COLS = 50;
export const ROWS = 30;

export interface LevelResult {
  grid: number[][];
  colorMap: string[];
  steps: number[][][];
}

function createEmptyGrid(cols: number, rows: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initializeGrid(cols: number, rows: number, colorCount: number): number[][] {
  const grid = createEmptyGrid(cols, rows);
  const fillProbability = 0.3;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() < fillProbability) {
        grid[row][col] = randomInt(1, colorCount);
      }
    }
  }

  return grid;
}

function getNeighbors(grid: number[][], row: number, col: number): number[] {
  const neighbors: number[] = [];
  const rows = grid.length;
  const cols = grid[0].length;

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push(grid[nr][nc]);
      }
    }
  }

  return neighbors;
}

function countColors(neighbors: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const color of neighbors) {
    if (color > 0) {
      counts.set(color, (counts.get(color) || 0) + 1);
    }
  }
  return counts;
}

function getMostFrequentColor(counts: Map<number, number>): number | null {
  let maxColor: number | null = null;
  let maxCount = 0;

  for (const [color, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxColor = color;
    }
  }

  return maxCount >= 3 ? maxColor : null;
}

function applyGravity(grid: number[][]): void {
  const rows = grid.length;
  const cols = grid[0].length;

  for (let col = 0; col < cols; col++) {
    let writeRow = rows - 1;

    for (let row = rows - 1; row >= 0; row--) {
      if (grid[row][col] !== 0) {
        if (writeRow !== row) {
          grid[writeRow][col] = grid[row][col];
          grid[row][col] = 0;
        }
        writeRow--;
      }
    }
  }
}

function diffusionStep(grid: number[][]): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const newGrid = createEmptyGrid(cols, rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const neighbors = getNeighbors(grid, row, col);
      const colorCounts = countColors(neighbors);
      const currentColor = grid[row][col];

      if (currentColor === 0) {
        const frequentColor = getMostFrequentColor(colorCounts);
        if (frequentColor !== null && Math.random() < 0.6) {
          newGrid[row][col] = frequentColor;
        }
      } else {
        const sameColorCount = colorCounts.get(currentColor) || 0;
        if (sameColorCount < 2 && Math.random() < 0.3) {
          newGrid[row][col] = 0;
        } else {
          newGrid[row][col] = currentColor;
        }
      }
    }
  }

  applyGravity(newGrid);
  return newGrid;
}

export function generateLevel(seed?: number, steps: number = 20): LevelResult {
  if (seed !== undefined) {
    let s = seed;
    Math.random = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  const history: number[][][] = [];
  let grid = initializeGrid(COLS, ROWS, COLORS.length);
  history.push(JSON.parse(JSON.stringify(grid)));

  for (let i = 0; i < steps; i++) {
    grid = diffusionStep(grid);
    history.push(JSON.parse(JSON.stringify(grid)));
  }

  return {
    grid,
    colorMap: COLORS,
    steps: history,
  };
}

export function cloneGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

export function countBubbles(grid: number[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell > 0) count++;
    }
  }
  return count;
}

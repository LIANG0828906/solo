export const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A29BFE', '#FD79A8'];
export const COLS = 50;
export const ROWS = 30;
export const COLOR_COUNT = COLORS.length;

export interface LevelResult {
  grid: number[][];
  colorMap: string[];
  steps: number[][][];
}

function createEmptyGrid(rows: number = ROWS, cols: number = COLS): number[][] {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

function cloneGridData(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

function initializeGridWithRegions(
  rows: number,
  cols: number,
  colorCount: number
): number[][] {
  const grid = createEmptyGrid(rows, cols);

  const centerX = cols / 2;
  const centerY = rows / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const numSeeds = colorCount * 3;
  const seeds: Array<{ x: number; y: number; color: number }> = [];
  for (let i = 0; i < numSeeds; i++) {
    seeds.push({
      x: Math.random() * cols,
      y: Math.random() * rows,
      color: (i % colorCount) + 1,
    });
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > 0.35) continue;

      let minDist = Infinity;
      let closestColor = 1;
      for (const seed of seeds) {
        const dx = col - seed.x;
        const dy = row - seed.y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closestColor = seed.color;
        }
      }

      const distRatio = Math.sqrt(
        (col - centerX) ** 2 + (row - centerY) ** 2
      ) / maxDist;
      const colorShift = Math.floor(Math.random() * 2) - 0;
      const shiftedColor =
        ((closestColor - 1 + colorShift + colorCount) % colorCount) + 1;

      grid[row][col] = Math.random() < 0.7 ? shiftedColor : closestColor;
    }
  }

  return grid;
}

function getNeighborOffsets(col: number): Array<[number, number]> {
  const isOddCol = col % 2 === 1;
  if (isOddCol) {
    return [
      [-1, 0], [1, 0],
      [0, -1], [0, 1],
      [1, -1], [1, 1],
    ];
  } else {
    return [
      [-1, 0], [1, 0],
      [0, -1], [0, 1],
      [-1, -1], [-1, 1],
    ];
  }
}

function getHexNeighbors(
  grid: number[][],
  row: number,
  col: number
): Array<{ row: number; col: number; value: number; weight: number }> {
  const rows = grid.length;
  const cols = grid[0].length;
  const neighbors: Array<{
    row: number;
    col: number;
    value: number;
    weight: number;
  }> = [];

  const offsets = getNeighborOffsets(col);
  for (const [dr, dc] of offsets) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push({
        row: nr,
        col: nc,
        value: grid[nr][nc],
        weight: 1.0,
      });
    }
  }

  const extended = [
    [-2, 0], [2, 0],
    [0, -2], [0, 2],
  ];
  for (const [dr, dc] of extended) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push({
        row: nr,
        col: nc,
        value: grid[nr][nc],
        weight: 0.3,
      });
    }
  }

  return neighbors;
}

function computeColorDistribution(
  neighbors: Array<{ value: number; weight: number }>,
  colorCount: number
): Float64Array {
  const dist = new Float64Array(colorCount + 1);

  for (const n of neighbors) {
    if (n.value > 0 && n.value <= colorCount) {
      dist[n.value] += n.weight;
    }
  }

  return dist;
}

function sampleFromDistribution(
  dist: Float64Array,
  temperature: number
): number {
  const totalWeight = dist.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const boltzmann = new Float64Array(dist.length);
  let sumExp = 0;
  for (let i = 1; i < dist.length; i++) {
    boltzmann[i] = Math.exp(dist[i] / Math.max(temperature, 0.01));
    sumExp += boltzmann[i];
  }

  if (sumExp === 0) return 0;

  const probs = new Float64Array(dist.length);
  for (let i = 1; i < dist.length; i++) {
    probs[i] = boltzmann[i] / sumExp;
  }

  let r = Math.random();
  for (let i = 1; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }

  return dist.length - 1;
}

function computeEnergy(
  grid: number[][],
  row: number,
  col: number,
  color: number
): number {
  if (color === 0) return 0;

  const neighbors = getHexNeighbors(grid, row, col);
  let energy = 0;
  for (const n of neighbors) {
    if (n.value === color) {
      energy += 2.0 * n.weight;
    } else if (n.value === 0) {
      energy -= 0.5 * n.weight;
    } else {
      energy -= 1.0 * n.weight;
    }
  }

  const rowRatio = row / grid.length;
  if (rowRatio < 0.3) {
    energy += 1.5;
  }

  return energy;
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

function diffusionStep(
  grid: number[][],
  stepIndex: number,
  totalSteps: number
): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const newGrid = cloneGridData(grid);

  const progress = stepIndex / totalSteps;
  const temperature = Math.max(0.1, 1.0 - progress * 0.9);
  const noiseStrength = Math.max(0.02, 0.15 * (1 - progress));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const currentColor = grid[row][col];
      const neighbors = getHexNeighbors(grid, row, col);
      const colorDist = computeColorDistribution(neighbors, COLOR_COUNT);

      if (currentColor === 0) {
        const totalNeighborWeight = colorDist.reduce((s, v) => s + v, 0);

        if (totalNeighborWeight > 1.5) {
          const fillColor = sampleFromDistribution(colorDist, temperature * 0.8);
          if (fillColor > 0 && Math.random() < 0.55 + progress * 0.3) {
            newGrid[row][col] = fillColor;
          }
        }
      } else {
        const currentEnergy = computeEnergy(newGrid, row, col, currentColor);
        const neighborDist = computeColorDistribution(neighbors, COLOR_COUNT);

        let bestAltColor = currentColor;
        let bestAltEnergy = currentEnergy;

        const totalWeight = neighborDist.reduce((s, v) => s + v, 0);
        if (totalWeight > 0 && Math.random() < 0.4) {
          const sampledColor = sampleFromDistribution(
            neighborDist,
            temperature
          );
          if (sampledColor > 0 && sampledColor !== currentColor) {
            const altEnergy = computeEnergy(
              newGrid,
              row,
              col,
              sampledColor
            );
            if (altEnergy > bestAltEnergy) {
              bestAltColor = sampledColor;
              bestAltEnergy = altEnergy;
            }
          }
        }

        if (bestAltColor !== currentColor) {
          const deltaE = bestAltEnergy - currentEnergy;
          const acceptance = Math.exp(deltaE / Math.max(temperature, 0.01));
          if (Math.random() < acceptance) {
            newGrid[row][col] = bestAltColor;
          }
        }

        if (currentEnergy < -2.0) {
          const removeProb =
            Math.min(0.5, Math.abs(currentEnergy) * 0.1) * (1 - progress);
          if (Math.random() < removeProb) {
            newGrid[row][col] = 0;
          }
        }

        if (Math.random() < noiseStrength) {
          const shift = Math.random() < 0.5 ? -1 : 1;
          const newColor =
            ((currentColor - 1 + shift + COLOR_COUNT) % COLOR_COUNT) + 1;
          const newEnergy = computeEnergy(newGrid, row, col, newColor);
          if (newEnergy >= currentEnergy - 1.0) {
            newGrid[row][col] = newColor;
          }
        }
      }
    }
  }

  applyGravity(newGrid);
  return newGrid;
}

export function generateLevel(
  seed?: number,
  steps: number = 20
): LevelResult {
  if (seed !== undefined) {
    const originalRandom = Math.random;
    let s = seed;
    const seededRandom = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
    Math.random = seededRandom;

    const history: number[][][] = [];
    let grid = initializeGridWithRegions(ROWS, COLS, COLOR_COUNT);
    history.push(cloneGridData(grid));

    for (let i = 0; i < steps; i++) {
      grid = diffusionStep(grid, i, steps);
      history.push(cloneGridData(grid));
    }

    Math.random = originalRandom;

    return {
      grid,
      colorMap: COLORS,
      steps: history,
    };
  }

  const history: number[][][] = [];
  let grid = initializeGridWithRegions(ROWS, COLS, COLOR_COUNT);
  history.push(cloneGridData(grid));

  for (let i = 0; i < steps; i++) {
    grid = diffusionStep(grid, i, steps);
    history.push(cloneGridData(grid));
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

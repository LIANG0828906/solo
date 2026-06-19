import type { GridCell } from '@/types';

export const GRID_SIZE = 20;
export const CELL_SIZE = 5;
export const SCENE_HALF = (GRID_SIZE * CELL_SIZE) / 2;

const PERMEABILITY_BASE = 0.15;
const DANGER_THRESHOLD = 12;
const WARNING_THRESHOLD = 5;

export function generateElevationGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const cx = x - GRID_SIZE / 2;
      const cy = y - GRID_SIZE / 2;
      const distFromCenter = Math.sqrt(cx * cx + cy * cy);
      const baseElevation = Math.max(0, (distFromCenter / (GRID_SIZE / 2)) * 8 - 2);
      const noise = Math.sin(x * 0.6) * Math.cos(y * 0.5) * 1.5 + Math.random() * 0.8;
      const isLowSpot = (x === 7 && y === 8) || (x === 12 && y === 11) || (x === 9 && y === 13);
      row.push({
        x,
        y,
        elevation: Math.max(0, baseElevation + noise - (isLowSpot ? 4 : 0)),
        waterDepth: 0,
        riskLevel: 0,
      });
    }
    grid.push(row);
  }
  return grid;
}

function getNeighbors(grid: GridCell[][], x: number, y: number): Array<{ cell: GridCell; dx: number; dy: number }> {
  const dirs = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 },
  ];
  const result: Array<{ cell: GridCell; dx: number; dy: number }> = [];
  for (const d of dirs) {
    const nx = x + d.dx;
    const ny = y + d.dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      result.push({ cell: grid[ny][nx], dx: d.dx, dy: d.dy });
    }
  }
  return result;
}

export function calculateWaterFlow(
  grid: GridCell[][],
  rainfallIntensity: number,
  intensityMultiplier: number,
  delta: number,
): { grid: GridCell[][]; avgDepth: number; highRiskCount: number } {
  const rainRate = rainfallIntensity * intensityMultiplier * delta * 0.8;
  const tempGrid = grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      waterDepth: cell.waterDepth + rainRate,
    })),
  );

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = tempGrid[y][x];
      const neighbors = getNeighbors(tempGrid, x, y);
      let totalDepth = cell.elevation + cell.waterDepth;

      const lowerNeighbors = neighbors
        .map(({ cell: n, dx, dy }) => ({
          cell: n,
          dx,
          dy,
          neighborSurface: n.elevation + n.waterDepth,
          drop: totalDepth - (n.elevation + n.waterDepth),
        }))
        .filter((n) => n.drop > 0.01)
        .sort((a, b) => b.drop - a.drop);

      if (lowerNeighbors.length > 0 && cell.waterDepth > 0.01) {
        const totalDrop = lowerNeighbors.reduce((s, n) => s + n.drop, 0);
        let transferable = Math.min(cell.waterDepth * 0.35, cell.waterDepth);
        for (const n of lowerNeighbors) {
          if (transferable <= 0) break;
          const share = (n.drop / totalDrop) * transferable;
          const actual = Math.min(share, cell.waterDepth);
          cell.waterDepth -= actual;
          n.cell.waterDepth += actual;
          transferable -= actual;
        }
      }

      const permeability = PERMEABILITY_BASE * (1 + cell.elevation * 0.03);
      cell.waterDepth = Math.max(0, cell.waterDepth - permeability * delta);

      const depth = cell.waterDepth;
      if (depth >= DANGER_THRESHOLD) {
        cell.riskLevel = 2;
      } else if (depth >= WARNING_THRESHOLD) {
        cell.riskLevel = 1;
      } else {
        cell.riskLevel = 0;
      }
    }
  }

  let totalDepth = 0;
  let highRiskCount = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      totalDepth += tempGrid[y][x].waterDepth;
      if (tempGrid[y][x].riskLevel >= 1) highRiskCount++;
    }
  }

  return {
    grid: tempGrid,
    avgDepth: totalDepth / (GRID_SIZE * GRID_SIZE),
    highRiskCount,
  };
}

export function waterDepthToColor(depth: number): { r: number; g: number; b: number; a: number } {
  const maxD = DANGER_THRESHOLD * 1.3;
  const t = Math.min(1, Math.max(0, depth / maxD));
  const low = { r: 0.53, g: 0.81, b: 0.92 };
  const mid = { r: 1.0, g: 0.7, b: 0.3 };
  const high = { r: 0.55, g: 0.0, b: 0.0 };
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const k = t / 0.5;
    r = low.r + (mid.r - low.r) * k;
    g = low.g + (mid.g - low.g) * k;
    b = low.b + (mid.b - low.b) * k;
  } else {
    const k = (t - 0.5) / 0.5;
    r = mid.r + (high.r - mid.r) * k;
    g = mid.g + (high.g - mid.g) * k;
    b = mid.b + (high.b - mid.b) * k;
  }
  const a = 0.2 + t * 0.7;
  return { r, g, b, a };
}

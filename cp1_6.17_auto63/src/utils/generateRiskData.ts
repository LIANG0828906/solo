import type { Asset } from './portfolioEngine';
import { calculatePortfolioReturn, calculatePortfolioVolatility, calculateCorrelationMatrix } from './portfolioEngine';

export interface RiskSurfaceData {
  grid: number[][];
  timeLabels: string[];
  valueRange: [number, number];
  timeSteps: number;
  valueSteps: number;
}

const TIME_STEPS = 100;
const VALUE_STEPS = 100;
const NUM_PATHS = 2000;
const INITIAL_VALUE = 100;
const KERNEL_STD_FACTOR = 0.015;

export function gaussian(x: number, mean: number, std: number): number {
  const exponent = -0.5 * Math.pow((x - mean) / std, 2);
  return Math.exp(exponent) / (std * Math.sqrt(2 * Math.PI));
}

export function generateMonthlyLabels(): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    labels.push(`${year}-${month}`);
  }
  return labels;
}

function generateNormalRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function simulatePath(
  mu: number,
  sigma: number,
  steps: number,
  initial: number
): number[] {
  const path: number[] = new Array(steps + 1);
  path[0] = initial;
  const dt = 1 / steps;
  const drift = (mu - 0.5 * sigma * sigma) * dt;
  const diffusion = sigma * Math.sqrt(dt);

  for (let i = 1; i <= steps; i++) {
    const z = generateNormalRandom();
    path[i] = path[i - 1] * Math.exp(drift + diffusion * z);
  }

  return path;
}

export function generateRiskSurfaceData(assets: Asset[]): RiskSurfaceData {
  const timeLabels = generateMonthlyLabels();

  if (assets.length === 0) {
    const grid: number[][] = [];
    for (let t = 0; t < TIME_STEPS; t++) {
      grid[t] = new Array(VALUE_STEPS).fill(0);
    }
    return {
      grid,
      timeLabels,
      valueRange: [INITIAL_VALUE * 0.8, INITIAL_VALUE * 1.2],
      timeSteps: TIME_STEPS,
      valueSteps: VALUE_STEPS,
    };
  }

  const portfolioReturn = calculatePortfolioReturn(assets);
  const correlationMatrix = calculateCorrelationMatrix(assets);
  const portfolioVolatility = calculatePortfolioVolatility(assets, correlationMatrix);

  const mu = portfolioReturn;
  const sigma = portfolioVolatility;

  const paths: number[][] = [];
  for (let i = 0; i < NUM_PATHS; i++) {
    paths.push(simulatePath(mu, sigma, TIME_STEPS, INITIAL_VALUE));
  }

  let minValue = Infinity;
  let maxValue = -Infinity;
  for (const path of paths) {
    for (const value of path) {
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    }
  }

  const padding = (maxValue - minValue) * 0.05;
  const valueMin = minValue - padding;
  const valueMax = maxValue + padding;
  const valueRange: [number, number] = [valueMin, valueMax];

  const valueBinSize = (valueMax - valueMin) / VALUE_STEPS;
  const kernelStd = valueBinSize * KERNEL_STD_FACTOR * VALUE_STEPS;

  const grid: number[][] = [];

  for (let t = 0; t < TIME_STEPS; t++) {
    const pathIndex = Math.floor((t / (TIME_STEPS - 1)) * TIME_STEPS);
    const valuesAtTime: number[] = [];
    for (const path of paths) {
      valuesAtTime.push(path[pathIndex]);
    }

    const densityRow: number[] = new Array(VALUE_STEPS).fill(0);

    for (let v = 0; v < VALUE_STEPS; v++) {
      const binCenter = valueMin + (v + 0.5) * valueBinSize;
      let density = 0;
      for (const value of valuesAtTime) {
        density += gaussian(binCenter, value, kernelStd);
      }
      densityRow[v] = density / NUM_PATHS;
    }

    const rowSum = densityRow.reduce((sum, d) => sum + d, 0);
    if (rowSum > 0) {
      for (let v = 0; v < VALUE_STEPS; v++) {
        densityRow[v] /= rowSum;
      }
    }

    grid.push(densityRow);
  }

  let maxDensity = 0;
  for (const row of grid) {
    for (const d of row) {
      if (d > maxDensity) maxDensity = d;
    }
  }
  if (maxDensity > 0) {
    for (let t = 0; t < grid.length; t++) {
      for (let v = 0; v < VALUE_STEPS; v++) {
        grid[t][v] /= maxDensity;
      }
    }
  }

  return {
    grid,
    timeLabels,
    valueRange,
    timeSteps: TIME_STEPS,
    valueSteps: VALUE_STEPS,
  };
}

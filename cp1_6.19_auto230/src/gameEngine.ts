import { v4 as uuidv4 } from 'uuid';
import {
  Cell,
  GameState,
  MicrobeType,
  GRID_SIZE,
  BASE_NUTRIENT_CONSUMPTION,
  INITIAL_NUTRIENT,
  INITIAL_PH,
  PH_MIN,
  PH_MAX,
  PH_HEALTHY_MIN,
  PH_HEALTHY_MAX,
  MAX_MICROBES_PER_CELL,
  VICTORY_THRESHOLD,
  VICTORY_INCREMENT,
  INITIAL_ENERGY,
  ENERGY_PER_MICROBE,
  SKILL_COOLDOWN,
  POLLUTION_SPREAD_CHANCE,
  REPRODUCTION_THRESHOLD,
  MICROBE_CONFIGS,
} from './types';

export function createInitialGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        id: uuidv4(),
        x,
        y,
        nutrient: INITIAL_NUTRIENT,
        ph: INITIAL_PH,
        isDesert: false,
        microbes: {
          cyanobacteria: 0,
          mold: 0,
          ciliate: 0,
        },
      });
    }
    grid.push(row);
  }
  return grid;
}

export function createInitialState(): GameState {
  return {
    grid: createInitialGrid(),
    turn: 0,
    score: 0,
    victoryProgress: 0,
    isVictory: false,
    isGameOver: false,
    energy: INITIAL_ENERGY,
    inventory: {
      cyanobacteria: 3,
      mold: 3,
      ciliate: 3,
    },
    skillCooldown: 0,
  };
}

function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      microbes: { ...cell.microbes },
    }))
  );
}

function getNeighbors(grid: Cell[][], x: number, y: number): Cell[] {
  const neighbors: Cell[] = [];
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      neighbors.push(grid[ny][nx]);
    }
  }
  return neighbors;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeNutrientChange(cell: Cell): number {
  let change = -BASE_NUTRIENT_CONSUMPTION;
  const types: MicrobeType[] = ['cyanobacteria', 'mold', 'ciliate'];
  for (const type of types) {
    const count = cell.microbes[type];
    const config = MICROBE_CONFIGS[type];
    change += count * (config.nutrientProduction - config.nutrientConsumption);
  }
  return change;
}

function computePhChange(cell: Cell): number {
  let change = 0;
  const cyanobacteria = cell.microbes.cyanobacteria;
  const mold = cell.microbes.mold;
  const ciliate = cell.microbes.ciliate;

  change -= cyanobacteria * 0.02;
  change += mold * 0.015;
  change += ciliate * 0.025;

  return change;
}

function isCellHealthy(cell: Cell): boolean {
  if (cell.isDesert) return false;
  if (cell.nutrient <= 0) return false;
  if (cell.ph < PH_HEALTHY_MIN || cell.ph > PH_HEALTHY_MAX) return false;
  return true;
}

function areAllCellsHealthy(grid: Cell[][]): boolean {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!isCellHealthy(grid[y][x])) {
        return false;
      }
    }
  }
  return true;
}

function countTotalMicrobes(grid: Cell[][]): number {
  let count = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = grid[y][x];
      if (!cell.isDesert) {
        count += cell.microbes.cyanobacteria + cell.microbes.mold + cell.microbes.ciliate;
      }
    }
  }
  return count;
}

export function simulateTurn(state: GameState): GameState {
  const newGrid = cloneGrid(state.grid);
  let newEnergy = state.energy;
  let newSkillCooldown = Math.max(0, state.skillCooldown - 1);
  let newScore = state.score;
  let newVictoryProgress = state.victoryProgress;
  let newIsVictory = state.isVictory;
  let newIsGameOver = state.isGameOver;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = newGrid[y][x];
      if (cell.isDesert) continue;

      const nutrientChange = computeNutrientChange(cell);
      cell.nutrient = clamp(cell.nutrient + nutrientChange, 0, 100);

      const phChange = computePhChange(cell);
      cell.ph = clamp(cell.ph + phChange, PH_MIN, PH_MAX);

      if (cell.nutrient <= 0 || cell.ph <= PH_MIN || cell.ph >= PH_MAX) {
        cell.isDesert = true;
        cell.nutrient = 0;
        cell.microbes = { cyanobacteria: 0, mold: 0, ciliate: 0 };
      }
    }
  }

  const reproductionMoves: { fromX: number; fromY: number; toX: number; toY: number; type: MicrobeType }[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = newGrid[y][x];
      if (cell.isDesert) continue;

      const types: MicrobeType[] = ['cyanobacteria', 'mold', 'ciliate'];
      for (const type of types) {
        if (cell.microbes[type] > REPRODUCTION_THRESHOLD) {
          const config = MICROBE_CONFIGS[type];
          if (Math.random() < config.reproductionRate) {
            const neighbors = getNeighbors(newGrid, x, y).filter(
              (n) => !n.isDesert && n.microbes[type] < MAX_MICROBES_PER_CELL
            );
            if (neighbors.length > 0) {
              const target = neighbors[Math.floor(Math.random() * neighbors.length)];
              reproductionMoves.push({
                fromX: x,
                fromY: y,
                toX: target.x,
                toY: target.y,
                type,
              });
            }
          }
        }
      }
    }
  }

  for (const move of reproductionMoves) {
    const fromCell = newGrid[move.fromY][move.fromX];
    const toCell = newGrid[move.toY][move.toX];
    if (fromCell.microbes[move.type] > 1 && toCell.microbes[move.type] < MAX_MICROBES_PER_CELL) {
      fromCell.microbes[move.type]--;
      toCell.microbes[move.type]++;
    }
  }

  const desertCells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (newGrid[y][x].isDesert) {
        desertCells.push({ x, y });
      }
    }
  }

  for (const desert of desertCells) {
    const neighbors = getNeighbors(newGrid, desert.x, desert.y).filter((n) => !n.isDesert);
    for (const neighbor of neighbors) {
      if (Math.random() < POLLUTION_SPREAD_CHANCE) {
        const targetCell = newGrid[neighbor.y][neighbor.x];
        targetCell.isDesert = true;
        targetCell.nutrient = 0;
        targetCell.microbes = { cyanobacteria: 0, mold: 0, ciliate: 0 };
      }
    }
  }

  const totalMicrobes = countTotalMicrobes(newGrid);
  newEnergy += totalMicrobes * ENERGY_PER_MICROBE;

  const allHealthy = areAllCellsHealthy(newGrid);
  if (allHealthy) {
    newVictoryProgress = Math.min(VICTORY_THRESHOLD, newVictoryProgress + VICTORY_INCREMENT);
    newScore += 10;
    if (newVictoryProgress >= VICTORY_THRESHOLD) {
      newIsVictory = true;
    }
  } else {
    newVictoryProgress = 0;
  }

  const desertCount = desertCells.length;
  if (desertCount >= GRID_SIZE * GRID_SIZE * 0.8) {
    newIsGameOver = true;
  }

  return {
    ...state,
    grid: newGrid,
    turn: state.turn + 1,
    score: newScore,
    victoryProgress: newVictoryProgress,
    isVictory: newIsVictory,
    isGameOver: newIsGameOver,
    energy: newEnergy,
    skillCooldown: newSkillCooldown,
  };
}

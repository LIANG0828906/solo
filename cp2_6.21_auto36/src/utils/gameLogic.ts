export type CrystalType = 'fire' | 'ice' | 'thunder' | 'nature' | 'shadow' | 'holy';

export interface CrystalConfig {
  type: CrystalType;
  name: string;
  color: string;
  glowColor: string;
}

export const CRYSTAL_CONFIGS: Record<CrystalType, CrystalConfig> = {
  fire: { type: 'fire', name: '火红', color: '#ff4500', glowColor: '#ff6347' },
  ice: { type: 'ice', name: '冰蓝', color: '#00bfff', glowColor: '#87ceeb' },
  thunder: { type: 'thunder', name: '雷电紫', color: '#8a2be2', glowColor: '#9370db' },
  nature: { type: 'nature', name: '自然绿', color: '#32cd32', glowColor: '#90ee90' },
  shadow: { type: 'shadow', name: '暗影黑', color: '#2f2f2f', glowColor: '#696969' },
  holy: { type: 'holy', name: '圣光金', color: '#ffd700', glowColor: '#ffed4a' },
};

export const CRYSTAL_TYPES: CrystalType[] = ['fire', 'ice', 'thunder', 'nature', 'shadow', 'holy'];

export const GRID_SIZE = 3;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const MAX_ENERGY = 100;
export const ENERGY_GAIN = 10;
export const ENERGY_LOSS = 5;
export const MAX_HINTS = 3;

const BASE_SOLUTION: CrystalType[] = [
  'fire', 'ice', 'thunder',
  'nature', 'shadow', 'fire',
  'ice', 'thunder', 'nature',
];

function isSolutionValid(solution: CrystalType[]): boolean {
  const emptyGrid = createEmptyGrid();
  for (let i = 0; i < solution.length; i++) {
    if (!validatePlacement(emptyGrid, i, solution[i])) {
      return false;
    }
    emptyGrid[i] = solution[i];
  }
  return true;
}

function generateValidSolution(): CrystalType[] {
  const shuffledTypes = shuffleArray([...CRYSTAL_TYPES]);
  const typeMapping = new Map<CrystalType, CrystalType>();
  
  const usedTypes = new Set(BASE_SOLUTION);
  const baseUniqueTypes = Array.from(usedTypes);
  
  baseUniqueTypes.forEach((type, i) => {
    typeMapping.set(type, shuffledTypes[i]);
  });
  
  const remainingTypes = shuffledTypes.slice(baseUniqueTypes.length);
  const unmappedTypes = CRYSTAL_TYPES.filter(t => !usedTypes.has(t));
  unmappedTypes.forEach((type, i) => {
    typeMapping.set(type, remainingTypes[i] || shuffledTypes[0]);
  });
  
  const solution = BASE_SOLUTION.map(type => typeMapping.get(type) || type);
  
  if (isSolutionValid(solution)) {
    return solution;
  }
  
  return [...BASE_SOLUTION];
}

export function generateCrystalPool(): CrystalType[] {
  const solution = generateValidSolution();
  const pool: CrystalType[] = [];

  for (const type of solution) {
    pool.push(type);
  }

  return shuffleArray(pool);
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getRowIndices(cellIndex: number): number[] {
  const row = Math.floor(cellIndex / GRID_SIZE);
  return [row * GRID_SIZE, row * GRID_SIZE + 1, row * GRID_SIZE + 2];
}

export function getColIndices(cellIndex: number): number[] {
  const col = cellIndex % GRID_SIZE;
  return [col, col + GRID_SIZE, col + 2 * GRID_SIZE];
}

export function getMainDiagonalIndices(): number[] {
  return [0, 4, 8];
}

export function getAntiDiagonalIndices(): number[] {
  return [2, 4, 6];
}

export function isOnMainDiagonal(cellIndex: number): boolean {
  return cellIndex % 4 === 0;
}

export function isOnAntiDiagonal(cellIndex: number): boolean {
  return cellIndex === 2 || cellIndex === 4 || cellIndex === 6;
}

export function hasDuplicates(crystals: (CrystalType | null)[]): boolean {
  const nonNull = crystals.filter((c): c is CrystalType => c !== null);
  const unique = new Set(nonNull);
  return unique.size !== nonNull.length;
}

export function validatePlacement(
  grid: (CrystalType | null)[],
  cellIndex: number,
  crystalType: CrystalType
): boolean {
  const newGrid = [...grid];
  newGrid[cellIndex] = crystalType;

  const rowIndices = getRowIndices(cellIndex);
  const rowCrystals = rowIndices.map((i) => newGrid[i]);
  if (hasDuplicates(rowCrystals)) return false;

  const colIndices = getColIndices(cellIndex);
  const colCrystals = colIndices.map((i) => newGrid[i]);
  if (hasDuplicates(colCrystals)) return false;

  if (isOnMainDiagonal(cellIndex)) {
    const diagIndices = getMainDiagonalIndices();
    const diagCrystals = diagIndices.map((i) => newGrid[i]);
    if (hasDuplicates(diagCrystals)) return false;
  }

  if (isOnAntiDiagonal(cellIndex)) {
    const diagIndices = getAntiDiagonalIndices();
    const diagCrystals = diagIndices.map((i) => newGrid[i]);
    if (hasDuplicates(diagCrystals)) return false;
  }

  return true;
}

export interface HintResult {
  cellIndex: number;
  crystalType: CrystalType;
}

export function findHint(
  grid: (CrystalType | null)[],
  crystalPool: CrystalType[]
): HintResult | null {
  const emptyCells: number[] = [];
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === null) {
      emptyCells.push(i);
    }
  }

  const availableTypes = Array.from(new Set(crystalPool));

  for (const cellIndex of emptyCells) {
    for (const crystalType of availableTypes) {
      if (validatePlacement(grid, cellIndex, crystalType)) {
        return { cellIndex, crystalType };
      }
    }
  }

  return null;
}

export function createEmptyGrid(): (CrystalType | null)[] {
  return Array(CELL_COUNT).fill(null);
}

export function checkWinCondition(energy: number): boolean {
  return energy >= MAX_ENERGY;
}

import type { Recipe } from '@/data/recipes';

export type GridCell = string | null;

export function rotatePattern(pattern: number[][]): number[][] {
  const size = pattern.length;
  const rotated: number[][] = [];
  for (let i = 0; i < size; i++) {
    rotated.push([]);
    for (let j = 0; j < size; j++) {
      rotated[i].push(pattern[size - 1 - j][i]);
    }
  }
  return rotated;
}

export function mirrorPattern(pattern: number[][]): number[][] {
  return pattern.map(row => [...row].reverse());
}

export function getAllPatternVariants(pattern: number[][]): number[][][] {
  const variants: number[][][] = [];
  let current = pattern;
  
  for (let i = 0; i < 4; i++) {
    variants.push(current);
    const mirrored = mirrorPattern(current);
    variants.push(mirrored);
    current = rotatePattern(current);
  }
  
  const unique: number[][][] = [];
  const seen = new Set<string>();
  
  for (const variant of variants) {
    const key = variant.map(row => row.join('')).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(variant);
    }
  }
  
  return unique;
}

export function getPatternBounds(pattern: number[][]): { minRow: number; maxRow: number; minCol: number; maxCol: number } {
  let minRow = pattern.length;
  let maxRow = -1;
  let minCol = pattern[0].length;
  let maxCol = -1;
  
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      if (pattern[r][c] === 1) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }
  
  return { minRow, maxRow, minCol, maxCol };
}

export function cropPattern(pattern: number[][]): number[][] {
  const { minRow, maxRow, minCol, maxCol } = getPatternBounds(pattern);
  
  if (maxRow < 0) return [];
  
  const cropped: number[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    const row: number[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      row.push(pattern[r][c]);
    }
    cropped.push(row);
  }
  
  return cropped;
}

export function findPatternPosition(grid: GridCell[][], pattern: number[][]): { row: number; col: number } | null {
  const { minRow, maxRow, minCol, maxCol } = getPatternBounds(pattern);
  const patternHeight = maxRow - minRow + 1;
  const patternWidth = maxCol - minCol + 1;
  
  for (let startRow = 0; startRow <= grid.length - patternHeight; startRow++) {
    for (let startCol = 0; startCol <= grid[0].length - patternWidth; startCol++) {
      let matches = true;
      
      for (let r = 0; r < patternHeight; r++) {
        for (let c = 0; c < patternWidth; c++) {
          const patternCell = pattern[minRow + r][minCol + c];
          const gridCell = grid[startRow + r][startCol + c];
          
          if (patternCell === 1 && gridCell === null) {
            matches = false;
            break;
          }
          if (patternCell === 0 && gridCell !== null) {
            matches = false;
            break;
          }
        }
        if (!matches) break;
      }
      
      if (matches) {
        return { row: startRow, col: startCol };
      }
    }
  }
  
  return null;
}

export function countFilledCells(grid: GridCell[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) count++;
    }
  }
  return count;
}

export function getUniqueItemsInGrid(grid: GridCell[][]): string[] {
  const items = new Set<string>();
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== null) {
        items.add(cell);
      }
    }
  }
  return Array.from(items);
}

export function countItemInGrid(grid: GridCell[][], itemId: string): number {
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === itemId) count++;
    }
  }
  return count;
}

export function hasAllResources(grid: GridCell[][], requiredResources: { itemId: string; count: number }[]): boolean {
  for (const req of requiredResources) {
    const count = countItemInGrid(grid, req.itemId);
    if (count < req.count) return false;
  }
  return true;
}

export function checkRecipeMatch(grid: GridCell[][], recipe: Recipe): boolean {
  const filledCells = countFilledCells(grid);
  const requiredCells = recipe.pattern.flat().filter(c => c === 1).length;
  
  if (filledCells !== requiredCells) return false;
  
  if (!hasAllResources(grid, recipe.requiredResources)) return false;
  
  const variants = getAllPatternVariants(recipe.pattern);
  
  for (const variant of variants) {
    const position = findPatternPosition(grid, variant);
    if (position !== null) {
      return true;
    }
  }
  
  return false;
}

export function findMatchingRecipe(grid: GridCell[][], recipes: Recipe[]): Recipe | null {
  const filledCells = countFilledCells(grid);
  
  if (filledCells === 0) return null;
  
  for (const recipe of recipes) {
    if (checkRecipeMatch(grid, recipe)) {
      return recipe;
    }
  }
  
  return null;
}

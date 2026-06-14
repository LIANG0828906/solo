import { describe, it, expect } from 'vitest';
import {
  createEmptyGrid,
  addRandomAnimal,
  isAdjacent,
  canMerge,
  mergeCells,
  getMaxLevel,
  isGridFull,
  hasPossibleMerge,
  GRID_SIZE,
  MAX_LEVEL,
  getRandomEmptyCell,
  checkAreaUnlock,
  createInitialAreas,
  addDecoration,
  getDecorationCost,
  MAX_DECORATIONS,
} from '../utils';
import type { Grid, TownArea } from '../utils';

describe('createEmptyGrid', () => {
  it('should create a 4x4 grid filled with null', () => {
    const grid = createEmptyGrid();
    expect(grid.length).toBe(GRID_SIZE);
    grid.forEach(row => {
      expect(row.length).toBe(GRID_SIZE);
      row.forEach(cell => {
        expect(cell).toBeNull();
      });
    });
  });
});

describe('getRandomEmptyCell', () => {
  it('should return null when grid is full', () => {
    const grid: Grid = createEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = { id: 'test', level: 1, row: r, col: c };
      }
    }
    expect(getRandomEmptyCell(grid)).toBeNull();
  });

  it('should return a valid empty cell position', () => {
    const grid = createEmptyGrid();
    const result = getRandomEmptyCell(grid);
    expect(result).not.toBeNull();
    expect(result!.row).toBeGreaterThanOrEqual(0);
    expect(result!.row).toBeLessThan(GRID_SIZE);
    expect(result!.col).toBeGreaterThanOrEqual(0);
    expect(result!.col).toBeLessThan(GRID_SIZE);
  });
});

describe('addRandomAnimal', () => {
  it('should add an animal to an empty cell', () => {
    const grid = createEmptyGrid();
    const newGrid = addRandomAnimal(grid, 2);
    let animalCount = 0;
    newGrid.forEach(row => {
      row.forEach(cell => {
        if (cell) {
          animalCount++;
          expect(cell.level).toBe(2);
        }
      });
    });
    expect(animalCount).toBe(1);
  });

  it('should return original grid when full', () => {
    let grid: Grid = createEmptyGrid();
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      grid = addRandomAnimal(grid);
    }
    const fullGrid = grid.map(row => [...row]);
    const result = addRandomAnimal(fullGrid);
    expect(result).toEqual(fullGrid);
  });
});

describe('isAdjacent', () => {
  it('should return true for horizontally adjacent cells', () => {
    expect(isAdjacent(0, 0, 0, 1)).toBe(true);
    expect(isAdjacent(2, 3, 2, 2)).toBe(true);
  });

  it('should return true for vertically adjacent cells', () => {
    expect(isAdjacent(0, 0, 1, 0)).toBe(true);
    expect(isAdjacent(3, 2, 2, 2)).toBe(true);
  });

  it('should return false for diagonal cells', () => {
    expect(isAdjacent(0, 0, 1, 1)).toBe(false);
    expect(isAdjacent(2, 2, 3, 3)).toBe(false);
  });

  it('should return false for non-adjacent cells', () => {
    expect(isAdjacent(0, 0, 0, 2)).toBe(false);
    expect(isAdjacent(0, 0, 3, 0)).toBe(false);
  });

  it('should return false for same cell', () => {
    expect(isAdjacent(1, 1, 1, 1)).toBe(false);
  });
});

describe('canMerge', () => {
  it('should return false if either cell is empty', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    expect(canMerge(grid, 0, 0, 0, 1)).toBe(false);
    expect(canMerge(grid, 0, 1, 0, 0)).toBe(false);
  });

  it('should return false if levels are different', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 2, row: 0, col: 1 };
    expect(canMerge(grid, 0, 0, 0, 1)).toBe(false);
  });

  it('should return false if not adjacent', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][2] = { id: '2', level: 1, row: 0, col: 2 };
    expect(canMerge(grid, 0, 0, 0, 2)).toBe(false);
  });

  it('should return false if level is at max', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: MAX_LEVEL, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: MAX_LEVEL, row: 0, col: 1 };
    expect(canMerge(grid, 0, 0, 0, 1)).toBe(false);
  });

  it('should return true for valid merge', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 1, row: 0, col: 1 };
    expect(canMerge(grid, 0, 0, 0, 1)).toBe(true);
  });
});

describe('mergeCells', () => {
  it('should merge two adjacent same-level cells', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 1, row: 0, col: 1 };
    
    const result = mergeCells(grid, 0, 0, 0, 1);
    expect(result.success).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(result.targetRow).toBe(0);
    expect(result.targetCol).toBe(1);
    expect(result.grid[0][0]).toBeNull();
    expect(result.grid[0][1]?.level).toBe(2);
  });

  it('should not merge when conditions fail', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 2, row: 0, col: 1 };
    
    const result = mergeCells(grid, 0, 0, 0, 1);
    expect(result.success).toBe(false);
    expect(result.grid[0][0]?.level).toBe(1);
    expect(result.grid[0][1]?.level).toBe(2);
  });

  it('should clear both source cells after merge', () => {
    const grid = createEmptyGrid();
    grid[1][1] = { id: '1', level: 3, row: 1, col: 1 };
    grid[1][2] = { id: '2', level: 3, row: 1, col: 2 };
    
    const result = mergeCells(grid, 1, 1, 1, 2);
    expect(result.grid[1][1]).toBeNull();
    expect(result.grid[1][2]).not.toBeNull();
    expect(result.grid[1][2]?.level).toBe(4);
  });

  it('should handle grid full after merge but no residue', () => {
    let grid: Grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 1, row: 0, col: 1 };
    grid[0][2] = { id: '3', level: 2, row: 0, col: 2 };
    grid[0][3] = { id: '4', level: 2, row: 0, col: 3 };
    grid[1][0] = { id: '5', level: 3, row: 1, col: 0 };
    grid[1][1] = { id: '6', level: 3, row: 1, col: 1 };
    grid[1][2] = { id: '7', level: 4, row: 1, col: 2 };
    grid[1][3] = { id: '8', level: 4, row: 1, col: 3 };
    grid[2][0] = { id: '9', level: 5, row: 2, col: 0 };
    grid[2][1] = { id: '10', level: 5, row: 2, col: 1 };
    grid[2][2] = { id: '11', level: 6, row: 2, col: 2 };
    grid[2][3] = { id: '12', level: 6, row: 2, col: 3 };
    grid[3][0] = { id: '13', level: 7, row: 3, col: 0 };
    grid[3][1] = { id: '14', level: 7, row: 3, col: 1 };
    grid[3][2] = { id: '15', level: 8, row: 3, col: 2 };
    grid[3][3] = { id: '16', level: 8, row: 3, col: 3 };

    expect(isGridFull(grid)).toBe(true);
    
    const result = mergeCells(grid, 0, 0, 0, 1);
    expect(result.success).toBe(true);
    expect(result.grid[0][0]).toBeNull();
    expect(result.grid[0][1]?.level).toBe(2);
    
    let cellCount = 0;
    result.grid.forEach(row => {
      row.forEach(cell => {
        if (cell) cellCount++;
      });
    });
    expect(cellCount).toBe(15);
  });

  it('should not allow level jumping beyond +1', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 2, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 2, row: 0, col: 1 };
    
    const result = mergeCells(grid, 0, 0, 0, 1);
    expect(result.newLevel).toBe(3);
    expect(result.newLevel).not.toBeGreaterThan(3);
  });

  it('should create new cell with unique id', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: 'old1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: 'old2', level: 1, row: 0, col: 1 };
    
    const result = mergeCells(grid, 0, 0, 0, 1);
    expect(result.grid[0][1]?.id).not.toBe('old1');
    expect(result.grid[0][1]?.id).not.toBe('old2');
  });
});

describe('getMaxLevel', () => {
  it('should return 0 for empty grid', () => {
    const grid = createEmptyGrid();
    expect(getMaxLevel(grid)).toBe(0);
  });

  it('should return the highest level', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 3, row: 0, col: 0 };
    grid[1][1] = { id: '2', level: 7, row: 1, col: 1 };
    grid[2][2] = { id: '3', level: 5, row: 2, col: 2 };
    expect(getMaxLevel(grid)).toBe(7);
  });
});

describe('isGridFull', () => {
  it('should return false for empty grid', () => {
    expect(isGridFull(createEmptyGrid())).toBe(false);
  });

  it('should return true when all cells filled', () => {
    const grid: Grid = createEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = { id: 'test', level: 1, row: r, col: c };
      }
    }
    expect(isGridFull(grid)).toBe(true);
  });
});

describe('hasPossibleMerge', () => {
  it('should return false for empty grid', () => {
    expect(hasPossibleMerge(createEmptyGrid())).toBe(false);
  });

  it('should return true when adjacent same levels exist', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 2, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 2, row: 0, col: 1 };
    expect(hasPossibleMerge(grid)).toBe(true);
  });

  it('should return false when no possible merges', () => {
    const grid = createEmptyGrid();
    grid[0][0] = { id: '1', level: 1, row: 0, col: 0 };
    grid[0][1] = { id: '2', level: 2, row: 0, col: 1 };
    grid[0][2] = { id: '3', level: 3, row: 0, col: 2 };
    grid[0][3] = { id: '4', level: 4, row: 0, col: 3 };
    grid[1][0] = { id: '5', level: 5, row: 1, col: 0 };
    grid[1][1] = { id: '6', level: 6, row: 1, col: 1 };
    grid[1][2] = { id: '7', level: 7, row: 1, col: 2 };
    grid[1][3] = { id: '8', level: 8, row: 1, col: 3 };
    grid[2][0] = { id: '9', level: 1, row: 2, col: 0 };
    grid[2][1] = { id: '10', level: 2, row: 2, col: 1 };
    grid[2][2] = { id: '11', level: 3, row: 2, col: 2 };
    grid[2][3] = { id: '12', level: 4, row: 2, col: 3 };
    grid[3][0] = { id: '13', level: 5, row: 3, col: 0 };
    grid[3][1] = { id: '14', level: 6, row: 3, col: 1 };
    grid[3][2] = { id: '15', level: 7, row: 3, col: 2 };
    grid[3][3] = { id: '16', level: 8, row: 3, col: 3 };
    expect(hasPossibleMerge(grid)).toBe(false);
  });

  it('should return false when all cells are max level', () => {
    const grid = createEmptyGrid();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = { id: `test-${r}-${c}`, level: MAX_LEVEL, row: r, col: c };
      }
    }
    expect(hasPossibleMerge(grid)).toBe(false);
  });
});

describe('checkAreaUnlock', () => {
  it('should unlock area when reaching required level', () => {
    const areas = createInitialAreas();
    const result = checkAreaUnlock(areas, 3);
    const lake = result.areas.find(a => a.id === 'lake');
    expect(lake?.unlocked).toBe(true);
    expect(result.unlocked?.id).toBe('lake');
  });

  it('should not unlock area below required level', () => {
    const areas = createInitialAreas();
    const result = checkAreaUnlock(areas, 2);
    const lake = result.areas.find(a => a.id === 'lake');
    expect(lake?.unlocked).toBe(false);
    expect(result.unlocked).toBeNull();
  });

  it('should unlock multiple areas at once', () => {
    const areas = createInitialAreas();
    const result = checkAreaUnlock(areas, 10);
    const unlockedAreas = result.areas.filter(a => a.unlocked);
    expect(unlockedAreas.length).toBe(5);
  });
});

describe('addDecoration', () => {
  it('should add decoration to unlocked area', () => {
    let areas = createInitialAreas();
    areas = areas.map(a => a.id === 'lake' ? { ...a, unlocked: true } : a);
    
    const result = addDecoration(areas, 'lake', '🌳');
    expect(result.success).toBe(true);
    expect(result.cost).toBe(getDecorationCost(0));
    
    const lake = result.areas.find(a => a.id === 'lake');
    expect(lake?.decorations).toContain('🌳');
    expect(lake?.decorations.length).toBe(1);
  });

  it('should not add decoration to locked area', () => {
    const areas = createInitialAreas();
    const result = addDecoration(areas, 'lake', '🌳');
    expect(result.success).toBe(false);
    expect(result.cost).toBe(0);
  });

  it('should not exceed max decorations', () => {
    let areas = createInitialAreas();
    const manyDecorations = new Array(MAX_DECORATIONS).fill('🌳');
    areas = areas.map(a => a.id === 'forest' ? { ...a, decorations: manyDecorations } : a);
    
    const result = addDecoration(areas, 'forest', '🌸');
    expect(result.success).toBe(false);
    
    const forest = result.areas.find(a => a.id === 'forest');
    expect(forest?.decorations.length).toBe(MAX_DECORATIONS);
  });

  it('should increase cost with each decoration', () => {
    let areas = createInitialAreas();
    areas = areas.map(a => a.id === 'forest' ? { ...a, decorations: ['🌳', '🌸'] } : a);
    
    const result = addDecoration(areas, 'forest', '🏠');
    expect(result.cost).toBe(getDecorationCost(2));
    expect(result.cost).toBeGreaterThan(getDecorationCost(0));
  });
});

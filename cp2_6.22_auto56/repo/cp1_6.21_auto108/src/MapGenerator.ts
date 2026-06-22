import type { GridCell, Position, Wind, TerrainType } from './types/game';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  SAND_PERCENTAGE,
  DUNE_PERCENTAGE,
  MIN_WIND_STRENGTH,
  MAX_WIND_STRENGTH,
} from './utils/constants';

export function generateMap(): GridCell[][] {
  const map: GridCell[][] = [];

  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      let terrain: TerrainType;

      if (x === 0 || x === GRID_WIDTH - 1) {
        terrain = 'sand';
      } else {
        const random = Math.random();
        if (random < SAND_PERCENTAGE) {
          terrain = 'sand';
        } else if (random < SAND_PERCENTAGE + DUNE_PERCENTAGE) {
          terrain = 'dune';
        } else {
          terrain = 'ore';
        }
      }

      row.push({
        terrain,
        gridX: x,
        gridY: y,
      });
    }
    map.push(row);
  }

  return map;
}

export function getRandomSandPosition(
  map: GridCell[][],
  side: 'left' | 'right'
): Position {
  const column = side === 'left' ? 0 : GRID_WIDTH - 1;
  const sandCells: GridCell[] = [];

  for (let y = 0; y < GRID_HEIGHT; y++) {
    const cell = map[y][column];
    if (cell.terrain === 'sand') {
      sandCells.push(cell);
    }
  }

  const randomIndex = Math.floor(Math.random() * sandCells.length);
  const selectedCell = sandCells[randomIndex];

  return {
    x: selectedCell.gridX * CELL_SIZE + CELL_SIZE / 2,
    y: selectedCell.gridY * CELL_SIZE + CELL_SIZE / 2,
  };
}

export function generateWind(): Wind {
  const angle = Math.random() * 360;
  const strength =
    Math.floor(Math.random() * (MAX_WIND_STRENGTH - MIN_WIND_STRENGTH + 1)) +
    MIN_WIND_STRENGTH;

  return {
    angle,
    strength,
  };
}

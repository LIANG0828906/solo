import { v4 as uuidv4 } from 'uuid';
import { TerrainType, TerrainCell, MapData, Position } from '../types';

export const CELL_SIZE = 32;
export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 32;

const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.OPEN]: '#1E2A3E',
  [TerrainType.TREE]: '#2D5A3D',
  [TerrainType.HIGHLAND]: '#8B5E3C',
  [TerrainType.RUIN]: '#4A4A5A',
};

const TERRAIN_BLOCK_RATES: Record<TerrainType, number> = {
  [TerrainType.OPEN]: 0,
  [TerrainType.TREE]: 0.2,
  [TerrainType.HIGHLAND]: 0.5,
  [TerrainType.RUIN]: 0.3,
};

export function getTerrainColor(type: TerrainType): string {
  return TERRAIN_COLORS[type];
}

function createTerrainCell(type: TerrainType): TerrainCell {
  let height = 0;
  if (type === TerrainType.HIGHLAND) {
    height = 8 + Math.random() * 12;
  } else if (type === TerrainType.TREE) {
    height = 4 + Math.random() * 4;
  } else if (type === TerrainType.RUIN) {
    height = 3 + Math.random() * 5;
  }
  return {
    type,
    height,
    blockRate: TERRAIN_BLOCK_RATES[type],
  };
}

function getRandomOpenCell(grid: TerrainCell[][]): Position {
  let attempts = 0;
  while (attempts < 1000) {
    const x = Math.floor(Math.random() * MAP_WIDTH);
    const y = Math.floor(Math.random() * MAP_HEIGHT);
    if (grid[y][x].type === TerrainType.OPEN) {
      return { x, y };
    }
    attempts++;
  }
  return { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
}

function generateExtractionPoint(grid: TerrainCell[][]): Position {
  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;

  switch (edge) {
    case 0:
      x = Math.floor(Math.random() * MAP_WIDTH);
      y = 0;
      break;
    case 1:
      x = MAP_WIDTH - 1;
      y = Math.floor(Math.random() * MAP_HEIGHT);
      break;
    case 2:
      x = Math.floor(Math.random() * MAP_WIDTH);
      y = MAP_HEIGHT - 1;
      break;
    default:
      x = 0;
      y = Math.floor(Math.random() * MAP_HEIGHT);
  }

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        grid[ny][nx] = createTerrainCell(TerrainType.OPEN);
      }
    }
  }

  return {
    x: x * CELL_SIZE + CELL_SIZE / 2,
    y: y * CELL_SIZE + CELL_SIZE / 2,
  };
}

export function generateMap(): MapData {
  const grid: TerrainCell[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      grid[y][x] = createTerrainCell(TerrainType.OPEN);
    }
  }

  const totalCells = MAP_WIDTH * MAP_HEIGHT;
  const treeCount = Math.floor(totalCells * 0.2);
  const highlandCount = Math.floor(totalCells * 0.08);
  const ruinCount = Math.floor(totalCells * 0.04);

  const placedPositions = new Set<string>();

  function placeRegion(type: TerrainType, count: number, clusterSize: number) {
    let placed = 0;
    while (placed < count) {
      const centerX = Math.floor(Math.random() * MAP_WIDTH);
      const centerY = Math.floor(Math.random() * MAP_HEIGHT);
      const size = Math.min(clusterSize, count - placed);

      for (let i = 0; i < size; i++) {
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        const x = centerX + dx;
        const y = centerY + dy;
        const key = `${x},${y}`;

        if (
          x >= 0 &&
          x < MAP_WIDTH &&
          y >= 0 &&
          y < MAP_HEIGHT &&
          !placedPositions.has(key) &&
          grid[y][x].type === TerrainType.OPEN
        ) {
          grid[y][x] = createTerrainCell(type);
          placedPositions.add(key);
          placed++;
        }
      }
    }
  }

  placeRegion(TerrainType.TREE, treeCount, 6);
  placeRegion(TerrainType.HIGHLAND, highlandCount, 4);
  placeRegion(TerrainType.RUIN, ruinCount, 3);

  const extractionPoint = generateExtractionPoint(grid);

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    cellSize: CELL_SIZE,
    grid,
    extractionPoint,
  };
}

export function gridToWorld(gx: number, gy: number, cellSize: number = CELL_SIZE): Position {
  return {
    x: gx * cellSize + cellSize / 2,
    y: gy * cellSize + cellSize / 2,
  };
}

export function worldToGrid(wx: number, wy: number, cellSize: number = CELL_SIZE): Position {
  return {
    x: Math.floor(wx / cellSize),
    y: Math.floor(wy / cellSize),
  };
}

export { uuidv4 };

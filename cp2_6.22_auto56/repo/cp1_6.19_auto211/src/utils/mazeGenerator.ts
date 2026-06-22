import { v4 as uuidv4 } from 'uuid';
import { CellType, Note, Position } from '@/types';
import {
  GRID_SIZE,
  NOTE_FREQUENCIES,
  CORRECT_ORDER,
} from '@/constants';

const DIRECTIONS = [
  { dx: 0, dy: -2 },
  { dx: 2, dy: 0 },
  { dx: 0, dy: 2 },
  { dx: -2, dy: 0 },
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateEmptyGrid(): CellType[][] {
  const grid: CellType[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = 'wall';
    }
  }
  return grid;
}

function carve(grid: CellType[][], x: number, y: number): void {
  grid[y][x] = 'path';

  const directions = shuffle(DIRECTIONS);

  for (const { dx, dy } of directions) {
    const nx = x + dx;
    const ny = y + dy;

    if (
      nx > 0 && nx < GRID_SIZE - 1 &&
      ny > 0 && ny < GRID_SIZE - 1 &&
      grid[ny][nx] === 'wall'
    ) {
      grid[y + dy / 2][x + dx / 2] = 'path';
      carve(grid, nx, ny);
    }
  }
}

export function generateMaze(): CellType[][] {
  const grid = generateEmptyGrid();
  carve(grid, 1, 1);
  return grid;
}

export function findPathPositions(grid: CellType[][]): Position[] {
  const positions: Position[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 'path' && !(x === 1 && y === 1)) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

export function placeNotes(grid: CellType[][]): Note[] {
  const pathPositions = findPathPositions(grid);
  const shuffledPositions = shuffle(pathPositions);
  const notes: Note[] = [];

  for (let i = 0; i < CORRECT_ORDER.length && i < shuffledPositions.length; i++) {
    const color = CORRECT_ORDER[i];
    notes.push({
      id: uuidv4(),
      position: shuffledPositions[i],
      color,
      frequency: NOTE_FREQUENCIES[color],
      collected: false,
      order: i,
    });
  }

  return notes;
}

export function getSurroundingWalls(
  grid: CellType[][],
  position: Position
): Position[] {
  const walls: Position[] = [];
  const { x, y } = position;
  const adjacent = [
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
  ];

  for (const { dx, dy } of adjacent) {
    const nx = x + dx;
    const ny = y + dy;
    if (
      nx >= 0 && nx < GRID_SIZE &&
      ny >= 0 && ny < GRID_SIZE &&
      grid[ny][nx] === 'wall'
    ) {
      walls.push({ x: nx, y: ny });
    }
  }

  return walls;
}

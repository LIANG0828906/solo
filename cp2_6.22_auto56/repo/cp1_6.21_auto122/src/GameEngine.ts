export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'moon';

export interface Cell {
  id: string;
  element: ElementType;
  row: number;
  col: number;
}

export const BOARD_SIZE = 8;
export const BASE_ELEMENTS: ElementType[] = ['fire', 'water', 'wind', 'earth'];
export const MIN_PATH_LENGTH = 3;
export const MAX_PATH_LENGTH = 5;
export const SCORE_PER_CELL = 10;
export const ENERGY_PER_CELL = 5;
export const MAX_COMBO = 5;
export const MAX_ENERGY = 100;

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `cell-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getMoonProbability(level: number): number {
  const baseProb = 0.05;
  const maxProb = 0.25;
  const growth = (maxProb - baseProb) / 9;
  return Math.min(maxProb, baseProb + growth * (level - 1));
}

export function randomElement(level: number): ElementType {
  const moonProb = getMoonProbability(level);
  if (Math.random() < moonProb) {
    return 'moon';
  }
  return BASE_ELEMENTS[Math.floor(Math.random() * BASE_ELEMENTS.length)];
}

export function generateBoard(level: number): Cell[][] {
  const board: Cell[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      rowCells.push({
        id: generateId(),
        element: randomElement(level),
        row,
        col,
      });
    }
    board.push(rowCells);
  }
  return board;
}

export function isAdjacent(cell1: Cell, cell2: Cell): boolean {
  const rowDiff = Math.abs(cell1.row - cell2.row);
  const colDiff = Math.abs(cell1.col - cell2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

function isSameElement(elem1: ElementType, elem2: ElementType): boolean {
  if (elem1 === 'moon' || elem2 === 'moon') return true;
  return elem1 === elem2;
}

export function validatePath(path: Cell[]): boolean {
  if (path.length < MIN_PATH_LENGTH || path.length > MAX_PATH_LENGTH) {
    return false;
  }

  for (let i = 0; i < path.length - 1; i++) {
    if (!isAdjacent(path[i], path[i + 1])) {
      return false;
    }
    if (!isSameElement(path[i].element, path[i + 1].element)) {
      return false;
    }
  }

  const uniqueIds = new Set(path.map(c => c.id));
  return uniqueIds.size === path.length;
}

export function getEliminationCells(path: Cell[], board: Cell[][]): Cell[] {
  const toEliminate = new Map<string, Cell>();

  for (const cell of path) {
    toEliminate.set(cell.id, cell);
    if (cell.element === 'moon') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = cell.row + dr;
          const nc = cell.col + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            const neighbor = board[nr][nc];
            if (neighbor) {
              toEliminate.set(neighbor.id, neighbor);
            }
          }
        }
      }
    }
  }

  return Array.from(toEliminate.values());
}

export function createEmptyCell(row: number, col: number): Cell {
  return {
    id: '',
    element: 'fire',
    row,
    col,
  };
}

export function isEmptyCell(cell: Cell): boolean {
  return cell.id === '';
}

export function applyGravity(board: Cell[][]): { newBoard: Cell[][]; fallDistances: Map<string, number> } {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const fallDistances = new Map<string, number>();

  for (let col = 0; col < BOARD_SIZE; col++) {
    const column: Cell[] = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row--) {
      if (!isEmptyCell(newBoard[row][col])) {
        column.push(newBoard[row][col]);
      }
    }

    for (let i = 0; i < BOARD_SIZE; i++) {
      const targetRow = BOARD_SIZE - 1 - i;
      if (i < column.length) {
        const cell = column[i];
        const distance = targetRow - cell.row;
        if (distance > 0) {
          fallDistances.set(cell.id, distance);
        }
        newBoard[targetRow][col] = {
          ...cell,
          row: targetRow,
          col,
        };
      } else {
        newBoard[targetRow][col] = createEmptyCell(targetRow, col);
      }
    }
  }

  return { newBoard, fallDistances };
}

export function fillEmptyCells(board: Cell[][], level: number): { newBoard: Cell[][]; newCells: Cell[] } {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const newCells: Cell[] = [];

  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (isEmptyCell(newBoard[row][col])) {
        const newCell: Cell = {
          id: generateId(),
          element: randomElement(level),
          row,
          col,
        };
        newBoard[row][col] = newCell;
        newCells.push(newCell);
      }
    }
  }

  return { newBoard, newCells };
}

export function eliminateCells(board: Cell[][], cellsToEliminate: Cell[]): Cell[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const eliminateIds = new Set(cellsToEliminate.map(c => c.id));

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (eliminateIds.has(newBoard[row][col].id)) {
        newBoard[row][col] = createEmptyCell(row, col);
      }
    }
  }

  return newBoard;
}

export function calculateScore(eliminatedCount: number, combo: number): number {
  const multiplier = Math.min(Math.max(combo, 1), MAX_COMBO);
  return eliminatedCount * SCORE_PER_CELL * multiplier;
}

export function calculateEnergy(eliminatedCount: number): number {
  return eliminatedCount * ENERGY_PER_CELL;
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map(row => row.map(cell => ({ ...cell })));
}

export function getMoonCount(board: Cell[][]): number {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].element === 'moon') {
        count++;
      }
    }
  }
  return count;
}

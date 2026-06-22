export enum CellType {
  Wall = 'wall',
  Path = 'path',
  Mechanism = 'mechanism',
}

export enum SymbolType {
  Diamond = 'diamond',
  Hexagon = 'hexagon',
  Star = 'star',
  Wave = 'wave',
}

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  type: CellType;
  symbol?: SymbolType;
}

export interface MechanismDoor {
  position: Position;
  symbol: SymbolType;
  open: boolean;
}

export interface PressurePlate {
  position: Position;
  symbol: SymbolType;
  activated: boolean;
}

export interface Item {
  type: 'potion' | 'key' | 'scroll';
  position: Position;
  collected: boolean;
}

export interface MazeData {
  grid: Cell[][];
  doors: MechanismDoor[];
  plates: PressurePlate[];
  items: Item[];
  startPosition: Position;
  endPosition: Position;
}

const DIRECTIONS = [
  { dr: -2, dc: 0 },
  { dr: 2, dc: 0 },
  { dr: 0, dc: -2 },
  { dr: 0, dc: 2 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function carve(grid: Cell[][], row: number, col: number, rows: number, cols: number): void {
  grid[row][col].type = CellType.Path;
  const dirs = shuffle(DIRECTIONS);
  for (const { dr, dc } of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 1 && nr < rows - 1 && nc >= 1 && nc < cols - 1 && grid[nr][nc].type === CellType.Wall) {
      grid[row + dr / 2][col + dc / 2].type = CellType.Path;
      carve(grid, nr, nc, rows, cols);
    }
  }
}

function getPathCells(grid: Cell[][], rows: number, cols: number): Position[] {
  const paths: Position[] = [];
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c].type === CellType.Path && !(r === 1 && c === 1) && !(r === rows - 2 && c === cols - 2)) {
        paths.push({ row: r, col: c });
      }
    }
  }
  return shuffle(paths);
}

export function generateMaze(rows: number = 10, cols: number = 10): MazeData {
  const gridRows = rows * 2 + 1;
  const gridCols = cols * 2 + 1;
  const grid: Cell[][] = [];

  for (let r = 0; r < gridRows; r++) {
    grid[r] = [];
    for (let c = 0; c < gridCols; c++) {
      grid[r][c] = { type: CellType.Wall };
    }
  }

  carve(grid, 1, 1, gridRows, gridCols);

  const startPos: Position = { row: 1, col: 1 };
  const endPos: Position = { row: gridRows - 2, col: gridCols - 2 };

  const pathCells = getPathCells(grid, gridRows, gridCols);

  const symbols = [SymbolType.Diamond, SymbolType.Hexagon, SymbolType.Star, SymbolType.Wave];
  const doors: MechanismDoor[] = [];
  const plates: PressurePlate[] = [];
  let cellIdx = 0;

  for (const sym of symbols) {
    while (cellIdx < pathCells.length) {
      const p = pathCells[cellIdx++];
      const neighbors = getAccessibleNeighbors(grid, p, gridRows, gridCols);
      if (neighbors.length >= 2) {
        doors.push({ position: p, symbol: sym, open: false });
        grid[p.row][p.col] = { type: CellType.Mechanism, symbol: sym };
        break;
      }
    }
  }

  for (const sym of symbols) {
    while (cellIdx < pathCells.length) {
      const p = pathCells[cellIdx++];
      if (grid[p.row][p.col].type === CellType.Path) {
        plates.push({ position: p, symbol: sym, activated: false });
        break;
      }
    }
  }

  const items: Item[] = [];
  const itemCounts = { potion: 4, key: 2, scroll: 2 };

  for (const [itemType, count] of Object.entries(itemCounts)) {
    let placed = 0;
    while (placed < count && cellIdx < pathCells.length) {
      const p = pathCells[cellIdx++];
      if (grid[p.row][p.col].type === CellType.Path) {
        items.push({
          type: itemType as 'potion' | 'key' | 'scroll',
          position: p,
          collected: false,
        });
        placed++;
      }
    }
  }

  return {
    grid,
    doors,
    plates,
    items,
    startPosition: startPos,
    endPosition: endPos,
  };
}

function getAccessibleNeighbors(grid: Cell[][], pos: Position, rows: number, cols: number): Position[] {
  const neighbors: Position[] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = pos.row + dr;
    const nc = pos.col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type === CellType.Path) {
      neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

export function canMove(grid: Cell[][], from: Position, to: Position, doors: MechanismDoor[]): boolean {
  const { row, col } = to;
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) return false;
  const cell = grid[row][col];
  if (cell.type === CellType.Wall) return false;
  if (cell.type === CellType.Mechanism) {
    const door = doors.find(d => d.position.row === row && d.position.col === col);
    if (door && !door.open) return false;
  }
  return true;
}

export function isAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

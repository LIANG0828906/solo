import {
  GRID_SIZE,
  ShipType,
  Ship,
  Grid,
  CellState,
  AttackResult,
  Orientation,
  SHIP_DEFINITIONS,
} from '@/types';

function createEmptyGrid(): Grid {
  const cells: CellState[][] = [];
  const shipMap: (string | null)[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    cells.push(new Array(GRID_SIZE).fill('empty'));
    shipMap.push(new Array(GRID_SIZE).fill(null));
  }
  return { cells, shipMap };
}

export function validatePlacement(
  grid: Grid,
  row: number,
  col: number,
  size: number,
  orientation: Orientation,
  excludeShipId?: string
): boolean {
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    const occupant = grid.shipMap[r][c];
    if (occupant !== null && occupant !== excludeShipId) return false;
  }
  return true;
}

export function placeShip(
  grid: Grid,
  row: number,
  col: number,
  ship: Ship
): Grid {
  const newGrid: Grid = {
    cells: grid.cells.map((r) => [...r]),
    shipMap: grid.shipMap.map((r) => [...r]),
  };

  if (ship.cells.length > 0) {
    for (const [r, c] of ship.cells) {
      newGrid.cells[r][c] = 'empty';
      newGrid.shipMap[r][c] = null;
    }
  }

  for (let i = 0; i < getShipSize(ship.type); i++) {
    const r = ship.orientation === 'vertical' ? row + i : row;
    const c = ship.orientation === 'horizontal' ? col + i : col;
    newGrid.cells[r][c] = 'ship';
    newGrid.shipMap[r][c] = ship.id;
  }

  return newGrid;
}

export function getShipSize(type: ShipType): number {
  return SHIP_DEFINITIONS.find((d) => d.type === type)?.size ?? 0;
}

export function processAttack(
  targetGrid: Grid,
  targetShips: Ship[],
  row: number,
  col: number
): { grid: Grid; ships: Ship[]; result: AttackResult } {
  const newGrid: Grid = {
    cells: targetGrid.cells.map((r) => [...r]),
    shipMap: targetGrid.shipMap.map((r) => [...r]),
  };

  const newShips = targetShips.map((s) => ({
    ...s,
    cells: s.cells.map((c) => [...c] as [number, number]),
    hits: [...s.hits],
  }));

  const cellState = newGrid.cells[row][col];
  let hit = false;
  let sunk = false;
  let sunkShipType: ShipType | undefined;
  let gameOver = false;

  if (cellState === 'ship') {
    hit = true;
    newGrid.cells[row][col] = 'hit';
    const shipId = newGrid.shipMap[row][col];
    if (shipId) {
      const ship = newShips.find((s) => s.id === shipId);
      if (ship) {
        const cellIndex = ship.cells.findIndex(
          ([r, c]) => r === row && c === col
        );
        if (cellIndex >= 0) {
          ship.hits[cellIndex] = true;
        }
        if (ship.hits.every((h) => h)) {
          ship.sunk = true;
          sunk = true;
          sunkShipType = ship.type;
          for (const [r, c] of ship.cells) {
            newGrid.cells[r][c] = 'sunk';
          }
        }
      }
    }
  } else {
    newGrid.cells[row][col] = 'miss';
  }

  if (newShips.every((s) => s.sunk)) {
    gameOver = true;
  }

  return {
    grid: newGrid,
    ships: newShips,
    result: { row, col, hit, sunk, sunkShipType, gameOver },
  };
}

export function generateOpponentShips(): { ships: Ship[]; grid: Grid } {
  const grid = createEmptyGrid();
  const ships: Ship[] = [];

  for (const def of SHIP_DEFINITIONS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      attempts++;
      const orientation: Orientation =
        Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow =
        orientation === 'vertical' ? GRID_SIZE - def.size : GRID_SIZE;
      const maxCol =
        orientation === 'horizontal' ? GRID_SIZE - def.size : GRID_SIZE;
      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);

      if (validatePlacement(grid, row, col, def.size, orientation)) {
        const ship: Ship = {
          id: `opp-${def.type}`,
          type: def.type,
          cells: [],
          hits: new Array(def.size).fill(false),
          sunk: false,
          orientation,
        };
        for (let i = 0; i < def.size; i++) {
          const r = orientation === 'vertical' ? row + i : row;
          const c = orientation === 'horizontal' ? col + i : col;
          ship.cells.push([r, c]);
          grid.cells[r][c] = 'ship';
          grid.shipMap[r][c] = ship.id;
        }
        ships.push(ship);
        placed = true;
      }
    }
  }

  return { ships, grid };
}

export function generateOpponentAttack(
  playerGrid: Grid
): [number, number] | null {
  const available: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const state = playerGrid.cells[r][c];
      if (state === 'empty' || state === 'ship') {
        available.push([r, c]);
      }
    }
  }
  if (available.length === 0) return null;

  const smartTargets: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (playerGrid.cells[r][c] === 'hit') {
        const neighbors: [number, number][] = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        for (const [nr, nc] of neighbors) {
          if (
            nr >= 0 &&
            nr < GRID_SIZE &&
            nc >= 0 &&
            nc < GRID_SIZE &&
            (playerGrid.cells[nr][nc] === 'empty' ||
              playerGrid.cells[nr][nc] === 'ship')
          ) {
            smartTargets.push([nr, nc]);
          }
        }
      }
    }
  }

  const targets = smartTargets.length > 0 ? smartTargets : available;
  return targets[Math.floor(Math.random() * targets.length)];
}

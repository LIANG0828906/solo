import type { Cell } from '../types';

interface MazeCell {
  x: number;
  y: number;
  visited: boolean;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

export function generateMaze(
  gridSize: number,
  wallThickness: number,
  passageWidth: number,
  _unused?: unknown
): { walls: Set<string>; passages: Set<string>; passageCells: Cell[]; canvasSize: number; cellPixelSize: number } {
  const cells: MazeCell[][] = [];
  for (let y = 0; y < gridSize; y++) {
    cells[y] = [];
    for (let x = 0; x < gridSize; x++) {
      cells[y][x] = {
        x,
        y,
        visited: false,
        walls: { top: true, right: true, bottom: true, left: true },
      };
    }
  }

  const stack: MazeCell[] = [];
  const start = cells[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: { cell: MazeCell; dir: 'top' | 'right' | 'bottom' | 'left' }[] = [];

    const { x, y } = current;
    if (y > 0 && !cells[y - 1][x].visited) {
      neighbors.push({ cell: cells[y - 1][x], dir: 'top' });
    }
    if (x < gridSize - 1 && !cells[y][x + 1].visited) {
      neighbors.push({ cell: cells[y][x + 1], dir: 'right' });
    }
    if (y < gridSize - 1 && !cells[y + 1][x].visited) {
      neighbors.push({ cell: cells[y + 1][x], dir: 'bottom' });
    }
    if (x > 0 && !cells[y][x - 1].visited) {
      neighbors.push({ cell: cells[y][x - 1], dir: 'left' });
    }

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    const { cell: nextCell, dir } = next;

    switch (dir) {
      case 'top':
        current.walls.top = false;
        nextCell.walls.bottom = false;
        break;
      case 'right':
        current.walls.right = false;
        nextCell.walls.left = false;
        break;
      case 'bottom':
        current.walls.bottom = false;
        nextCell.walls.top = false;
        break;
      case 'left':
        current.walls.left = false;
        nextCell.walls.right = false;
        break;
    }

    nextCell.visited = true;
    stack.push(nextCell);
  }

  const walls = new Set<string>();
  const passages = new Set<string>();
  const passageCells: Cell[] = [];
  const cellPixelSize = wallThickness + passageWidth;
  const canvasSize = gridSize * cellPixelSize + wallThickness;

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const cell = cells[gy][gx];
      const baseX = gx * cellPixelSize;
      const baseY = gy * cellPixelSize;

      if (cell.walls.top) {
        for (let wx = 0; wx < cellPixelSize; wx++) {
          for (let wy = 0; wy < wallThickness; wy++) {
            walls.add(`${baseX + wx},${baseY + wy}`);
          }
        }
      }

      if (cell.walls.left) {
        for (let wy = 0; wy < cellPixelSize; wy++) {
          for (let wx = 0; wx < wallThickness; wx++) {
            walls.add(`${baseX + wx},${baseY + wy}`);
          }
        }
      }

      if (cell.walls.right) {
        const wallStartX = baseX + cellPixelSize;
        for (let wy = 0; wy < cellPixelSize + wallThickness; wy++) {
          for (let wx = 0; wx < wallThickness; wx++) {
            walls.add(`${wallStartX + wx},${baseY + wy}`);
          }
        }
      }

      if (cell.walls.bottom) {
        const wallStartY = baseY + cellPixelSize;
        for (let wx = 0; wx < cellPixelSize + wallThickness; wx++) {
          for (let wy = 0; wy < wallThickness; wy++) {
            walls.add(`${baseX + wx},${wallStartY + wy}`);
          }
        }
      }

      const passageStartX = baseX + wallThickness;
      const passageStartY = baseY + wallThickness;
      for (let py = 0; py < passageWidth; py++) {
        for (let px = 0; px < passageWidth; px++) {
          passages.add(`${passageStartX + px},${passageStartY + py}`);
        }
      }

      const centerX = passageStartX + Math.floor(passageWidth / 2);
      const centerY = passageStartY + Math.floor(passageWidth / 2);
      passageCells.push({ x: centerX, y: centerY });
    }
  }

  return { walls, passages, passageCells, canvasSize, cellPixelSize };
}

export interface Cell {
  x: number;
  z: number;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
  visited: boolean;
}

export interface WallData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export function generateMaze(size: number): Cell[][] {
  const maze: Cell[][] = [];

  for (let z = 0; z < size; z++) {
    maze[z] = [];
    for (let x = 0; x < size; x++) {
      maze[z][x] = {
        x,
        z,
        walls: { north: true, south: true, east: true, west: true },
        visited: false,
      };
    }
  }

  const stack: Cell[] = [];
  const startCell = maze[0][0];
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(maze, current, size);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      next.visited = true;
      removeWall(current, next);
      stack.push(next);
    }
  }

  return maze;
}

function getUnvisitedNeighbors(maze: Cell[][], cell: Cell, size: number): Cell[] {
  const neighbors: Cell[] = [];
  const { x, z } = cell;

  if (z > 0 && !maze[z - 1][x].visited) neighbors.push(maze[z - 1][x]);
  if (z < size - 1 && !maze[z + 1][x].visited) neighbors.push(maze[z + 1][x]);
  if (x > 0 && !maze[z][x - 1].visited) neighbors.push(maze[z][x - 1]);
  if (x < size - 1 && !maze[z][x + 1].visited) neighbors.push(maze[z][x + 1]);

  return neighbors;
}

function removeWall(current: Cell, next: Cell): void {
  const dx = next.x - current.x;
  const dz = next.z - current.z;

  if (dx === 1) {
    current.walls.east = false;
    next.walls.west = false;
  } else if (dx === -1) {
    current.walls.west = false;
    next.walls.east = false;
  } else if (dz === 1) {
    current.walls.south = false;
    next.walls.north = false;
  } else if (dz === -1) {
    current.walls.north = false;
    next.walls.south = false;
  }
}

export function getWallData(maze: Cell[][], cellSize: number, wallHeight: number): WallData[] {
  const walls: WallData[] = [];
  const size = maze.length;
  const halfCell = cellSize / 2;
  const wallThickness = 0.15;

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const cell = maze[z][x];
      const worldX = (x - size / 2 + 0.5) * cellSize;
      const worldZ = (z - size / 2 + 0.5) * cellSize;

      if (cell.walls.north) {
        walls.push({
          position: [worldX, wallHeight / 2, worldZ - halfCell],
          rotation: [0, 0, 0],
          scale: [cellSize + wallThickness, wallHeight, wallThickness],
        });
      }

      if (cell.walls.south && z === size - 1) {
        walls.push({
          position: [worldX, wallHeight / 2, worldZ + halfCell],
          rotation: [0, 0, 0],
          scale: [cellSize + wallThickness, wallHeight, wallThickness],
        });
      }

      if (cell.walls.west) {
        walls.push({
          position: [worldX - halfCell, wallHeight / 2, worldZ],
          rotation: [0, 0, 0],
          scale: [wallThickness, wallHeight, cellSize + wallThickness],
        });
      }

      if (cell.walls.east && x === size - 1) {
        walls.push({
          position: [worldX + halfCell, wallHeight / 2, worldZ],
          rotation: [0, 0, 0],
          scale: [wallThickness, wallHeight, cellSize + wallThickness],
        });
      }
    }
  }

  return walls;
}

export function getPathCells(maze: Cell[][]): { x: number; z: number }[] {
  const path: { x: number; z: number }[] = [];
  for (let z = 0; z < maze.length; z++) {
    for (let x = 0; x < maze[z].length; x++) {
      path.push({ x, z });
    }
  }
  return path;
}

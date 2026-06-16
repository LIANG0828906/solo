export interface MazeData {
  grid: number[][];
  entrance: { x: number; z: number };
  exit: { x: number; z: number };
  rows: number;
  cols: number;
}

export function generateMaze(rows: number = 10, cols: number = 10): MazeData {
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = 1;
    }
  }

  const visited: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    visited[r] = [];
    for (let c = 0; c < cols; c++) {
      visited[r][c] = false;
    }
  }

  const directions = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 },
  ];

  function carve(r: number, c: number): void {
    visited[r][c] = true;
    grid[r][c] = 0;

    const shuffled = [...directions].sort(() => Math.random() - 0.5);
    for (const d of shuffled) {
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        grid[r + d.dr / 2][c + d.dc / 2] = 0;
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);

  const entrance = { x: 0, z: 0 };
  let exitR = rows - 1;
  let exitC = cols - 1;
  if (exitR % 2 === 0 && exitC % 2 === 0) {
    grid[exitR][exitC] = 0;
  } else {
    for (let r = rows - 1; r >= 0; r--) {
      for (let c = cols - 1; c >= 0; c--) {
        if (grid[r][c] === 0) {
          exitR = r;
          exitC = c;
          break;
        }
      }
      if (grid[exitR][exitC] === 0) break;
    }
  }
  const exit = { x: exitC, z: exitR };

  return { grid, entrance, exit, rows, cols };
}

export function getWallPositions(maze: MazeData): { x: number; z: number }[] {
  const positions: { x: number; z: number }[] = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (maze.grid[r][c] === 1) {
        positions.push({ x: c, z: r });
      }
    }
  }
  return positions;
}

export function getPathPositions(maze: MazeData): { x: number; z: number }[] {
  const positions: { x: number; z: number }[] = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      if (maze.grid[r][c] === 0) {
        positions.push({ x: c, z: r });
      }
    }
  }
  return positions;
}

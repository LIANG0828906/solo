export type CellType = 'wall' | 'floor';
export type MazeGrid = CellType[][];

export interface MazePosition {
  row: number;
  col: number;
}

export function generateMaze(rows: number, cols: number): MazeGrid {
  const maze: MazeGrid = [];
  
  for (let r = 0; r < rows; r++) {
    maze[r] = [];
    for (let c = 0; c < cols; c++) {
      maze[r][c] = 'wall';
    }
  }

  function carve(r: number, c: number): void {
    maze[r][c] = 'floor';
    
    const directions = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0]
    ].sort(() => Math.random() - 0.5);

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && maze[nr][nc] === 'wall') {
        maze[r + dr / 2][c + dc / 2] = 'floor';
        carve(nr, nc);
      }
    }
  }

  const startR = 0;
  const startC = 0;
  maze[startR][startC] = 'floor';
  
  const initialDirections = [
    [0, 1],
    [1, 0]
  ].sort(() => Math.random() - 0.5);
  
  for (const [dr, dc] of initialDirections) {
    const nr = startR + dr;
    const nc = startC + dc;
    if (nr < rows && nc < cols) {
      maze[nr][nc] = 'floor';
      const nextR = nr + dr;
      const nextC = nc + dc;
      if (nextR < rows && nextC < cols) {
        maze[nextR][nextC] = 'floor';
        carve(nextR, nextC);
      }
    }
  }

  ensurePath(maze, rows, cols);
  ensureConnectivity(maze, rows, cols);

  return maze;
}

function ensurePath(maze: MazeGrid, rows: number, cols: number): void {
  maze[0][0] = 'floor';
  maze[rows - 1][cols - 1] = 'floor';
  
  let r = 0;
  let c = 0;
  while (r < rows - 1 || c < cols - 1) {
    if (r < rows - 1 && (c >= cols - 1 || Math.random() > 0.5)) {
      r++;
    } else if (c < cols - 1) {
      c++;
    }
    maze[r][c] = 'floor';
  }
}

function ensureConnectivity(maze: MazeGrid, rows: number, cols: number): void {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (maze[r][c] === 'wall') {
        let floorNeighbors = 0;
        if (r > 0 && maze[r - 1][c] === 'floor') floorNeighbors++;
        if (r < rows - 1 && maze[r + 1][c] === 'floor') floorNeighbors++;
        if (c > 0 && maze[r][c - 1] === 'floor') floorNeighbors++;
        if (c < cols - 1 && maze[r][c + 1] === 'floor') floorNeighbors++;
        
        if (floorNeighbors >= 2 && Math.random() > 0.7) {
          maze[r][c] = 'floor';
        }
      }
    }
  }
}

export function getFloorPositions(maze: MazeGrid, excludePositions: MazePosition[] = []): MazePosition[] {
  const positions: MazePosition[] = [];
  const excludeSet = new Set(excludePositions.map(p => `${p.row},${p.col}`));
  
  for (let r = 0; r < maze.length; r++) {
    for (let c = 0; c < maze[r].length; c++) {
      const key = `${r},${c}`;
      if (maze[r][c] === 'floor' && !excludeSet.has(key)) {
        positions.push({ row: r, col: c });
      }
    }
  }
  
  return positions;
}

export function getRandomPositions(
  maze: MazeGrid,
  count: number,
  excludePositions: MazePosition[] = []
): MazePosition[] {
  const available = getFloorPositions(maze, excludePositions);
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

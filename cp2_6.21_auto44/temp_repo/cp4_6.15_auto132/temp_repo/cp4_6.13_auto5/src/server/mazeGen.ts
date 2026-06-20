import { MAZE_SIZE, CELL_WALL, CELL_PATH, MazeData, Position } from './types/game.js';

export class MazeGenerator {
  private size: number;

  constructor(size: number = MAZE_SIZE) {
    this.size = size % 2 === 0 ? size + 1 : size;
  }

  public generateSymmetricMaze(): MazeData {
    const halfWidth = Math.floor(this.size / 2) + 1;
    const maze: MazeData = this.initializeMaze();

    this.generateLeftHalf(maze, halfWidth);
    this.mirrorToRightHalf(maze, halfWidth);
    this.ensureConnectivity(maze);
    this.ensureStartAndEnd(maze);

    return maze;
  }

  private initializeMaze(): MazeData {
    const maze: MazeData = [];
    for (let y = 0; y < this.size; y++) {
      maze[y] = [];
      for (let x = 0; x < this.size; x++) {
        maze[y][x] = CELL_WALL;
      }
    }
    return maze;
  }

  private generateLeftHalf(maze: MazeData, halfWidth: number): void {
    const stack: Position[] = [];
    const startX = 1;
    const startY = 1;

    maze[startY][startX] = CELL_PATH;
    stack.push({ x: startX, y: startY });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current, maze, halfWidth);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        const wallX = current.x + (next.x - current.x) / 2;
        const wallY = current.y + (next.y - current.y) / 2;

        maze[wallY][wallX] = CELL_PATH;
        maze[next.y][next.x] = CELL_PATH;

        stack.push(next);
      }
    }
  }

  private getUnvisitedNeighbors(
    pos: Position,
    maze: MazeData,
    halfWidth: number
  ): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 }
    ];

    for (const dir of directions) {
      const nx = pos.x + dir.dx;
      const ny = pos.y + dir.dy;

      if (
        nx > 0 &&
        nx < halfWidth &&
        ny > 0 &&
        ny < this.size - 1 &&
        maze[ny][nx] === CELL_WALL
      ) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private mirrorToRightHalf(maze: MazeData, halfWidth: number): void {
    const mid = Math.floor(this.size / 2);

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < halfWidth; x++) {
        const mirrorX = this.size - 1 - x;
        if (mirrorX !== x) {
          maze[y][mirrorX] = maze[y][x];
        }
      }
      maze[y][mid] = CELL_PATH;
    }
  }

  private ensureConnectivity(maze: MazeData): void {
    const mid = Math.floor(this.size / 2);

    for (let y = 1; y < this.size - 1; y += 2) {
      if (maze[y][mid] === CELL_PATH) {
        if (maze[y - 1][mid] === CELL_WALL && maze[y + 1][mid] === CELL_WALL) {
          if (Math.random() > 0.5) {
            maze[y - 1][mid] = CELL_PATH;
          } else {
            maze[y + 1][mid] = CELL_PATH;
          }
        }
      }
    }
  }

  private ensureStartAndEnd(maze: MazeData): void {
    maze[0][0] = CELL_PATH;
    maze[0][1] = CELL_PATH;
    maze[1][0] = CELL_PATH;
    maze[1][1] = CELL_PATH;

    maze[this.size - 1][this.size - 1] = CELL_PATH;
    maze[this.size - 1][this.size - 2] = CELL_PATH;
    maze[this.size - 2][this.size - 1] = CELL_PATH;
    maze[this.size - 2][this.size - 2] = CELL_PATH;
  }

  public hasPath(maze: MazeData, start: Position, end: Position): boolean {
    const visited: boolean[][] = [];
    for (let y = 0; y < this.size; y++) {
      visited[y] = [];
      for (let x = 0; x < this.size; x++) {
        visited[y][x] = false;
      }
    }

    const queue: Position[] = [start];
    visited[start.y][start.x] = true;

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === end.x && current.y === end.y) {
        return true;
      }

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (
          nx >= 0 &&
          nx < this.size &&
          ny >= 0 &&
          ny < this.size &&
          !visited[ny][nx] &&
          maze[ny][nx] === CELL_PATH
        ) {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny });
        }
      }
    }

    return false;
  }

  public isSymmetric(maze: MazeData): boolean {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < Math.floor(this.size / 2); x++) {
        if (maze[y][x] !== maze[y][this.size - 1 - x]) {
          return false;
        }
      }
    }
    return true;
  }
}

export function generateMaze(): MazeData {
  const generator = new MazeGenerator(MAZE_SIZE);
  let maze: MazeData;
  let attempts = 0;

  do {
    maze = generator.generateSymmetricMaze();
    attempts++;
  } while (
    (!generator.hasPath(maze, { x: 0, y: 0 }, { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 }) ||
      !generator.isSymmetric(maze)) &&
    attempts < 10
  );

  return maze;
}

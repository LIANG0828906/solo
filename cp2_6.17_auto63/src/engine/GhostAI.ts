import { CellType, Direction, Position } from '../types';

interface QueueItem {
  x: number;
  y: number;
  path: Direction[];
}

export class GhostAI {
  private maze: CellType[][];

  constructor(maze: CellType[][]) {
    this.maze = maze;
  }

  public updateMaze(maze: CellType[][]): void {
    this.maze = maze;
  }

  public getNextDirection(
    ghostX: number,
    ghostY: number,
    playerX: number,
    playerY: number
  ): Direction {
    const gx = Math.round(ghostX);
    const gy = Math.round(ghostY);
    const px = Math.round(playerX);
    const py = Math.round(playerY);

    if (gx === px && gy === py) {
      return Direction.NONE;
    }

    const path = this.bfs(gx, gy, px, py);

    if (path.length > 0) {
      return path[0];
    }

    return this.getRandomDirection(gx, gy);
  }

  private bfs(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Direction[] {
    const rows = this.maze.length;
    const cols = this.maze[0].length;

    const visited = new Set<string>();
    const queue: QueueItem[] = [
      { x: startX, y: startY, path: [] },
    ];

    visited.add(`${startX},${startY}`);

    const directions = [
      { dx: 0, dy: -1, dir: Direction.UP },
      { dx: 0, dy: 1, dir: Direction.DOWN },
      { dx: -1, dy: 0, dir: Direction.LEFT },
      { dx: 1, dy: 0, dir: Direction.RIGHT },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.x === endX && current.y === endY) {
        return current.path;
      }

      for (const { dx, dy, dir } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;

        if (
          nx >= 0 &&
          nx < cols &&
          ny >= 0 &&
          ny < rows &&
          !visited.has(key) &&
          this.maze[ny][nx] !== CellType.WALL
        ) {
          visited.add(key);
          queue.push({
            x: nx,
            y: ny,
            path: [...current.path, dir],
          });
        }
      }
    }

    return [];
  }

  private getRandomDirection(x: number, y: number): Direction {
    const directions: Direction[] = [];
    const gx = Math.round(x);
    const gy = Math.round(y);

    if (gy > 0 && this.maze[gy - 1][gx] !== CellType.WALL) {
      directions.push(Direction.UP);
    }
    if (gy < this.maze.length - 1 && this.maze[gy + 1][gx] !== CellType.WALL) {
      directions.push(Direction.DOWN);
    }
    if (gx > 0 && this.maze[gy][gx - 1] !== CellType.WALL) {
      directions.push(Direction.LEFT);
    }
    if (gx < this.maze[0].length - 1 && this.maze[gy][gx + 1] !== CellType.WALL) {
      directions.push(Direction.RIGHT);
    }

    if (directions.length === 0) {
      return Direction.NONE;
    }

    return directions[Math.floor(Math.random() * directions.length)];
  }

  public getFleeDirection(
    ghostX: number,
    ghostY: number,
    playerX: number,
    playerY: number
  ): Direction {
    const gx = Math.round(ghostX);
    const gy = Math.round(ghostY);
    const px = Math.round(playerX);
    const py = Math.round(playerY);

    const directions = [
      { dx: 0, dy: -1, dir: Direction.UP },
      { dx: 0, dy: 1, dir: Direction.DOWN },
      { dx: -1, dy: 0, dir: Direction.LEFT },
      { dx: 1, dy: 0, dir: Direction.RIGHT },
    ];

    let bestDir = Direction.NONE;
    let maxDist = -1;

    for (const { dx, dy, dir } of directions) {
      const nx = gx + dx;
      const ny = gy + dy;

      if (
        ny >= 0 &&
        ny < this.maze.length &&
        nx >= 0 &&
        nx < this.maze[0].length &&
        this.maze[ny][nx] !== CellType.WALL
      ) {
        const dist = Math.abs(nx - px) + Math.abs(ny - py);
        if (dist > maxDist) {
          maxDist = dist;
          bestDir = dir;
        }
      }
    }

    return bestDir;
  }
}

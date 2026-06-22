import { Cell, Position } from '../types';

export class MazeGenerator {
  private readonly width: number;
  private readonly height: number;
  private grid: Cell[][];
  private visited: boolean[][];

  constructor(width = 10, height = 10) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.visited = [];
    this.initializeGrid();
  }

  private initializeGrid(): void {
    this.grid = [];
    this.visited = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      this.visited[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          x,
          y,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true,
          },
        };
        this.visited[y][x] = false;
      }
    }
  }

  private getUnvisitedNeighbors(x: number, y: number): Position[] {
    const neighbors: Position[] = [];
    if (y > 0 && !this.visited[y - 1][x]) neighbors.push({ x, y: y - 1 });
    if (x < this.width - 1 && !this.visited[y][x + 1]) neighbors.push({ x: x + 1, y });
    if (y < this.height - 1 && !this.visited[y + 1][x]) neighbors.push({ x, y: y + 1 });
    if (x > 0 && !this.visited[y][x - 1]) neighbors.push({ x: x - 1, y });
    return neighbors;
  }

  private removeWall(current: Position, next: Position): void {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx === 1) {
      this.grid[current.y][current.x].walls.right = false;
      this.grid[next.y][next.x].walls.left = false;
    } else if (dx === -1) {
      this.grid[current.y][current.x].walls.left = false;
      this.grid[next.y][next.x].walls.right = false;
    } else if (dy === 1) {
      this.grid[current.y][current.x].walls.bottom = false;
      this.grid[next.y][next.x].walls.top = false;
    } else if (dy === -1) {
      this.grid[current.y][current.x].walls.top = false;
      this.grid[next.y][next.x].walls.bottom = false;
    }
  }

  private recursiveBacktrack(x: number, y: number): void {
    this.visited[y][x] = true;
    let neighbors = this.getUnvisitedNeighbors(x, y);

    while (neighbors.length > 0) {
      const randomIndex = Math.floor(Math.random() * neighbors.length);
      const next = neighbors[randomIndex];
      this.removeWall({ x, y }, next);
      this.recursiveBacktrack(next.x, next.y);
      neighbors = this.getUnvisitedNeighbors(x, y);
    }
  }

  public generate(): Cell[][] {
    this.initializeGrid();
    const startX = Math.floor(Math.random() * this.width);
    const startY = Math.floor(Math.random() * this.height);
    this.recursiveBacktrack(startX, startY);

    this.grid[0][0].isEntrance = true;

    const exitCandidates: Position[] = [];
    for (let y = this.height - 2; y < this.height; y++) {
      for (let x = this.width - 2; x < this.width; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          exitCandidates.push({ x, y });
        }
      }
    }
    const exitPos = exitCandidates[Math.floor(Math.random() * exitCandidates.length)];
    this.grid[exitPos.y][exitPos.x].isExit = true;

    return JSON.parse(JSON.stringify(this.grid));
  }

  public canMove(maze: Cell[][], from: Position, direction: 'up' | 'down' | 'left' | 'right'): boolean {
    if (from.x < 0 || from.x >= this.width || from.y < 0 || from.y >= this.height) {
      return false;
    }
    const cell = maze[from.y][from.x];
    switch (direction) {
      case 'up':
        return from.y > 0 && !cell.walls.top;
      case 'down':
        return from.y < this.height - 1 && !cell.walls.bottom;
      case 'left':
        return from.x > 0 && !cell.walls.left;
      case 'right':
        return from.x < this.width - 1 && !cell.walls.right;
      default:
        return false;
    }
  }

  public getNeighborPosition(pos: Position, direction: 'up' | 'down' | 'left' | 'right'): Position {
    switch (direction) {
      case 'up':
        return { x: pos.x, y: pos.y - 1 };
      case 'down':
        return { x: pos.x, y: pos.y + 1 };
      case 'left':
        return { x: pos.x - 1, y: pos.y };
      case 'right':
        return { x: pos.x + 1, y: pos.y };
    }
  }
}

export const positionKey = (pos: Position): string => `${pos.x},${pos.y}`;

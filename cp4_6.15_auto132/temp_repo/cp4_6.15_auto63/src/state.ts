import { events } from './events';

export const MAZE_SIZE = 10;
export const CELL_SIZE = 2;
export const TOTAL_BADGES = 5;

export interface Cell {
  x: number;
  z: number;
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  visited: boolean;
}

export interface Badge {
  id: number;
  cellX: number;
  cellZ: number;
  collected: boolean;
}

export interface PlayerState {
  x: number;
  z: number;
  rotation: number;
}

export interface GameState {
  maze: Cell[][];
  player: PlayerState;
  badges: Badge[];
  exitCell: { x: number; z: number };
  startCell: { x: number; z: number };
  steps: number;
  startTime: number;
  elapsedTime: number;
  isPlaying: boolean;
  isWin: boolean;
  nearExit: boolean;
}

class StateManager {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const maze = this.generateMaze();
    const startCell = { x: 0, z: 0 };
    const exitCell = { x: MAZE_SIZE - 1, z: MAZE_SIZE - 1 };
    const badges = this.placeBadges(maze, startCell, exitCell);

    return {
      maze,
      player: {
        x: startCell.x * CELL_SIZE + CELL_SIZE / 2,
        z: startCell.z * CELL_SIZE + CELL_SIZE / 2,
        rotation: 0
      },
      badges,
      exitCell,
      startCell,
      steps: 0,
      startTime: 0,
      elapsedTime: 0,
      isPlaying: false,
      isWin: false,
      nearExit: false
    };
  }

  private generateMaze(): Cell[][] {
    const maze: Cell[][] = [];

    for (let z = 0; z < MAZE_SIZE; z++) {
      maze[z] = [];
      for (let x = 0; x < MAZE_SIZE; x++) {
        maze[z][x] = {
          x,
          z,
          walls: { north: true, south: true, east: true, west: true },
          visited: false
        };
      }
    }

    const stack: Cell[] = [];
    const start = maze[0][0];
    start.visited = true;
    stack.push(start);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(maze, current);

      if (neighbors.length === 0) {
        stack.pop();
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        next.cell.visited = true;
        this.removeWall(current, next.cell, next.direction);
        stack.push(next.cell);
      }
    }

    return maze;
  }

  private getUnvisitedNeighbors(
    maze: Cell[][],
    cell: Cell
  ): { cell: Cell; direction: string }[] {
    const neighbors: { cell: Cell; direction: string }[] = [];
    const { x, z } = cell;

    if (z > 0 && !maze[z - 1][x].visited) {
      neighbors.push({ cell: maze[z - 1][x], direction: 'north' });
    }
    if (z < MAZE_SIZE - 1 && !maze[z + 1][x].visited) {
      neighbors.push({ cell: maze[z + 1][x], direction: 'south' });
    }
    if (x < MAZE_SIZE - 1 && !maze[z][x + 1].visited) {
      neighbors.push({ cell: maze[z][x + 1], direction: 'east' });
    }
    if (x > 0 && !maze[z][x - 1].visited) {
      neighbors.push({ cell: maze[z][x - 1], direction: 'west' });
    }

    return neighbors;
  }

  private removeWall(current: Cell, next: Cell, direction: string): void {
    switch (direction) {
      case 'north':
        current.walls.north = false;
        next.walls.south = false;
        break;
      case 'south':
        current.walls.south = false;
        next.walls.north = false;
        break;
      case 'east':
        current.walls.east = false;
        next.walls.west = false;
        break;
      case 'west':
        current.walls.west = false;
        next.walls.east = false;
        break;
    }
  }

  private placeBadges(
    maze: Cell[][],
    start: { x: number; z: number },
    exit: { x: number; z: number }
  ): Badge[] {
    const badges: Badge[] = [];
    const usedCells = new Set<string>();
    usedCells.add(`${start.x},${start.z}`);
    usedCells.add(`${exit.x},${exit.z}`);

    let id = 0;
    while (badges.length < TOTAL_BADGES) {
      const x = Math.floor(Math.random() * MAZE_SIZE);
      const z = Math.floor(Math.random() * MAZE_SIZE);
      const key = `${x},${z}`;

      if (!usedCells.has(key)) {
        usedCells.add(key);
        badges.push({
          id: id++,
          cellX: x,
          cellZ: z,
          collected: false
        });
      }
    }

    return badges;
  }

  getState(): GameState {
    return this.state;
  }

  setPlayerPosition(x: number, z: number): void {
    const oldCellX = Math.floor(this.state.player.x / CELL_SIZE);
    const oldCellZ = Math.floor(this.state.player.z / CELL_SIZE);

    this.state.player.x = x;
    this.state.player.z = z;

    const newCellX = Math.floor(x / CELL_SIZE);
    const newCellZ = Math.floor(z / CELL_SIZE);

    if (oldCellX !== newCellX || oldCellZ !== newCellZ) {
      this.state.steps++;
      events.emit('stepsChanged', this.state.steps);
      this.checkBadgeCollection(newCellX, newCellZ);
      this.checkExitProximity(newCellX, newCellZ);
    }

    events.emit('playerPositionChanged', { x, z });
  }

  setPlayerRotation(rotation: number): void {
    this.state.player.rotation = rotation;
    events.emit('playerRotationChanged', rotation);
  }

  private checkBadgeCollection(cellX: number, cellZ: number): void {
    for (const badge of this.state.badges) {
      if (!badge.collected && badge.cellX === cellX && badge.cellZ === cellZ) {
        badge.collected = true;
        events.emit('badgeCollected', badge);
        this.checkAllBadgesCollected();
      }
    }
  }

  private checkAllBadgesCollected(): void {
    const allCollected = this.state.badges.every((b) => b.collected);
    if (allCollected) {
      events.emit('allBadgesCollected');
    }
  }

  private checkExitProximity(cellX: number, cellZ: number): void {
    const nearExit =
      cellX === this.state.exitCell.x && cellZ === this.state.exitCell.z;

    if (nearExit !== this.state.nearExit) {
      this.state.nearExit = nearExit;
      events.emit('exitProximityChanged', nearExit);
    }
  }

  startGame(): void {
    this.state.isPlaying = true;
    this.state.startTime = Date.now();
    events.emit('gameStarted');
  }

  winGame(): void {
    if (this.state.isWin) return;
    this.state.isWin = true;
    this.state.isPlaying = false;
    this.state.elapsedTime = (Date.now() - this.state.startTime) / 1000;
    events.emit('gameWon', {
      time: this.state.elapsedTime,
      badges: this.state.badges.filter((b) => b.collected).length,
      steps: this.state.steps
    });
  }

  resetGame(): void {
    this.state = this.createInitialState();
    events.emit('gameReset');
  }

  canMoveTo(x: number, z: number): boolean {
    const cellX = Math.floor(x / CELL_SIZE);
    const cellZ = Math.floor(z / CELL_SIZE);

    if (cellX < 0 || cellX >= MAZE_SIZE || cellZ < 0 || cellZ >= MAZE_SIZE) {
      return false;
    }

    const player = this.state.player;
    const px = player.x;
    const pz = player.z;
    const playerCellX = Math.floor(px / CELL_SIZE);
    const playerCellZ = Math.floor(pz / CELL_SIZE);

    if (playerCellX === cellX && playerCellZ === cellZ) {
      return true;
    }

    if (cellX !== playerCellX && cellZ !== playerCellZ) {
      return false;
    }

    const cell = this.state.maze[playerCellZ][playerCellX];

    if (cellX > playerCellX) {
      return !cell.walls.east;
    }
    if (cellX < playerCellX) {
      return !cell.walls.west;
    }
    if (cellZ > playerCellZ) {
      return !cell.walls.south;
    }
    if (cellZ < playerCellZ) {
      return !cell.walls.north;
    }

    return true;
  }
}

export const state = new StateManager();
export default state;

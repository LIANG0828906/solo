export type TileType = 'grass' | 'wall' | 'chest' | 'portal';

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  collected?: boolean;
}

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 20;
export const TILE_SIZE = 32;
export const WALL_RATIO = 0.2;
export const CHEST_COUNT = 5;
export const PORTAL_COUNT = 2;

export const COLORS = {
  grass: '#90EE90',
  wall: '#4A4A4A',
  chest: '#FFD700',
  portal: '#9370DB',
  player: '#4169E1',
  grid: '#7CCD7C',
};

export class GameMap {
  readonly width = GRID_WIDTH;
  readonly height = GRID_HEIGHT;
  readonly tileSize = TILE_SIZE;

  private grid: Tile[][] = [];
  private chestPositions: Position[] = [];
  private portalPositions: Position[] = [];
  private totalChests = CHEST_COUNT;

  constructor() {
    this.generate();
  }

  generate(): void {
    this.grid = [];
    this.chestPositions = [];
    this.portalPositions = [];

    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = { type: 'grass' };
      }
    }

    this.grid[0][0] = { type: 'grass' };

    const totalTiles = this.width * this.height;
    const wallCount = Math.floor(totalTiles * WALL_RATIO);
    let wallsPlaced = 0;

    while (wallsPlaced < wallCount) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (x === 0 && y === 0) continue;
      if (this.grid[y][x].type !== 'grass') continue;

      this.grid[y][x] = { type: 'wall' };
      wallsPlaced++;
    }

    let chestsPlaced = 0;
    while (chestsPlaced < CHEST_COUNT) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (x === 0 && y === 0) continue;
      if (this.grid[y][x].type !== 'grass') continue;

      this.grid[y][x] = { type: 'chest', collected: false };
      this.chestPositions.push({ x, y });
      chestsPlaced++;
    }

    let portalsPlaced = 0;
    while (portalsPlaced < PORTAL_COUNT) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (x === 0 && y === 0) continue;
      if (this.grid[y][x].type !== 'grass') continue;

      this.grid[y][x] = { type: 'portal' };
      this.portalPositions.push({ x, y });
      portalsPlaced++;
    }
  }

  getTile(x: number, y: number): Tile {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return { type: 'wall' };
    }
    return this.grid[y][x];
  }

  isWall(x: number, y: number): boolean {
    return this.getTile(x, y).type === 'wall';
  }

  collectChest(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (tile.type === 'chest' && !tile.collected) {
      tile.collected = true;
      return true;
    }
    return false;
  }

  getRandomPortalPosition(currentX: number, currentY: number): Position {
    const availablePortals = this.portalPositions.filter(
      (p) => !(p.x === currentX && p.y === currentY)
    );
    if (availablePortals.length === 0) {
      return { x: 0, y: 0 };
    }
    const randomIndex = Math.floor(Math.random() * availablePortals.length);
    return availablePortals[randomIndex];
  }

  getRemainingChests(): number {
    return this.chestPositions.filter(
      (pos) => !this.grid[pos.y][pos.x].collected
    ).length;
  }

  getTotalChests(): number {
    return this.totalChests;
  }

  getCollectedChests(): number {
    return this.totalChests - this.getRemainingChests();
  }

  reset(): void {
    this.generate();
  }
}

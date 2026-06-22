export type TileType = 'grass' | 'sand' | 'rock' | 'water';

export interface MapData {
  grid: TileType[][];
  treasurePositions: { x: number; y: number }[];
  playerStart: { x: number; y: number };
  portalPosition: { x: number; y: number };
}

export class MapGenerator {
  private static readonly GRID_SIZE = 15;

  static generate(level: number): MapData {
    const grid: TileType[][] = this.createBaseGrid();
    this.addIslandShape(grid);
    this.addDetails(grid);

    const validPositions = this.getWalkablePositions(grid);
    const shuffled = Phaser.Utils.Array.Shuffle([...validPositions]);

    const treasureCount = 3 + Phaser.Math.Between(0, 2);
    const treasurePositions = shuffled.slice(0, treasureCount);

    const remaining = shuffled.slice(treasureCount);
    const playerStart = remaining[0];

    const centerX = Math.floor(this.GRID_SIZE / 2);
    const centerY = Math.floor(this.GRID_SIZE / 2);
    const portalPosition = this.findNearbyWalkable(grid, centerX, centerY);

    return { grid, treasurePositions, playerStart, portalPosition };
  }

  private static createBaseGrid(): TileType[][] {
    const grid: TileType[][] = [];
    for (let y = 0; y < this.GRID_SIZE; y++) {
      grid[y] = [];
      for (let x = 0; x < this.GRID_SIZE; x++) {
        grid[y][x] = 'water';
      }
    }
    return grid;
  }

  private static addIslandShape(grid: TileType[][]): void {
    const centerX = this.GRID_SIZE / 2;
    const centerY = this.GRID_SIZE / 2;
    const maxRadius = 6.5;

    for (let y = 0; y < this.GRID_SIZE; y++) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const noise = (Math.sin(x * 0.8) * Math.cos(y * 0.7) + Math.sin((x + y) * 0.5)) * 1.2;
        const adjusted = distance + noise;

        if (adjusted < maxRadius - 2.5) {
          grid[y][x] = 'grass';
        } else if (adjusted < maxRadius - 1) {
          grid[y][x] = 'sand';
        } else if (adjusted < maxRadius) {
          grid[y][x] = Math.random() > 0.3 ? 'sand' : 'water';
        }
      }
    }
  }

  private static addDetails(grid: TileType[][]): void {
    for (let y = 0; y < this.GRID_SIZE; y++) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        if (grid[y][x] === 'grass' && Math.random() < 0.08) {
          grid[y][x] = 'rock';
        }
      }
    }
  }

  private static getWalkablePositions(grid: TileType[][]): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    for (let y = 0; y < this.GRID_SIZE; y++) {
      for (let x = 0; x < this.GRID_SIZE; x++) {
        if (grid[y][x] === 'grass' || grid[y][x] === 'sand') {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  private static findNearbyWalkable(grid: TileType[][], cx: number, cy: number): { x: number; y: number } {
    const offsets = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1],
      [2, 0], [-2, 0], [0, 2], [0, -2]
    ];
    for (const [ox, oy] of offsets) {
      const x = cx + ox;
      const y = cy + oy;
      if (x >= 0 && x < this.GRID_SIZE && y >= 0 && y < this.GRID_SIZE) {
        if (grid[y][x] === 'grass' || grid[y][x] === 'sand') {
          return { x, y };
        }
      }
    }
    return { x: cx, y: cy };
  }
}

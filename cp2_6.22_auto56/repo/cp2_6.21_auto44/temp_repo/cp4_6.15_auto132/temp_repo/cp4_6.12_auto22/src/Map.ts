export const TILE_SIZE = 64;
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 15;
export const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;

export class GameMap {
  private tiles: number[][];

  constructor() {
    this.tiles = this.generateMap();
  }

  private generateMap(): number[][] {
    const map: number[][] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
          map[y][x] = 1;
        } else {
          map[y][x] = 0;
        }
      }
    }
    map[3][5] = 1;
    map[3][6] = 1;
    map[3][7] = 1;
    map[5][10] = 1;
    map[6][10] = 1;
    map[7][10] = 1;
    map[10][3] = 1;
    map[10][4] = 1;
    map[11][7] = 1;
    map[11][8] = 1;
    map[11][9] = 1;
    map[8][15] = 1;
    map[9][15] = 1;
    map[10][15] = 1;
    map[6][13] = 1;
    map[6][14] = 1;
    return map;
  }

  public getTileAt(tileX: number, tileY: number): number {
    if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
      return 1;
    }
    return this.tiles[tileY][tileX];
  }

  public isWall(tileX: number, tileY: number): boolean {
    return this.getTileAt(tileX, tileY) === 1;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const tile = this.tiles[y][x];

        if (tile === 0) {
          ctx.fillStyle = '#566573';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#7F8C8D';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        } else {
          ctx.fillStyle = '#4A235A';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#6C3483';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(px + 4 + i * 20, py + 8, 8, TILE_SIZE - 16);
          }
          ctx.strokeStyle = '#7F8C8D';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        }
      }
    }
  }

  public reset(): void {
    this.tiles = this.generateMap();
  }
}

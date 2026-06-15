import { CONFIG } from './constants';
import { CaveMap } from './map';
import { TileType } from './types';

export class CollisionDetector {
  private map: CaveMap;

  constructor(map: CaveMap) {
    this.map = map;
  }

  public checkCollision(x: number, y: number, width: number, height: number): boolean {
    const corners = [
      { x: x + 2, y: y + 2 },
      { x: x + width - 3, y: y + 2 },
      { x: x + 2, y: y + height - 3 },
      { x: x + width - 3, y: y + height - 3 },
      { x: x + width / 2, y: y + 2 },
      { x: x + width / 2, y: y + height - 3 }
    ];

    for (const corner of corners) {
      if (this.map.isSolid(corner.x, corner.y)) {
        return true;
      }
    }

    return false;
  }

  public canMoveTo(x: number, y: number, width: number, height: number): boolean {
    const tileX = Math.floor(x / CONFIG.TILE_SIZE);
    const mapWidth = this.map.getMapWidth();

    if (tileX <= 0 || tileX >= mapWidth - 1) {
      return false;
    }

    if (y < 0) {
      return false;
    }

    return !this.checkCollision(x, y, width, height);
  }

  public checkMining(x: number, y: number, width: number, height: number): { x: number; y: number; type: TileType } | null {
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const tile = this.map.getTile(centerX, centerY);
    if (tile && tile.type !== TileType.EMPTY) {
      return {
        x: tile.x * CONFIG.TILE_SIZE,
        y: tile.y * CONFIG.TILE_SIZE,
        type: tile.type
      };
    }

    return null;
  }

  public getAdjacentTiles(x: number, y: number, width: number, height: number): Array<{ x: number; y: number; type: TileType }> {
    const tiles: Array<{ x: number; y: number; type: TileType }> = [];
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (const dir of directions) {
      const checkX = centerX + dir.dx * CONFIG.TILE_SIZE;
      const checkY = centerY + dir.dy * CONFIG.TILE_SIZE;
      const tile = this.map.getTile(checkX, checkY);
      if (tile && tile.type !== TileType.EMPTY) {
        tiles.push({
          x: tile.x * CONFIG.TILE_SIZE,
          y: tile.y * CONFIG.TILE_SIZE,
          type: tile.type
        });
      }
    }

    return tiles;
  }
}

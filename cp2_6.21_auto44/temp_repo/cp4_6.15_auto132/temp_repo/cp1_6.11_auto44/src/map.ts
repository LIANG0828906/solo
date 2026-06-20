import { TileType, Tile, MapChunk, Debris, CollapseEvent } from './types';
import { CONFIG, COLORS, MAP_WIDTH, CHUNK_HEIGHT, RENDER_BUFFER, CHUNK_UNLOAD_DELAY } from './constants';
import { randomInt, randomFloat, generateNoiseTexture, clamp } from './utils';

export class CaveMap {
  private chunks: Map<number, MapChunk> = new Map();
  private currentDepth: number = 0;
  private collapseProbability: number = 0.05;
  private wallDensity: number = 0.30;
  private diamondProbability: number = 0.005;
  private oreValueMultiplier: number = 1.0;

  constructor() {
    this.generateInitialChunks();
  }

  private generateInitialChunks(): void {
    for (let i = -1; i <= 2; i++) {
      this.generateChunk(i);
    }
  }

  private generateChunk(chunkIndex: number): void {
    const startY = chunkIndex * CHUNK_HEIGHT;
    const endY = startY + CHUNK_HEIGHT;
    const tiles: Tile[][] = [];

    const startTileY = Math.max(0, startY);
    for (let y = startTileY; y < endY; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        tiles[y][x] = this.generateTile(x, y, startY);
      }
    }

    if (startY <= 0 && endY > 0) {
      this.createStartingArea(tiles);
    }

    this.applyRandomWalk(tiles, startY, endY);

    this.chunks.set(chunkIndex, {
      startY,
      endY,
      tiles,
      lastUsed: Date.now()
    });
  }

  private generateTile(x: number, y: number, chunkStartY: number): Tile {
    if (x === 0 || x === MAP_WIDTH - 1 || y === chunkStartY && chunkStartY > 0) {
      return this.createWallTile(x, y);
    }

    const depthFactor = y / 100;
    const localWallDensity = this.wallDensity + depthFactor * 0.02;

    const rand = Math.random();

    if (rand < localWallDensity) {
      return this.createWallTile(x, y);
    } else if (rand < localWallDensity + 0.15) {
      return this.createOreTile(x, y);
    } else {
      return this.createEmptyTile(x, y);
    }
  }

  private createEmptyTile(x: number, y: number): Tile {
    return {
      type: TileType.EMPTY,
      x,
      y,
      texture: []
    };
  }

  private createWallTile(x: number, y: number): Tile {
    return {
      type: TileType.WALL,
      x,
      y,
      texture: generateNoiseTexture(CONFIG.TILE_SIZE, COLORS.WALL_BASE, 30)
    };
  }

  private createOreTile(x: number, y: number): Tile {
    const depthFactor = y / 200;
    const diamondChance = this.diamondProbability + depthFactor * 0.015;
    const goldChance = 0.05 + depthFactor * 0.03;
    const silverChance = 0.15 + depthFactor * 0.05;

    const rand = Math.random();
    let type: TileType;

    if (rand < diamondChance) {
      type = TileType.DIAMOND;
    } else if (rand < diamondChance + goldChance) {
      type = TileType.GOLD;
    } else if (rand < diamondChance + goldChance + silverChance) {
      type = TileType.SILVER;
    } else {
      type = TileType.COPPER;
    }

    return {
      type,
      x,
      y,
      texture: generateNoiseTexture(CONFIG.TILE_SIZE, this.getOreColor(type), 20)
    };
  }

  private getOreColor(type: TileType): string {
    switch (type) {
      case TileType.COPPER: return COLORS.COPPER;
      case TileType.SILVER: return COLORS.SILVER;
      case TileType.GOLD: return COLORS.GOLD;
      case TileType.DIAMOND: return COLORS.DIAMOND;
      default: return COLORS.WALL_BASE;
    }
  }

  private createStartingArea(tiles: Tile[][]): void {
    for (let y = 0; y < 5; y++) {
      for (let x = 45; x < 55; x++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x] = this.createEmptyTile(x, y);
        }
      }
    }

    for (let y = 5; y < 10; y++) {
      for (let x = 47; x < 53; x++) {
        if (tiles[y] && tiles[y][x]) {
          tiles[y][x] = this.createEmptyTile(x, y);
        }
      }
    }
  }

  private applyRandomWalk(tiles: Tile[][], startY: number, endY: number): void {
    let walkerX = randomInt(20, MAP_WIDTH - 20);
    let walkerY = Math.max(1, startY + 1);

    const steps = Math.floor(MAP_WIDTH * CHUNK_HEIGHT * 0.3);

    for (let i = 0; i < steps; i++) {
      if (walkerY >= startY && walkerY < endY) {
        this.clearArea(tiles, walkerX, walkerY, 2);
      }

      const direction = randomInt(0, 3);
      switch (direction) {
        case 0: walkerX = clamp(walkerX - 1, 1, MAP_WIDTH - 2); break;
        case 1: walkerX = clamp(walkerX + 1, 1, MAP_WIDTH - 2); break;
        case 2: walkerY = Math.max(startY + 1, walkerY - 1); break;
        case 3: walkerY = Math.min(endY - 2, walkerY + 1); break;
      }
    }
  }

  private clearArea(tiles: Tile[][], centerX: number, centerY: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x > 0 && x < MAP_WIDTH - 1 && tiles[y] && tiles[y][x]) {
          if (tiles[y][x].type === TileType.WALL && Math.random() < 0.7) {
            tiles[y][x] = this.createEmptyTile(x, y);
          }
        }
      }
    }
  }

  public getTile(x: number, y: number): Tile | null {
    const tileX = Math.floor(x / CONFIG.TILE_SIZE);
    const tileY = Math.floor(y / CONFIG.TILE_SIZE);

    if (tileX < 0 || tileX >= MAP_WIDTH) return null;

    const chunkIndex = Math.floor(tileY / CHUNK_HEIGHT);
    const chunk = this.chunks.get(chunkIndex);

    if (!chunk) {
      this.generateChunk(chunkIndex);
      return this.getTile(x, y);
    }

    chunk.lastUsed = Date.now();

    if (chunk.tiles[tileY] && chunk.tiles[tileY][tileX]) {
      return chunk.tiles[tileY][tileX];
    }

    return null;
  }

  public isSolid(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== null && tile.type !== TileType.EMPTY;
  }

  public mineTile(x: number, y: number): TileType {
    const tileX = Math.floor(x / CONFIG.TILE_SIZE);
    const tileY = Math.floor(y / CONFIG.TILE_SIZE);

    const chunkIndex = Math.floor(tileY / CHUNK_HEIGHT);
    const chunk = this.chunks.get(chunkIndex);

    if (chunk && chunk.tiles[tileY] && chunk.tiles[tileY][tileX]) {
      const tile = chunk.tiles[tileY][tileX];
      if (tile.type !== TileType.EMPTY) {
        const minedType = tile.type;
        chunk.tiles[tileY][tileX] = this.createEmptyTile(tileX, tileY);
        return minedType;
      }
    }

    return TileType.EMPTY;
  }

  public updateChunks(currentY: number): void {
    const currentTileY = Math.floor(currentY / CONFIG.TILE_SIZE);
    const currentChunk = Math.floor(currentTileY / CHUNK_HEIGHT);

    for (let i = currentChunk - 1; i <= currentChunk + 2; i++) {
      if (!this.chunks.has(i)) {
        this.generateChunk(i);
      } else {
        this.chunks.get(i)!.lastUsed = Date.now();
      }
    }

    const now = Date.now();
    for (const [index, chunk] of this.chunks.entries()) {
      if (now - chunk.lastUsed > CHUNK_UNLOAD_DELAY) {
        const distance = Math.abs(index - currentChunk);
        if (distance > 2) {
          this.chunks.delete(index);
        }
      }
    }

    const newDepth = Math.floor(currentTileY * CONFIG.DEPTH_PER_TILE);
    if (newDepth > this.currentDepth) {
      this.currentDepth = newDepth;
      this.updateDifficulty(newDepth);
    }
  }

  private updateDifficulty(depth: number): void {
    const level = Math.floor(depth / 60);
    this.collapseProbability = 0.05 + level * 0.05;
    this.wallDensity = 0.30 + level * 0.02;
    this.diamondProbability = 0.005 + level * 0.003;
    this.oreValueMultiplier = 1.0 + level * 0.1;
  }

  public triggerCollapse(centerX: number, centerY: number): CollapseEvent {
    const tileX = Math.floor(centerX / CONFIG.TILE_SIZE);
    const tileY = Math.floor(centerY / CONFIG.TILE_SIZE);
    const size = CONFIG.COLLAPSE_SIZE;

    const debris: Debris[] = [];
    for (let i = 0; i < 10; i++) {
      debris.push({
        x: (tileX - size / 2 + randomInt(0, size)) * CONFIG.TILE_SIZE,
        y: (tileY - size / 2) * CONFIG.TILE_SIZE,
        vy: randomFloat(2, 6),
        size: randomInt(4, 12),
        rotation: 0,
        rotationSpeed: randomFloat(-0.2, 0.2),
        life: 1500,
        maxLife: 1500
      });
    }

    return {
      x: tileX,
      y: tileY,
      size,
      timeLeft: 1500,
      debris,
      damageDealt: false
    };
  }

  public applyCollapse(collapse: CollapseEvent): void {
    const { x, y, size } = collapse;
    const halfSize = Math.floor(size / 2);

    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const tileX = x + dx;
        const tileY = y + dy;

        if (tileX > 0 && tileX < MAP_WIDTH - 1) {
          const chunkIndex = Math.floor(tileY / CHUNK_HEIGHT);
          const chunk = this.chunks.get(chunkIndex);

          if (chunk && chunk.tiles[tileY] && chunk.tiles[tileY][tileX]) {
            if (Math.random() < this.collapseProbability) {
              const newType = Math.random() < 0.3 ? TileType.WALL : TileType.EMPTY;
              if (newType === TileType.WALL) {
                chunk.tiles[tileY][tileX] = this.createWallTile(tileX, tileY);
              } else {
                chunk.tiles[tileY][tileX] = this.createEmptyTile(tileX, tileY);
              }
            }
          }
        }
      }
    }
  }

  public isInCollapseArea(playerX: number, playerY: number, collapse: CollapseEvent): boolean {
    const tileX = Math.floor(playerX / CONFIG.TILE_SIZE);
    const tileY = Math.floor(playerY / CONFIG.TILE_SIZE);
    const halfSize = Math.floor(collapse.size / 2);

    return (
      tileX >= collapse.x - halfSize &&
      tileX <= collapse.x + halfSize &&
      tileY >= collapse.y - halfSize &&
      tileY <= collapse.y + halfSize
    );
  }

  public getVisibleTiles(cameraY: number, canvasHeight: number): { startY: number; endY: number } {
    const startTileY = Math.floor((cameraY - RENDER_BUFFER * CONFIG.TILE_SIZE) / CONFIG.TILE_SIZE);
    const endTileY = Math.floor((cameraY + canvasHeight + RENDER_BUFFER * CONFIG.TILE_SIZE) / CONFIG.TILE_SIZE);

    return {
      startY: Math.max(0, startTileY),
      endY: endTileY
    };
  }

  public getCurrentDepth(): number {
    return this.currentDepth;
  }

  public getOreValueMultiplier(): number {
    return this.oreValueMultiplier;
  }

  public getMapWidth(): number {
    return MAP_WIDTH;
  }
}

export enum TileType {
  GRASS = 'grass',
  WATER = 'water',
  WALL = 'wall'
}

export interface Tile {
  type: TileType;
  walkable: boolean;
  x: number;
  y: number;
}

export interface MapData {
  width: number;
  height: number;
  tiles: Tile[][];
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
}

export class MapGenerator {
  private width: number;
  private height: number;
  private wallRatio: number = 0.2;
  private waterRatio: number = 0.1;

  constructor(width: number = 12, height: number = 8) {
    this.width = width;
    this.height = height;
  }

  public generate(): MapData {
    const startTime = performance.now();
    let attemptCount = 0;
    const maxAttempts = 100;

    while (attemptCount < maxAttempts) {
      attemptCount++;
      const tiles: Tile[][] = [];
      for (let y = 0; y < this.height; y++) {
        tiles[y] = [];
        for (let x = 0; x < this.width; x++) {
          tiles[y][x] = {
            type: TileType.GRASS,
            walkable: true,
            x,
            y
          };
        }
      }

      const totalTiles = this.width * this.height;
      const wallCount = Math.floor(totalTiles * this.wallRatio);
      const waterCount = Math.floor(totalTiles * this.waterRatio);

      this.placeRandomTiles(tiles, TileType.WALL, wallCount);
      this.placeRandomTiles(tiles, TileType.WATER, waterCount);

      const startPos = { x: 0, y: 0 };
      const endPos = { x: this.width - 1, y: this.height - 1 };

      tiles[startPos.y][startPos.x].type = TileType.GRASS;
      tiles[startPos.y][startPos.x].walkable = true;
      tiles[endPos.y][endPos.x].type = TileType.GRASS;
      tiles[endPos.y][endPos.x].walkable = true;

      if (this.isPathExists(tiles, startPos, endPos)) {
        const elapsed = performance.now() - startTime;
        console.log(`[MapGenerator] Map generated in ${elapsed.toFixed(2)}ms (${attemptCount} attempts)`);
        return {
          width: this.width,
          height: this.height,
          tiles,
          startPos,
          endPos
        };
      }
    }

    const tiles = this.createGuaranteedMap();
    const elapsed = performance.now() - startTime;
    console.log(`[MapGenerator] Guaranteed map generated in ${elapsed.toFixed(2)}ms (after ${maxAttempts} failed attempts)`);
    return tiles;
  }

  private createGuaranteedMap(): MapData {
    const tiles: Tile[][] = [];
    const startPos = { x: 0, y: 0 };
    const endPos = { x: this.width - 1, y: this.height - 1 };

    for (let y = 0; y < this.height; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        tiles[y][x] = {
          type: TileType.GRASS,
          walkable: true,
          x,
          y
        };
      }
    }

    const totalTiles = this.width * this.height;
    const wallCount = Math.floor(totalTiles * this.wallRatio);
    const waterCount = Math.floor(totalTiles * this.waterRatio);

    let placed = 0;
    let attempts = 0;
    const maxPlacementAttempts = wallCount * 20;

    while (placed < wallCount && attempts < maxPlacementAttempts) {
      attempts++;
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (
        tiles[y][x].type === TileType.GRASS &&
        !(x === startPos.x && y === startPos.y) &&
        !(x === endPos.x && y === endPos.y)
      ) {
        tiles[y][x].type = TileType.WALL;
        tiles[y][x].walkable = false;
        if (this.isPathExists(tiles, startPos, endPos)) {
          placed++;
        } else {
          tiles[y][x].type = TileType.GRASS;
          tiles[y][x].walkable = true;
        }
      }
    }

    placed = 0;
    attempts = 0;

    while (placed < waterCount && attempts < maxPlacementAttempts) {
      attempts++;
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (
        tiles[y][x].type === TileType.GRASS &&
        !(x === startPos.x && y === startPos.y) &&
        !(x === endPos.x && y === endPos.y)
      ) {
        tiles[y][x].type = TileType.WATER;
        tiles[y][x].walkable = false;
        if (this.isPathExists(tiles, startPos, endPos)) {
          placed++;
        } else {
          tiles[y][x].type = TileType.GRASS;
          tiles[y][x].walkable = true;
        }
      }
    }

    return {
      width: this.width,
      height: this.height,
      tiles,
      startPos,
      endPos
    };
  }

  private placeRandomTiles(tiles: Tile[][], type: TileType, count: number): void {
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 10;

    while (placed < count && attempts < maxAttempts) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (tiles[y][x].type === TileType.GRASS) {
        tiles[y][x].type = type;
        tiles[y][x].walkable = type === TileType.GRASS;
        placed++;
      }
      attempts++;
    }
  }

  private isPathExists(tiles: Tile[][], start: { x: number; y: number }, end: { x: number; y: number }): boolean {
    const visited = new Set<string>();
    const queue: { x: number; y: number }[] = [start];
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.x === end.x && current.y === end.y) {
        return true;
      }

      const neighbors = [
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 }
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (
          neighbor.x >= 0 && neighbor.x < this.width &&
          neighbor.y >= 0 && neighbor.y < this.height &&
          !visited.has(key) &&
          tiles[neighbor.y][neighbor.x].walkable
        ) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }
    return false;
  }

  public getRandomWalkableTile(tiles: Tile[][]): { x: number; y: number } {
    const walkableTiles: { x: number; y: number }[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (tiles[y][x].walkable) {
          walkableTiles.push({ x, y });
        }
      }
    }
    const index = Math.floor(Math.random() * walkableTiles.length);
    return walkableTiles[index];
  }
}

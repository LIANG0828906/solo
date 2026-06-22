import { TileType, Tile, Position, MAP_WIDTH, MAP_HEIGHT } from '../types';

export class MapManager {
  private map: Tile[][] = [];
  private entrance: Position = { x: 0, y: 0 };
  private exit: Position = { x: 0, y: 0 };
  private trapPositions: Position[] = [];
  private crystalPositions: Position[] = [];
  private orePositions: Position[] = [];

  generateMap(): {
    map: Tile[][];
    entrance: Position;
    exit: Position;
    traps: Position[];
    crystals: Position[];
    ores: Position[];
  } {
    const startTime = performance.now();

    this.map = this.createInitialMap();
    this.applyCellularAutomata(5);
    this.ensureConnectivity();
    this.placeEntranceAndExit();
    this.placeResources();
    this.placeTraps();

    const endTime = performance.now();
    console.log(`Map generated in ${endTime - startTime}ms`);

    return {
      map: this.map,
      entrance: this.entrance,
      exit: this.exit,
      traps: [...this.trapPositions],
      crystals: [...this.crystalPositions],
      ores: [...this.orePositions]
    };
  }

  private createInitialMap(): Tile[][] {
    const map: Tile[][] = [];
    const fillProbability = 0.45;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        const isWall =
          x === 0 ||
          x === MAP_WIDTH - 1 ||
          y === 0 ||
          y === MAP_HEIGHT - 1 ||
          Math.random() < fillProbability;

        map[y][x] = {
          type: isWall ? TileType.WALL : TileType.FLOOR,
          explored: false,
          visible: false
        };
      }
    }

    return map;
  }

  private applyCellularAutomata(iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      const newMap = this.copyMap();

      for (let y = 1; y < MAP_HEIGHT - 1; y++) {
        for (let x = 1; x < MAP_WIDTH - 1; x++) {
          const wallCount = this.countWallNeighbors(x, y);

          if (wallCount > 4) {
            newMap[y][x].type = TileType.WALL;
          } else if (wallCount < 4) {
            newMap[y][x].type = TileType.FLOOR;
          }
        }
      }

      this.map = newMap;
    }
  }

  private countWallNeighbors(x: number, y: number): number {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) {
          count++;
        } else if (this.map[ny][nx].type === TileType.WALL) {
          count++;
        }
      }
    }

    return count;
  }

  private copyMap(): Tile[][] {
    return this.map.map(row =>
      row.map(tile => ({ ...tile }))
    );
  }

  private ensureConnectivity(): void {
    const floorTiles = this.getFloorTiles();
    if (floorTiles.length === 0) return;

    const regions = this.findRegions();
    const largestRegion = regions.reduce((a, b) => (a.length > b.length ? a : b));

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.map[y][x].type === TileType.FLOOR) {
          const inLargest = largestRegion.some(p => p.x === x && p.y === y);
          if (!inLargest) {
            this.map[y][x].type = TileType.WALL;
          }
        }
      }
    }
  }

  private findRegions(): Position[][] {
    const visited: boolean[][] = Array(MAP_HEIGHT)
      .fill(null)
      .map(() => Array(MAP_WIDTH).fill(false));
    const regions: Position[][] = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.map[y][x].type === TileType.FLOOR && !visited[y][x]) {
          const region = this.floodFill(x, y, visited);
          regions.push(region);
        }
      }
    }

    return regions;
  }

  private floodFill(startX: number, startY: number, visited: boolean[][]): Position[] {
    const region: Position[] = [];
    const queue: Position[] = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const current = queue.shift()!;
      region.push(current);

      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < MAP_WIDTH &&
          neighbor.y >= 0 &&
          neighbor.y < MAP_HEIGHT &&
          !visited[neighbor.y][neighbor.x] &&
          this.map[neighbor.y][neighbor.x].type === TileType.FLOOR
        ) {
          visited[neighbor.y][neighbor.x] = true;
          queue.push(neighbor);
        }
      }
    }

    return region;
  }

  private getFloorTiles(): Position[] {
    const tiles: Position[] = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (this.map[y][x].type === TileType.FLOOR) {
          tiles.push({ x, y });
        }
      }
    }

    return tiles;
  }

  private placeEntranceAndExit(): void {
    const floorTiles = this.getFloorTiles();
    if (floorTiles.length < 2) return;

    let maxDist = 0;
    let entrancePos = floorTiles[0];
    let exitPos = floorTiles[floorTiles.length - 1];

    const edgeTiles = floorTiles.filter(
      t => t.x <= 2 || t.x >= MAP_WIDTH - 3 || t.y <= 2 || t.y >= MAP_HEIGHT - 3
    );

    if (edgeTiles.length >= 2) {
      for (let i = 0; i < edgeTiles.length; i++) {
        for (let j = i + 1; j < edgeTiles.length; j++) {
          const dist = Math.abs(edgeTiles[i].x - edgeTiles[j].x) +
            Math.abs(edgeTiles[i].y - edgeTiles[j].y);
          if (dist > maxDist) {
            maxDist = dist;
            entrancePos = edgeTiles[i];
            exitPos = edgeTiles[j];
          }
        }
      }
    }

    this.entrance = entrancePos;
    this.exit = exitPos;

    this.map[entrancePos.y][entrancePos.x].type = TileType.ENTRANCE;
    this.map[exitPos.y][exitPos.x].type = TileType.EXIT;
  }

  private placeResources(): void {
    this.crystalPositions = [];
    this.orePositions = [];

    const floorTiles = this.getFloorTiles().filter(
      t => this.map[t.y][t.x].type === TileType.FLOOR
    );

    const crystalCount = Math.min(15, Math.floor(floorTiles.length * 0.03));
    const oreCount = Math.min(12, Math.floor(floorTiles.length * 0.025));

    this.shuffleArray(floorTiles);

    let placed = 0;
    for (const tile of floorTiles) {
      if (placed >= crystalCount) break;
      if (this.isFarFromEntrance(tile, 5)) {
        this.map[tile.y][tile.x].type = TileType.CRYSTAL;
        this.crystalPositions.push(tile);
        placed++;
      }
    }

    const remainingFloor = floorTiles.filter(
      t => this.map[t.y][t.x].type === TileType.FLOOR
    );
    this.shuffleArray(remainingFloor);

    placed = 0;
    for (const tile of remainingFloor) {
      if (placed >= oreCount) break;
      if (this.isFarFromEntrance(tile, 3)) {
        this.map[tile.y][tile.x].type = TileType.ORE;
        this.orePositions.push(tile);
        placed++;
      }
    }
  }

  private placeTraps(): void {
    this.trapPositions = [];

    const floorTiles = this.getFloorTiles().filter(
      t => this.map[t.y][t.x].type === TileType.FLOOR
    );

    const trapCount = Math.min(20, Math.floor(floorTiles.length * 0.04));

    this.shuffleArray(floorTiles);

    let placed = 0;
    for (const tile of floorTiles) {
      if (placed >= trapCount) break;
      if (this.isFarFromEntrance(tile, 4)) {
        this.map[tile.y][tile.x].type = TileType.TRAP;
        this.map[tile.y][tile.x].trapTriggered = false;
        this.trapPositions.push(tile);
        placed++;
      }
    }
  }

  private isFarFromEntrance(pos: Position, minDist: number): boolean {
    const dist = Math.abs(pos.x - this.entrance.x) + Math.abs(pos.y - this.entrance.y);
    return dist >= minDist;
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) {
      return null;
    }
    return this.map[y][x];
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return tile.type !== TileType.WALL;
  }

  collectResource(x: number, y: number): TileType | null {
    const tile = this.getTile(x, y);
    if (!tile || tile.collected) return null;

    if (tile.type === TileType.CRYSTAL || tile.type === TileType.ORE) {
      const type = tile.type;
      tile.collected = true;
      tile.type = TileType.FLOOR;
      return type;
    }

    return null;
  }

  triggerTrap(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    if (tile.type !== TileType.TRAP) return false;
    if (tile.trapTriggered) return false;

    tile.trapTriggered = true;
    return true;
  }

  getMap(): Tile[][] {
    return this.map;
  }

  getEntrance(): Position {
    return this.entrance;
  }

  getExit(): Position {
    return this.exit;
  }
}

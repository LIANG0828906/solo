import { eventBus, GameEvents, ExploreUpdateData } from './EventBus';
import { FogAnimState, TreasureAnimState, easeOutCubic } from './animations';

export enum TileType {
  GROUND = 'ground',
  TREE = 'tree',
  RIVER = 'river',
  ROCK = 'rock'
}

export interface Tile {
  type: TileType;
  gridX: number;
  gridY: number;
  walkable: boolean;
  decorations: Array<{ type: 'rock' | 'tree_small'; offsetX: number; offsetY: number }>;
  fog: FogAnimState;
  explored: boolean;
}

export interface Treasure {
  index: number;
  gridX: number;
  gridY: number;
  collected: boolean;
  anim: TreasureAnimState;
  pulsePhase: number;
}

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export const GRID_SIZE = 15;
export const TILE_SIZE = 64;
export const REVEAL_RADIUS = 80;
export const OBSTACLE_RATIO = 0.25;
export const TREASURE_COUNT = 40;
export const WIN_THRESHOLD = 35;

export class GameWorld {
  private tiles: Tile[][] = [];
  private treasures: Treasure[] = [];
  private rng: SeededRandom;
  public readonly seed: number;
  public score: number = 0;
  private exploredCount: number = 0;
  private playerStartX: number = 0;
  private playerStartY: number = 0;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
    this.rng = new SeededRandom(this.seed);
    this.generateWorld();
    this.generateTreasures();
    this.findPlayerStart();
    this.revealArea(this.playerStartX, this.playerStartY, true);
  }

  private generateWorld(): void {
    const totalTiles = GRID_SIZE * GRID_SIZE;
    const obstacleCount = Math.floor(totalTiles * OBSTACLE_RATIO);
    const center = Math.floor(GRID_SIZE / 2);

    this.tiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({
          type: TileType.GROUND,
          gridX: x,
          gridY: y,
          walkable: true,
          decorations: [],
          fog: {
            opacity: 0.85,
            targetOpacity: 0.85,
            startOpacity: 0.85,
            startTime: 0,
            duration: 1000,
            animating: false
          },
          explored: false
        });
      }
      this.tiles.push(row);
    }

    const obstaclePositions: Array<{ x: number; y: number }> = [];
    let placed = 0;
    let attempts = 0;
    const maxAttempts = totalTiles * 3;

    while (placed < obstacleCount && attempts < maxAttempts) {
      attempts++;
      const x = this.rng.nextInt(0, GRID_SIZE - 1);
      const y = this.rng.nextInt(0, GRID_SIZE - 1);

      if (x === center && y === center) continue;
      if (Math.abs(x - center) <= 1 && Math.abs(y - center) <= 1) continue;
      if (this.tiles[y][x].type !== TileType.GROUND) continue;

      const isRiver = this.rng.next() < 0.3;
      this.tiles[y][x].type = isRiver ? TileType.RIVER : TileType.TREE;
      this.tiles[y][x].walkable = false;
      obstaclePositions.push({ x, y });
      placed++;
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tiles[y][x];
        if (tile.type !== TileType.GROUND) continue;
        const decoCount = this.rng.nextInt(0, 2);
        for (let d = 0; d < decoCount; d++) {
          tile.decorations.push({
            type: this.rng.next() < 0.7 ? 'rock' : 'tree_small',
            offsetX: this.rng.next() * (TILE_SIZE - 20) + 10,
            offsetY: this.rng.next() * (TILE_SIZE - 20) + 10
          });
        }
      }
    }
  }

  private generateTreasures(): void {
    this.treasures = [];
    let placed = 0;
    let attempts = 0;
    const maxAttempts = GRID_SIZE * GRID_SIZE * 5;
    const usedPositions = new Set<string>();
    const center = Math.floor(GRID_SIZE / 2);

    while (placed < TREASURE_COUNT && attempts < maxAttempts) {
      attempts++;
      const x = this.rng.nextInt(0, GRID_SIZE - 1);
      const y = this.rng.nextInt(0, GRID_SIZE - 1);
      const key = `${x},${y}`;

      if (usedPositions.has(key)) continue;
      if (!this.tiles[y][x].walkable) continue;
      if (x === center && y === center) continue;

      this.treasures.push({
        index: placed,
        gridX: x,
        gridY: y,
        collected: false,
        anim: { scale: 1, rotation: 0, opacity: 1, active: false },
        pulsePhase: this.rng.next() * Math.PI * 2
      });
      usedPositions.add(key);
      placed++;
    }
  }

  private findPlayerStart(): void {
    const center = Math.floor(GRID_SIZE / 2);
    this.playerStartX = center;
    this.playerStartY = center;
  }

  public getPlayerStart(): { gridX: number; gridY: number } {
    return { gridX: this.playerStartX, gridY: this.playerStartY };
  }

  public getTile(gridX: number, gridY: number): Tile | null {
    if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
      return null;
    }
    return this.tiles[gridY][gridX];
  }

  public isWalkable(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile !== null && tile.walkable;
  }

  public revealArea(centerGridX: number, centerGridY: number, instant: boolean = false): void {
    const centerPixelX = centerGridX * TILE_SIZE + TILE_SIZE / 2;
    const centerPixelY = centerGridY * TILE_SIZE + TILE_SIZE / 2;
    const revealedTiles: Array<{ gridX: number; gridY: number }> = [];
    let newExplored = 0;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tilePixelX = x * TILE_SIZE + TILE_SIZE / 2;
        const tilePixelY = y * TILE_SIZE + TILE_SIZE / 2;
        const dx = tilePixelX - centerPixelX;
        const dy = tilePixelY - centerPixelY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= REVEAL_RADIUS) {
          const tile = this.tiles[y][x];
          if (!tile.explored) {
            tile.explored = true;
            newExplored++;
          }

          if (tile.fog.targetOpacity > 0) {
            if (instant) {
              tile.fog.opacity = 0;
              tile.fog.targetOpacity = 0;
              tile.fog.animating = false;
            } else if (!tile.fog.animating) {
              tile.fog.startOpacity = tile.fog.opacity;
              tile.fog.targetOpacity = 0;
              tile.fog.startTime = performance.now();
              tile.fog.animating = true;
            }
            revealedTiles.push({ gridX: x, gridY: y });
          }
        }
      }
    }

    if (newExplored > 0) {
      this.exploredCount += newExplored;
      const data: ExploreUpdateData = {
        exploredCount: this.exploredCount,
        totalTiles: GRID_SIZE * GRID_SIZE
      };
      eventBus.emit(GameEvents.EXPLORE_UPDATED, data);
    }

    if (revealedTiles.length > 0) {
      eventBus.emit(GameEvents.FOG_REVEALED, { tiles: revealedTiles });
    }
  }

  public updateFogAnimations(now: number): void {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tiles[y][x];
        if (tile.fog.animating) {
          const t = Math.min((now - tile.fog.startTime) / tile.fog.duration, 1);
          const eased = easeOutCubic(t);
          tile.fog.opacity = tile.fog.startOpacity + (tile.fog.targetOpacity - tile.fog.startOpacity) * eased;
          if (t >= 1) {
            tile.fog.opacity = tile.fog.targetOpacity;
            tile.fog.animating = false;
          }
        }
      }
    }
  }

  public checkTreasureAt(gridX: number, gridY: number): Treasure | null {
    for (const treasure of this.treasures) {
      if (!treasure.collected && treasure.gridX === gridX && treasure.gridY === gridY) {
        return treasure;
      }
    }
    return null;
  }

  public collectTreasure(treasure: Treasure): void {
    if (treasure.collected) return;
    treasure.collected = true;
    treasure.anim.active = true;
    treasure.anim.scale = 1;
    treasure.anim.rotation = 0;
    treasure.anim.opacity = 1;

    const startTime = performance.now();
    const duration = 400;
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);
      treasure.anim.scale = 1 + eased * 1.5;
      treasure.anim.rotation = eased * Math.PI * 2;
      treasure.anim.opacity = 1 - eased;
      if (t >= 1) {
        treasure.anim.active = false;
      } else {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    this.score++;
    eventBus.emit(GameEvents.TREASURE_COLLECTED, {
      index: treasure.index,
      score: this.score,
      total: TREASURE_COUNT
    });
    eventBus.emit(GameEvents.SCORE_UPDATED, this.score);

    if (this.score >= WIN_THRESHOLD) {
      eventBus.emit(GameEvents.GAME_WIN);
    }
  }

  public getTreasures(): Treasure[] {
    return this.treasures;
  }

  public getAllTiles(): Tile[][] {
    return this.tiles;
  }

  public getExplorePercent(): number {
    return (this.exploredCount / (GRID_SIZE * GRID_SIZE)) * 100;
  }

  public getExploredCount(): number {
    return this.exploredCount;
  }

  public getTotalTiles(): number {
    return GRID_SIZE * GRID_SIZE;
  }
}

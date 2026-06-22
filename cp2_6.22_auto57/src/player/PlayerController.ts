import { Position, TileType, TILE_SIZE, VISION_RADIUS, MAP_WIDTH, MAP_HEIGHT } from '../types';
import { MapManager } from '../map/MapManager';
import { ResourceSystem } from './ResourceSystem';

export type TrapTriggeredCallback = (x: number, y: number) => void;
export type ResourceCollectedCallback = (type: TileType, x: number, y: number) => void;
export type PlayerMovedCallback = (x: number, y: number) => void;
export type ExitReachedCallback = () => void;

export class PlayerController {
  private position: Position = { x: 0, y: 0 };
  private pixelPosition: { x: number; y: number } = { x: 0, y: 0 };
  private targetPosition: Position = { x: 0, y: 0 };
  private isMoving: boolean = false;
  private moveSpeed: number = 14;
  private moveProgress: number = 0;

  private keys: Set<string> = new Set();
  private moveCooldown: number = 0;
  private readonly MOVE_COOLDOWN = 0.04;

  private collectTimer: number = 0;
  private readonly COLLECT_INTERVAL = 0.3;

  private bobTimer: number = 0;
  private bobOffset: number = 0;

  private mapManager: MapManager;
  private resourceSystem: ResourceSystem;

  private trapCallbacks: TrapTriggeredCallback[] = [];
  private collectCallbacks: ResourceCollectedCallback[] = [];
  private moveCallbacks: PlayerMovedCallback[] = [];
  private exitCallbacks: ExitReachedCallback[] = [];

  constructor(mapManager: MapManager, resourceSystem: ResourceSystem) {
    this.mapManager = mapManager;
    this.resourceSystem = resourceSystem;
  }

  init(startPosition: Position): void {
    this.position = { ...startPosition };
    this.targetPosition = { ...startPosition };
    this.pixelPosition = {
      x: startPosition.x * TILE_SIZE,
      y: startPosition.y * TILE_SIZE
    };
    this.isMoving = false;
    this.moveProgress = 0;
    this.moveCooldown = 0;
    this.collectTimer = 0;
    this.bobTimer = 0;
    this.bobOffset = 0;

    this.updateVisibility();
  }

  handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  update(deltaTime: number): void {
    if (this.resourceSystem.getState().isGameOver || this.resourceSystem.getState().isVictory) {
      return;
    }

    this.moveCooldown = Math.max(0, this.moveCooldown - deltaTime);

    if (this.isMoving) {
      this.updateMovement(deltaTime);
    } else {
      this.handleInput();
    }

    this.updateBob(deltaTime);
    this.updateCollect(deltaTime);
  }

  private handleInput(): void {
    if (this.moveCooldown > 0) return;

    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy = -1;
    else if (this.keys.has('s') || this.keys.has('arrowdown')) dy = 1;
    else if (this.keys.has('a') || this.keys.has('arrowleft')) dx = -1;
    else if (this.keys.has('d') || this.keys.has('arrowright')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      const newX = this.position.x + dx;
      const newY = this.position.y + dy;

      if (this.mapManager.isWalkable(newX, newY)) {
        this.startMove(newX, newY);
      }
    }
  }

  private startMove(x: number, y: number): void {
    this.targetPosition = { x, y };
    this.isMoving = true;
    this.moveProgress = 0;
    this.moveCooldown = this.MOVE_COOLDOWN;
  }

  private updateMovement(deltaTime: number): void {
    this.moveProgress += deltaTime * this.moveSpeed;

    if (this.moveProgress >= 1) {
      this.moveProgress = 1;
      this.position = { ...this.targetPosition };
      this.pixelPosition = {
        x: this.position.x * TILE_SIZE,
        y: this.position.y * TILE_SIZE
      };
      this.isMoving = false;
      this.moveProgress = 0;

      this.onTileEntered();
      this.updateVisibility();
      this.notifyMove();
    } else {
      const startX = this.position.x * TILE_SIZE;
      const startY = this.position.y * TILE_SIZE;
      const endX = this.targetPosition.x * TILE_SIZE;
      const endY = this.targetPosition.y * TILE_SIZE;

      this.pixelPosition.x = startX + (endX - startX) * this.easeOutQuad(this.moveProgress);
      this.pixelPosition.y = startY + (endY - startY) * this.easeOutQuad(this.moveProgress);
    }
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  private updateBob(deltaTime: number): void {
    if (this.isMoving) {
      this.bobTimer += deltaTime * 15;
      this.bobOffset = Math.sin(this.bobTimer) * 2.5;
    } else {
      this.bobTimer = 0;
      this.bobOffset *= 0.9;
    }
  }

  private updateCollect(deltaTime: number): void {
    this.collectTimer -= deltaTime;

    if (this.collectTimer <= 0) {
      this.collectTimer = this.COLLECT_INTERVAL;
      this.tryCollectResources();
    }
  }

  private tryCollectResources(): void {
    const directions = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
      { x: 1, y: -1 },
      { x: -1, y: -1 }
    ];

    for (const dir of directions) {
      const checkX = this.position.x + dir.x;
      const checkY = this.position.y + dir.y;

      const tile = this.mapManager.getTile(checkX, checkY);
      if (!tile || tile.collected) continue;
      if (tile.type !== TileType.CRYSTAL && tile.type !== TileType.ORE) continue;

      const resourceType = this.mapManager.collectResource(checkX, checkY);
      if (resourceType) {
        if (resourceType === TileType.CRYSTAL) {
          this.resourceSystem.addCrystal();
        } else if (resourceType === TileType.ORE) {
          this.resourceSystem.addOre();
        }
        this.notifyCollect(resourceType, checkX, checkY);
      }
    }
  }

  private onTileEntered(): void {
    const tile = this.mapManager.getTile(this.position.x, this.position.y);
    if (!tile) return;

    if (tile.type === TileType.TRAP && !tile.trapTriggered) {
      if (this.mapManager.triggerTrap(this.position.x, this.position.y)) {
        this.resourceSystem.consumeHealth(2);
        this.notifyTrap(this.position.x, this.position.y);
      }
    }

    if (tile.type === TileType.EXIT) {
      this.resourceSystem.setVictory();
      this.notifyExit();
    }
  }

  private updateVisibility(): void {
    const map = this.mapManager.getMap();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        map[y][x].visible = false;
      }
    }

    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
      for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= VISION_RADIUS) {
          const vx = this.position.x + dx;
          const vy = this.position.y + dy;

          if (vx >= 0 && vx < MAP_WIDTH && vy >= 0 && vy < MAP_HEIGHT) {
            if (this.hasLineOfSight(this.position.x, this.position.y, vx, vy)) {
              map[vy][vx].visible = true;
              map[vy][vx].explored = true;
            }
          }
        }
      }
    }
  }

  private hasLineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      if (x === x1 && y === y1) return true;

      const tile = this.mapManager.getTile(x, y);
      if (tile && tile.type === TileType.WALL && !(x === x0 && y === y0)) {
        return false;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  getPosition(): Position {
    return { ...this.position };
  }

  getPixelPosition(): { x: number; y: number } {
    return { ...this.pixelPosition };
  }

  getBobOffset(): number {
    return this.bobOffset;
  }

  isPlayerMoving(): boolean {
    return this.isMoving;
  }

  onTrapTriggered(callback: TrapTriggeredCallback): void {
    this.trapCallbacks.push(callback);
  }

  onResourceCollected(callback: ResourceCollectedCallback): void {
    this.collectCallbacks.push(callback);
  }

  onPlayerMoved(callback: PlayerMovedCallback): void {
    this.moveCallbacks.push(callback);
  }

  onExitReached(callback: ExitReachedCallback): void {
    this.exitCallbacks.push(callback);
  }

  private notifyTrap(x: number, y: number): void {
    for (const callback of this.trapCallbacks) {
      callback(x, y);
    }
  }

  private notifyCollect(type: TileType, x: number, y: number): void {
    for (const callback of this.collectCallbacks) {
      callback(type, x, y);
    }
  }

  private notifyMove(): void {
    for (const callback of this.moveCallbacks) {
      callback(this.position.x, this.position.y);
    }
  }

  private notifyExit(): void {
    for (const callback of this.exitCallbacks) {
      callback();
    }
  }

  setMoveDirection(dx: number, dy: number): void {
    this.keys.clear();
    if (dx > 0) this.keys.add('d');
    if (dx < 0) this.keys.add('a');
    if (dy > 0) this.keys.add('s');
    if (dy < 0) this.keys.add('w');
  }

  clearMoveDirection(): void {
    this.keys.clear();
  }
}

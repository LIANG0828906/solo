import { Direction, PlayerState, TileType } from './types';
import { CONFIG } from './constants';
import { CollisionDetector } from './collision';
import { CaveMap } from './map';
import { clamp } from './utils';

export class Player {
  private state: PlayerState;
  private collision: CollisionDetector;
  private map: CaveMap;
  private heartFlashTimer: number = 0;
  private heartFlashCount: number = 0;

  constructor(startX: number, startY: number, collision: CollisionDetector, map: CaveMap) {
    this.collision = collision;
    this.map = map;
    this.state = {
      x: startX,
      y: startY,
      direction: Direction.DOWN,
      frame: 0,
      health: CONFIG.INITIAL_HEALTH,
      maxHealth: CONFIG.INITIAL_HEALTH,
      inventory: {
        copper: 0,
        silver: 0,
        gold: 0,
        diamond: 0
      },
      totalOres: 0,
      isMoving: false,
      moveCooldown: 0
    };
  }

  public update(deltaTime: number, keys: Set<string>): boolean {
    if (this.state.moveCooldown > 0) {
      this.state.moveCooldown -= deltaTime;
    }

    if (this.heartFlashTimer > 0) {
      this.heartFlashTimer -= deltaTime;
      if (this.heartFlashTimer <= 0) {
        this.heartFlashCount++;
        if (this.heartFlashCount < 6) {
          this.heartFlashTimer = 150;
        }
      }
    }

    if (this.state.moveCooldown <= 0) {
      const moved = this.handleMovement(keys);
      if (moved) {
        this.state.moveCooldown = 100;
        this.state.frame = (this.state.frame + 1) % 4;
        return true;
      }
    }

    return false;
  }

  private handleMovement(keys: Set<string>): boolean {
    let newX = this.state.x;
    let newY = this.state.y;
    let direction = this.state.direction;
    let moved = false;

    const step = CONFIG.MOVE_STEP;

    if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) {
      newY -= step;
      direction = Direction.UP;
      moved = true;
    } else if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) {
      newY += step;
      direction = Direction.DOWN;
      moved = true;
    } else if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) {
      newX -= step;
      direction = Direction.LEFT;
      moved = true;
    } else if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) {
      newX += step;
      direction = Direction.RIGHT;
      moved = true;
    }

    if (moved) {
      this.state.direction = direction;

      if (this.collision.canMoveTo(newX, newY, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE)) {
        this.state.x = newX;
        this.state.y = newY;
        this.state.isMoving = true;
      } else {
        const mining = this.collision.checkMining(newX, newY, CONFIG.PLAYER_SIZE, CONFIG.PLAYER_SIZE);
        if (mining) {
          this.mine(mining.x, mining.y);
          this.state.isMoving = true;
        } else {
          this.state.isMoving = false;
        }
      }
    } else {
      this.state.isMoving = false;
    }

    return moved;
  }

  private mine(x: number, y: number): TileType | null {
    const minedType = this.map.mineTile(x, y);
    
    if (minedType !== TileType.EMPTY && minedType !== TileType.WALL) {
      this.addToInventory(minedType);
      return minedType;
    }
    
    return null;
  }

  public attemptMineInDirection(): TileType | null {
    let checkX = this.state.x + CONFIG.PLAYER_SIZE / 2;
    let checkY = this.state.y + CONFIG.PLAYER_SIZE / 2;

    if (this.state.direction === Direction.UP) {
        checkY -= CONFIG.TILE_SIZE;
    } else if (this.state.direction === Direction.DOWN) {
        checkY += CONFIG.TILE_SIZE;
    } else if (this.state.direction === Direction.LEFT) {
        checkX -= CONFIG.TILE_SIZE;
    } else if (this.state.direction === Direction.RIGHT) {
        checkX += CONFIG.TILE_SIZE;
    }

    const tile = this.map.getTile(checkX, checkY);
    if (tile && tile.type !== TileType.EMPTY) {
      return this.mine(tile.x * CONFIG.TILE_SIZE, tile.y * CONFIG.TILE_SIZE);
    }

    return null;
  }

  private addToInventory(type: TileType): void {
    switch (type) {
      case TileType.COPPER:
        this.state.inventory.copper++;
        break;
      case TileType.SILVER:
        this.state.inventory.silver++;
        break;
      case TileType.GOLD:
        this.state.inventory.gold++;
        break;
      case TileType.DIAMOND:
        this.state.inventory.diamond++;
        break;
    }
    this.state.totalOres++;
  }

  public takeDamage(amount: number = 1): void {
    this.state.health = clamp(this.state.health - amount, 0, this.state.maxHealth);
    this.startHeartFlash();
  }

  private startHeartFlash(): void {
    this.heartFlashTimer = 150;
    this.heartFlashCount = 0;
  }

  public isHeartFlashing(): boolean {
    return this.heartFlashCount < 6 && this.heartFlashTimer > 0;
  }

  public getHeartFlashState(): boolean {
    return Math.floor(this.heartFlashTimer / 75) % 2 === 0;
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public getX(): number {
    return this.state.x;
  }

  public getY(): number {
    return this.state.y;
  }

  public getCenterX(): number {
    return this.state.x + CONFIG.PLAYER_SIZE / 2;
  }

  public getCenterY(): number {
    return this.state.y + CONFIG.PLAYER_SIZE / 2;
  }

  public getDirection(): Direction {
    return this.state.direction;
  }

  public getFrame(): number {
    return this.state.frame;
  }

  public getInventory(): PlayerState['inventory'] {
    return { ...this.state.inventory };
  }

  public getTotalOres(): number {
    return this.state.totalOres;
  }

  public getHealth(): number {
    return this.state.health;
  }

  public getMaxHealth(): number {
    return this.state.maxHealth;
  }

  public isAlive(): boolean {
    return this.state.health > 0;
  }

  public isFull(): boolean {
    return this.state.totalOres >= CONFIG.MAX_ORES;
  }

  public setPosition(x: number, y: number): void {
    this.state.x = x;
    this.state.y = y;
  }
}

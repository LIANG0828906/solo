import { GameMap, TILE_SIZE } from './Map';
import { Interactable, FloatingText, Chest, Teleport } from './Interactable';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MoveInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export class Player {
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 48;
  public speed: number = 3;
  public direction: Direction = 'down';
  public gold: number = 0;
  private animFrame: number = 0;
  private animTimer: number = 0;
  private isMoving: boolean = false;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public getCenterX(): number {
    return this.x + this.width / 2;
  }

  public getCenterY(): number {
    return this.y + this.height / 2;
  }

  public move(input: MoveInput, map: GameMap): void {
    let dx = 0;
    let dy = 0;

    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    this.isMoving = dx !== 0 || dy !== 0;

    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    const moveX = dx * this.speed;
    const moveY = dy * this.speed;

    if (dy < 0) this.direction = 'up';
    else if (dy > 0) this.direction = 'down';
    else if (dx < 0) this.direction = 'left';
    else if (dx > 0) this.direction = 'right';

    const newX = this.x + moveX;
    if (this.canMoveTo(newX, this.y, map)) {
      this.x = newX;
    } else {
      this.x = this.clampXToTile(this.x, moveX > 0);
    }

    const newY = this.y + moveY;
    if (this.canMoveTo(this.x, newY, map)) {
      this.y = newY;
    } else {
      this.y = this.clampYToTile(this.y, moveY > 0);
    }

    if (this.isMoving) {
      this.animTimer += 1;
      if (this.animTimer >= 8) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 4;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  private canMoveTo(x: number, y: number, map: GameMap): boolean {
    const left = x + 4;
    const right = x + this.width - 4;
    const top = y + 8;
    const bottom = y + this.height - 4;

    const leftTile = Math.floor(left / TILE_SIZE);
    const rightTile = Math.floor(right / TILE_SIZE);
    const topTile = Math.floor(top / TILE_SIZE);
    const bottomTile = Math.floor(bottom / TILE_SIZE);

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (map.isWall(tx, ty)) {
          return false;
        }
      }
    }
    return true;
  }

  private clampXToTile(currentX: number, movingRight: boolean): number {
    if (movingRight) {
      const tileX = Math.floor((currentX + this.width - 4) / TILE_SIZE);
      return tileX * TILE_SIZE - this.width + 4;
    } else {
      const tileX = Math.floor((currentX + 4) / TILE_SIZE) + 1;
      return tileX * TILE_SIZE - 4;
    }
  }

  private clampYToTile(currentY: number, movingDown: boolean): number {
    if (movingDown) {
      const tileY = Math.floor((currentY + this.height - 4) / TILE_SIZE);
      return tileY * TILE_SIZE - this.height + 4;
    } else {
      const tileY = Math.floor((currentY + 8) / TILE_SIZE) + 1;
      return tileY * TILE_SIZE - 8;
    }
  }

  public interact(interactables: Interactable[]): FloatingText | null {
    let nearest: Interactable | null = null;
    let nearestDist = Infinity;

    for (const item of interactables) {
      if (item.isInRange(this.getCenterX(), this.getCenterY())) {
        const dx = item.x - this.getCenterX();
        const dy = item.y - this.getCenterY();
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = item;
        }
      }
    }

    if (nearest) {
      const result = nearest.onInteract();
      if (nearest instanceof Chest) {
        const chest = nearest as Chest;
        if (!chest.isOpened()) {
          this.gold += chest.getGoldAmount();
        }
      }
      if (nearest instanceof Teleport && result !== null) {
        const tp = nearest as Teleport;
        this.x = tp.targetX - this.width / 2;
        this.y = tp.targetY - this.height / 2;
      }
      return result;
    }
    return null;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    ctx.fillStyle = '#2C3E50';
    const legOffset = this.isMoving ? (this.animFrame % 2 === 0 ? 0 : 2) : 0;
    ctx.fillRect(x + 6, y + 32, 8, 16 - legOffset);
    ctx.fillRect(x + 18, y + 32, 8, 16 + legOffset - 0);

    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(x + 4, y + 14, 24, 20);

    ctx.fillStyle = '#FAD7A0';
    ctx.fillRect(x + 8, y + 2, 16, 14);

    ctx.fillStyle = '#2C3E50';
    if (this.direction === 'up') {
    } else if (this.direction === 'down') {
      ctx.fillRect(x + 11, y + 7, 3, 3);
      ctx.fillRect(x + 18, y + 7, 3, 3);
    } else if (this.direction === 'left') {
      ctx.fillRect(x + 9, y + 7, 3, 3);
    } else if (this.direction === 'right') {
      ctx.fillRect(x + 20, y + 7, 3, 3);
    }

    ctx.fillStyle = '#34495E';
    if (this.direction === 'up') {
      ctx.fillRect(x + 6, y + 0, 20, 6);
    }
  }

  public reset(startX: number, startY: number): void {
    this.x = startX;
    this.y = startY;
    this.direction = 'down';
    this.gold = 0;
    this.animFrame = 0;
    this.animTimer = 0;
    this.isMoving = false;
  }
}

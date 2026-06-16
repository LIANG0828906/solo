import {
  GridElement,
  PlayerState,
  ElementType,
  GRID_SIZE,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  GRAVITY,
  MOVE_SPEED,
  JUMP_VELOCITY,
  FLASH_DURATION,
} from './types';

export class PhysicsWorld {
  private player: PlayerState;
  private elements: GridElement[] = [];
  private keys: Set<string> = new Set();
  private elapsedTime: number = 0;
  private isCompleted: boolean = false;
  private completionTime: number = 0;
  private spawnX: number = 64;
  private spawnY: number = 576;
  private platformPositions: Map<number, { x: number; y: number; vx: number }> = new Map();
  private onCompleteCallback?: (time: number) => void;

  constructor() {
    this.player = this.createPlayer();
  }

  private createPlayer(): PlayerState {
    return {
      x: this.spawnX,
      y: this.spawnY,
      vx: 0,
      vy: 0,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      isGrounded: false,
      isAlive: true,
      isFlashing: false,
      flashTimer: 0,
    };
  }

  setElements(elements: GridElement[]): void {
    this.elements = elements;
    this.platformPositions.clear();
    
    let platformIndex = 0;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type === ElementType.PLATFORM) {
        this.platformPositions.set(i, {
          x: elements[i].x * GRID_SIZE,
          y: elements[i].y * GRID_SIZE,
          vx: (elements[i].platformSpeed || 80) * (elements[i].platformDirection || 1),
        });
        platformIndex++;
      }
    }
  }

  setSpawn(x: number, y: number): void {
    this.spawnX = x;
    this.spawnY = y;
    this.resetPlayer();
  }

  resetPlayer(): void {
    this.player.x = this.spawnX;
    this.player.y = this.spawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.isAlive = true;
    this.player.isFlashing = false;
    this.player.flashTimer = 0;
    this.isCompleted = false;
    this.completionTime = 0;
    this.elapsedTime = 0;

    this.platformPositions.forEach((pos, index) => {
      const element = this.elements[index];
      if (element) {
        pos.x = element.x * GRID_SIZE;
        pos.y = element.y * GRID_SIZE;
      }
    });
  }

  keyDown(key: string): void {
    this.keys.add(key);
  }

  keyUp(key: string): void {
    this.keys.delete(key);
  }

  update(dt: number): void {
    if (this.isCompleted) return;

    this.elapsedTime += dt;

    if (this.player.isFlashing) {
      this.player.flashTimer -= dt;
      if (this.player.flashTimer <= 0) {
        this.player.isFlashing = false;
      }
    }

    if (!this.player.isAlive) {
      if (this.player.flashTimer <= 0) {
        this.resetPlayer();
      }
      return;
    }

    this.updatePlatforms(dt);
    this.handleInput();
    this.applyGravity(dt);
    this.movePlayer(dt);
    this.checkCollisions();
    this.checkGoals();
    this.checkOutOfBounds();
  }

  private updatePlatforms(dt: number): void {
    this.platformPositions.forEach((pos, index) => {
      const element = this.elements[index];
      if (!element || element.type !== ElementType.PLATFORM) return;

      const startX = (element.platformStartX || element.x) * GRID_SIZE;
      const endX = (element.platformEndX || element.x + 3) * GRID_SIZE;

      pos.x += pos.vx * dt;

      if (pos.x <= startX) {
        pos.x = startX;
        pos.vx = Math.abs(pos.vx);
      } else if (pos.x >= endX) {
        pos.x = endX;
        pos.vx = -Math.abs(pos.vx);
      }
    });
  }

  private handleInput(): void {
    let moveX = 0;

    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
      moveX -= 1;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
      moveX += 1;
    }

    this.player.vx = moveX * MOVE_SPEED;

    if ((this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW')) && this.player.isGrounded) {
      this.player.vy = -JUMP_VELOCITY;
      this.player.isGrounded = false;
    }
  }

  private applyGravity(dt: number): void {
    this.player.vy += GRAVITY * dt;
  }

  private movePlayer(dt: number): void {
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
  }

  private checkCollisions(): void {
    this.player.isGrounded = false;

    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i];
      
      if (element.type === ElementType.BRICK) {
        this.checkBrickCollision(element);
      } else if (element.type === ElementType.PLATFORM) {
        const pos = this.platformPositions.get(i);
        if (pos) {
          this.checkPlatformCollision(element, pos);
        }
      } else if (element.type === ElementType.SPIKE) {
        if (this.checkSpikeCollision(element)) {
          this.killPlayer();
          return;
        }
      }
    }
  }

  private checkBrickCollision(element: GridElement): void {
    const brickX = element.x * GRID_SIZE;
    const brickY = element.y * GRID_SIZE;
    const brickW = GRID_SIZE;
    const brickH = GRID_SIZE;

    if (this.rectIntersects(this.player.x, this.player.y, this.player.width, this.player.height, brickX, brickY, brickW, brickH)) {
      const overlapLeft = (this.player.x + this.player.width) - brickX;
      const overlapRight = (brickX + brickW) - this.player.x;
      const overlapTop = (this.player.y + this.player.height) - brickY;
      const overlapBottom = (brickY + brickH) - this.player.y;

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        if (overlapLeft < overlapRight) {
          this.player.x = brickX - this.player.width;
        } else {
          this.player.x = brickX + brickW;
        }
        this.player.vx = 0;
      } else {
        if (overlapTop < overlapBottom) {
          this.player.y = brickY - this.player.height;
          this.player.vy = 0;
          this.player.isGrounded = true;
        } else {
          this.player.y = brickY + brickH;
          this.player.vy = 0;
        }
      }
    }
  }

  private checkPlatformCollision(element: GridElement, pos: { x: number; y: number; vx: number }): void {
    const platWidth = (element.platformEndX! - element.platformStartX! + 1) * GRID_SIZE;
    const platHeight = 12;
    const platY = pos.y + (GRID_SIZE - platHeight) / 2;

    if (this.player.vy >= 0 &&
        this.player.x + this.player.width > pos.x + 2 &&
        this.player.x < pos.x + platWidth - 2 &&
        this.player.y + this.player.height >= platY &&
        this.player.y + this.player.height <= platY + platHeight + this.player.vy * 0.02) {
      
      this.player.y = platY - this.player.height;
      this.player.vy = 0;
      this.player.isGrounded = true;
      this.player.x += pos.vx * 0.016;
    }
  }

  private checkSpikeCollision(element: GridElement): boolean {
    const spikeX = element.x * GRID_SIZE + 6;
    const spikeY = element.y * GRID_SIZE + 8;
    const spikeW = GRID_SIZE - 12;
    const spikeH = GRID_SIZE - 12;

    return this.rectIntersects(
      this.player.x + 2, this.player.y + 2,
      this.player.width - 4, this.player.height - 4,
      spikeX, spikeY, spikeW, spikeH
    );
  }

  private checkGoals(): void {
    for (const element of this.elements) {
      if (element.type !== ElementType.GOAL) continue;

      const goalX = element.x * GRID_SIZE + GRID_SIZE / 2 - 8;
      const goalY = element.y * GRID_SIZE + 4;
      const goalW = 16;
      const goalH = GRID_SIZE - 8;

      if (this.rectIntersects(
        this.player.x, this.player.y, this.player.width, this.player.height,
        goalX, goalY, goalW, goalH
      )) {
        this.completeLevel();
        return;
      }
    }
  }

  private checkOutOfBounds(): void {
    if (this.player.y > 1000) {
      this.killPlayer();
    }
  }

  private killPlayer(): void {
    if (!this.player.isAlive) return;
    this.player.isAlive = false;
    this.player.isFlashing = true;
    this.player.flashTimer = FLASH_DURATION;
    this.player.vx = 0;
    this.player.vy = 0;
  }

  private completeLevel(): void {
    this.isCompleted = true;
    this.completionTime = this.elapsedTime;
    if (this.onCompleteCallback) {
      this.onCompleteCallback(this.completionTime);
    }
  }

  private rectIntersects(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  getPlayer(): PlayerState {
    return { ...this.player };
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  getIsCompleted(): boolean {
    return this.isCompleted;
  }

  getCompletionTime(): number {
    return this.completionTime;
  }

  getPlatformPositions(): Map<number, { x: number; y: number }> {
    const result = new Map<number, { x: number; y: number }>();
    this.platformPositions.forEach((pos, index) => {
      result.set(index, { x: pos.x, y: pos.y });
    });
    return result;
  }

  onComplete(callback: (time: number) => void): void {
    this.onCompleteCallback = callback;
  }
}

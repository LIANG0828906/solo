import { TILE_SIZE } from './map';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerState {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  moving: boolean;
  direction: Direction;
}

export class Player {
  readonly speed = 2;

  private state: PlayerState;
  private targetGridX: number;
  private targetGridY: number;
  private startX: number;
  private startY: number;
  private pressedKeys: Set<string> = new Set();

  constructor(startX: number, startY: number) {
    this.startX = startX;
    this.startY = startY;
    this.state = {
      x: startX * TILE_SIZE,
      y: startY * TILE_SIZE,
      gridX: startX,
      gridY: startY,
      moving: false,
      direction: 'down',
    };
    this.targetGridX = startX;
    this.targetGridY = startY;
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      this.pressedKeys.add(e.key);
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.key);
  }

  update(isWall: (x: number, y: number) => boolean): void {
    if (!this.state.moving) {
      this.tryStartMove(isWall);
    }

    if (this.state.moving) {
      this.continueMove();
    }
  }

  private tryStartMove(isWall: (x: number, y: number) => boolean): void {
    let newTargetX = this.state.gridX;
    let newTargetY = this.state.gridY;
    let direction: Direction | null = null;

    if (this.pressedKeys.has('ArrowUp')) {
      newTargetY = this.state.gridY - 1;
      direction = 'up';
    } else if (this.pressedKeys.has('ArrowDown')) {
      newTargetY = this.state.gridY + 1;
      direction = 'down';
    } else if (this.pressedKeys.has('ArrowLeft')) {
      newTargetX = this.state.gridX - 1;
      direction = 'left';
    } else if (this.pressedKeys.has('ArrowRight')) {
      newTargetX = this.state.gridX + 1;
      direction = 'right';
    }

    if (direction && !isWall(newTargetX, newTargetY)) {
      this.targetGridX = newTargetX;
      this.targetGridY = newTargetY;
      this.state.direction = direction;
      this.state.moving = true;
    }
  }

  private continueMove(): void {
    const targetX = this.targetGridX * TILE_SIZE;
    const targetY = this.targetGridY * TILE_SIZE;

    let reachedTarget = true;

    if (this.state.x < targetX) {
      this.state.x = Math.min(this.state.x + this.speed, targetX);
      reachedTarget = this.state.x >= targetX;
    } else if (this.state.x > targetX) {
      this.state.x = Math.max(this.state.x - this.speed, targetX);
      reachedTarget = this.state.x <= targetX;
    }

    if (this.state.y < targetY) {
      this.state.y = Math.min(this.state.y + this.speed, targetY);
      reachedTarget = reachedTarget && this.state.y >= targetY;
    } else if (this.state.y > targetY) {
      this.state.y = Math.max(this.state.y - this.speed, targetY);
      reachedTarget = reachedTarget && this.state.y <= targetY;
    }

    if (reachedTarget) {
      this.state.x = targetX;
      this.state.y = targetY;
      this.state.gridX = this.targetGridX;
      this.state.gridY = this.targetGridY;
      this.state.moving = false;
    }
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  getGridPosition(): { x: number; y: number } {
    return { x: this.state.gridX, y: this.state.gridY };
  }

  setPosition(gridX: number, gridY: number): void {
    this.state.gridX = gridX;
    this.state.gridY = gridY;
    this.state.x = gridX * TILE_SIZE;
    this.state.y = gridY * TILE_SIZE;
    this.targetGridX = gridX;
    this.targetGridY = gridY;
    this.state.moving = false;
  }

  reset(): void {
    this.setPosition(this.startX, this.startY);
    this.state.direction = 'down';
    this.pressedKeys.clear();
  }
}

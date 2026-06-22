import type { GridCell, GameObject, PlayerState } from '../store/gameStore';
import { CELL_SIZE, GRID_COLS, GRID_ROWS, PLAYER_SIZE } from '../store/gameStore';

const GRAVITY = 0.5;
const MOVE_SPEED = 3;
const JUMP_FORCE = -10;
const MAX_FALL_SPEED = 12;

interface Keys {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class PhysicsEngine {
  private keys: Keys = { left: false, right: false, jump: false };
  private grid: GridCell[][] = [];
  private objects: GameObject[] = [];
  private player: PlayerState;
  private animationId: number | null = null;
  private onUpdate: (player: PlayerState) => void;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  constructor(
    initialPlayer: PlayerState,
    onUpdate: (player: PlayerState) => void
  ) {
    this.player = { ...initialPlayer };
    this.onUpdate = onUpdate;
    this.setupKeyListeners();
  }

  private setupKeyListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning) return;
    switch (e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.keys.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = true;
        break;
      case 'w':
      case 'arrowup':
      case ' ':
        e.preventDefault();
        this.keys.jump = true;
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.keys.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = false;
        break;
      case 'w':
      case 'arrowup':
      case ' ':
        this.keys.jump = false;
        break;
    }
  };

  public setLevel(grid: GridCell[][], objects: GameObject[]): void {
    this.grid = grid;
    this.objects = objects;
  }

  public setPlayer(player: PlayerState): void {
    this.player = { ...player };
  }

  private checkGridCollision(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const startCol = Math.floor(x / CELL_SIZE);
    const endCol = Math.floor((x + width - 1) / CELL_SIZE);
    const startRow = Math.floor(y / CELL_SIZE);
    const endRow = Math.floor((y + height - 1) / CELL_SIZE);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (
          row >= 0 &&
          row < GRID_ROWS &&
          col >= 0 &&
          col < GRID_COLS &&
          this.grid[row]?.[col]?.filled
        ) {
          return true;
        }
      }
    }
    return false;
  }

  private checkSpikeCollision(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    for (const obj of this.objects) {
      if (obj.type !== 'spike') continue;

      const spikeX = obj.gridX * CELL_SIZE + 6;
      const spikeY = obj.gridY * CELL_SIZE + 6;
      const spikeW = CELL_SIZE - 12;
      const spikeH = CELL_SIZE - 12;

      if (
        x < spikeX + spikeW &&
        x + width > spikeX &&
        y < spikeY + spikeH &&
        y + height > spikeY
      ) {
        return true;
      }
    }
    return false;
  }

  private checkCoinCollection(
    x: number,
    y: number,
    width: number,
    height: number
  ): string[] {
    const collected: string[] = [];
    for (const obj of this.objects) {
      if (obj.type !== 'coin') continue;

      const coinX = obj.gridX * CELL_SIZE + CELL_SIZE / 2 - 12;
      const coinY = obj.gridY * CELL_SIZE + CELL_SIZE / 2 - 12;

      if (
        x < coinX + 24 &&
        x + width > coinX &&
        y < coinY + 24 &&
        y + height > coinY
      ) {
        collected.push(obj.id);
      }
    }
    return collected;
  }

  private update(deltaTime: number): void {
    if (deltaTime > 0.05) deltaTime = 0.016;

    let { x, y, vx, vy, width, height, onGround } = this.player;

    if (this.keys.left) {
      vx = -MOVE_SPEED;
    } else if (this.keys.right) {
      vx = MOVE_SPEED;
    } else {
      vx = 0;
    }

    if (this.keys.jump && onGround) {
      vy = JUMP_FORCE;
      onGround = false;
    }

    vy += GRAVITY;
    if (vy > MAX_FALL_SPEED) vy = MAX_FALL_SPEED;

    const nextX = x + vx;
    if (!this.checkGridCollision(nextX, y, width, height)) {
      x = nextX;
    }

    const nextY = y + vy;
    if (!this.checkGridCollision(x, nextY, width, height)) {
      y = nextY;
      onGround = false;
    } else {
      if (vy > 0) {
        onGround = true;
        y = Math.floor((y + height) / CELL_SIZE) * CELL_SIZE - height;
      } else {
        y = Math.ceil(y / CELL_SIZE) * CELL_SIZE;
      }
      vy = 0;
    }

    if (x < 0) x = 0;
    if (x + width > GRID_COLS * CELL_SIZE) x = GRID_COLS * CELL_SIZE - width;
    if (y > GRID_ROWS * CELL_SIZE) {
      this.resetPlayer();
      return;
    }

    if (this.checkSpikeCollision(x, y, width, height)) {
      this.resetPlayer();
      return;
    }

    const collectedCoins = this.checkCoinCollection(x, y, width, height);
    if (collectedCoins.length > 0) {
      this.objects = this.objects.filter((o) => !collectedCoins.includes(o.id));
      const event = new CustomEvent('coins-collected', {
        detail: { ids: collectedCoins },
      });
      window.dispatchEvent(event);
    }

    this.player = { x, y, vx, vy, width, height, onGround };
    this.onUpdate(this.player);
  }

  private gameLoop = (timestamp: number): void => {
    if (!this.isRunning) return;

    if (this.lastTime === 0) {
      this.lastTime = timestamp;
    }

    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(deltaTime);

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = 0;
    this.keys = { left: false, right: false, jump: false };
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.keys = { left: false, right: false, jump: false };
  }

  private resetPlayer(): void {
    const spawn = this.objects.find((o) => o.type === 'spawn');
    if (spawn) {
      const px = spawn.gridX * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE) / 2;
      const py = spawn.gridY * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE);
      this.player = {
        x: px,
        y: py,
        vx: 0,
        vy: 0,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        onGround: false,
      };
      this.onUpdate(this.player);
    }
  }

  public getObjects(): GameObject[] {
    return this.objects;
  }

  public destroy(): void {
    this.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

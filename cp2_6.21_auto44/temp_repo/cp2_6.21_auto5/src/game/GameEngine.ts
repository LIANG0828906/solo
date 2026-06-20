import type { Track, Cell, CellType, PlayerState, Skin } from '../types';
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  COLOR_EMPTY,
  COLOR_OBSTACLE,
  COLOR_SPEED_BOOST,
  COLOR_JUMP_PLATFORM,
  COLOR_PLAYER_BODY,
  COLOR_PLAYER_JOINT,
} from '../types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private track: Track;
  private skin: Skin;
  private player: PlayerState;
  private gameTime: number;
  private isRunning: boolean;
  private animFrameId: number;
  private lastTimestamp: number;
  private spacePressed: boolean;
  private onFinish: (time: number) => void;
  private scrollOffset: number;
  private readonly GRID_HEIGHT_PX: number;
  private readonly PHYSICS_GRAVITY = 0.6;
  private readonly PHYSICS_JUMP_FORCE = -12;
  private readonly PHYSICS_MAX_JUMP_FORCE = -20;
  private readonly BASE_SPEED = 3;

  constructor(
    canvas: HTMLCanvasElement,
    track: Track,
    skin: Skin,
    onFinish: (time: number) => void,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.track = track;
    this.skin = skin;
    this.onFinish = onFinish;
    this.GRID_HEIGHT_PX = GRID_HEIGHT * CELL_SIZE;

    canvas.width = window.innerWidth;
    canvas.height = this.GRID_HEIGHT_PX;

    this.player = this.createInitialPlayerState();
    this.gameTime = 0;
    this.isRunning = false;
    this.animFrameId = 0;
    this.lastTimestamp = 0;
    this.spacePressed = false;
    this.scrollOffset = 0;
  }

  private createInitialPlayerState(): PlayerState {
    return {
      x: 1 * CELL_SIZE,
      y: (GRID_HEIGHT - 2) * CELL_SIZE,
      vy: 0,
      speed: this.BASE_SPEED,
      isJumping: false,
      jumpHoldTime: 0,
      isOnGround: true,
      isFinished: false,
      trail: [],
    };
  }

  start(): void {
    this.player = this.createInitialPlayerState();
    this.gameTime = 0;
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.scrollOffset = 0;
    this.animFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.player.isOnGround && !this.spacePressed) {
        this.player.isJumping = true;
        this.player.jumpHoldTime = 0;
      }
      if (this.player.isJumping) {
        this.player.jumpHoldTime++;
      }
      this.spacePressed = true;
    }
  }

  handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      if (this.player.isJumping) {
        const force = Math.max(
          this.PHYSICS_JUMP_FORCE + this.player.jumpHoldTime * -0.5,
          this.PHYSICS_MAX_JUMP_FORCE,
        );
        this.player.vy = force;
        this.player.isOnGround = false;
      }
      this.player.isJumping = false;
      this.player.jumpHoldTime = 0;
      this.spacePressed = false;
    }
  }

  setSkin(skin: Skin): void {
    this.skin = skin;
  }

  private gameLoop(timestamp: number): void {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    let delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (delta > 100) {
      delta = 16;
    }

    if (this.isRunning) {
      this.updatePhysics(delta);
      this.gameTime += delta;
    }

    this.render();
    this.animFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  private updatePhysics(delta: number): void {
    if (this.player.isFinished) return;

    const dtFactor = delta / 16;

    this.player.x += this.player.speed * dtFactor;

    this.player.vy += this.PHYSICS_GRAVITY * dtFactor;
    this.player.y += this.player.vy * dtFactor;

    this.scrollOffset = Math.max(0, this.player.x - this.canvas.width * 0.3);

    const gridX = Math.floor(this.player.x / CELL_SIZE);
    const gridY = Math.floor(this.player.y / CELL_SIZE);

    for (let gx = gridX - 1; gx <= gridX + 1; gx++) {
      for (let gy = gridY - 1; gy <= gridY + 1; gy++) {
        const cell = this.getCellAt(gx, gy);
        if (!cell || cell.type === 'empty') continue;

        const cellLeft = gx * CELL_SIZE;
        const cellTop = gy * CELL_SIZE;
        const cellRight = cellLeft + CELL_SIZE;
        const cellBottom = cellTop + CELL_SIZE;

        const playerLeft = this.player.x;
        const playerTop = this.player.y;
        const playerRight = playerLeft + 14;
        const playerBottom = playerTop + 24;

        const overlaps =
          playerRight > cellLeft &&
          playerLeft < cellRight &&
          playerBottom > cellTop &&
          playerTop < cellBottom;

        if (!overlaps) continue;

        switch (cell.type) {
          case 'obstacle': {
            const obstacleTop = cellTop;
            if (this.player.y + 24 <= obstacleTop + 4) {
              this.player.y = obstacleTop - 24;
              this.player.vy = 0;
              this.player.isOnGround = true;
            } else {
              this.player.x = cellLeft - 14;
              this.player.speed = this.BASE_SPEED;
            }
            break;
          }
          case 'speed_boost': {
            this.player.speed = Math.min(
              this.player.speed + cell.multiplier * 0.1 * dtFactor,
              this.BASE_SPEED * 3,
            );
            break;
          }
          case 'jump_platform': {
            this.player.vy = this.PHYSICS_JUMP_FORCE * 0.8;
            this.player.isOnGround = false;
            break;
          }
        }
      }
    }

    const groundY = (GRID_HEIGHT - 2) * CELL_SIZE;
    if (this.player.y >= groundY) {
      this.player.y = groundY;
      this.player.vy = 0;
      this.player.isOnGround = true;
    }

    if (this.player.isOnGround && !this.player.isJumping) {
      this.player.speed += (this.BASE_SPEED - this.player.speed) * 0.02 * dtFactor;
    }

    this.player.trail.push({
      x: this.player.x,
      y: this.player.y,
      alpha: 0.6,
    });
    for (let i = this.player.trail.length - 1; i >= 0; i--) {
      this.player.trail[i].alpha -= 0.03 * dtFactor;
      if (this.player.trail[i].alpha < 0.01) {
        this.player.trail.splice(i, 1);
      }
    }

    if (this.player.x > GRID_WIDTH * CELL_SIZE) {
      this.player.isFinished = true;
      this.isRunning = false;
      this.onFinish(this.gameTime);
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#0a0f24';
    ctx.fillRect(0, 0, w, h);

    const startCol = Math.floor(this.scrollOffset / CELL_SIZE);
    const endCol = Math.ceil((this.scrollOffset + w) / CELL_SIZE) + 1;

    ctx.strokeStyle = '#111633';
    ctx.lineWidth = 0.5;
    for (let gx = startCol; gx <= endCol; gx++) {
      const sx = gx * CELL_SIZE - this.scrollOffset;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < GRID_HEIGHT; gy++) {
      const sy = gy * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }

    for (let gx = startCol; gx <= endCol; gx++) {
      for (let gy = 0; gy < GRID_HEIGHT; gy++) {
        const cell = this.getCellAt(gx, gy);
        if (!cell || cell.type === 'empty') continue;
        const sx = gx * CELL_SIZE - this.scrollOffset;
        const sy = gy * CELL_SIZE;
        switch (cell.type) {
          case 'obstacle':
            this.drawObstacle(ctx, sx, sy, cell);
            break;
          case 'speed_boost':
            this.drawSpeedBoost(ctx, sx, sy, cell);
            break;
          case 'jump_platform':
            this.drawJumpPlatform(ctx, sx, sy, cell);
            break;
        }
      }
    }

    const startLineX = 1 * CELL_SIZE - this.scrollOffset;
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(startLineX, 0);
    ctx.lineTo(startLineX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    const finishLineX = GRID_WIDTH * CELL_SIZE - this.scrollOffset;
    ctx.strokeStyle = '#ff006e';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(finishLineX, 0);
    ctx.lineTo(finishLineX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const t of this.player.trail) {
      const tx = t.x - this.scrollOffset;
      const ty = t.y;
      ctx.globalAlpha = t.alpha * 0.4;
      ctx.fillStyle = this.skin.bodyColor;
      ctx.fillRect(tx + 1, ty + 4, 12, 20);
      ctx.beginPath();
      ctx.arc(tx + 7, ty + 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawPlayer(ctx);

    this.drawHUD(ctx, w);
  }

  private getCellAt(gridX: number, gridY: number): Cell | null {
    if (gridY < 0 || gridY >= this.track.cells.length) return null;
    const row = this.track.cells[gridY];
    if (gridX < 0 || gridX >= row.length) return null;
    return row[gridX];
  }

  private drawObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, cell: Cell): void {
    const h = (cell.height || 1) * CELL_SIZE;
    const oy = y + CELL_SIZE - h;
    ctx.fillStyle = COLOR_OBSTACLE;
    ctx.fillRect(x + 1, oy, CELL_SIZE - 2, h);
    ctx.strokeStyle = '#ff3388';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, oy, CELL_SIZE - 2, h);
    ctx.fillStyle = '#ff99bb';
    ctx.fillRect(x + 3, oy + 2, 4, 2);
    ctx.fillRect(x + CELL_SIZE - 8, oy + 2, 4, 2);
  }

  private drawSpeedBoost(ctx: CanvasRenderingContext2D, x: number, y: number, _cell: Cell): void {
    const cx = x + CELL_SIZE / 2;
    const cy = y + CELL_SIZE / 2;
    const half = CELL_SIZE / 2 - 3;
    const grad = ctx.createLinearGradient(cx - half, cy - half, cx + half, cy + half);
    grad.addColorStop(0, '#00f5d4');
    grad.addColorStop(1, '#0077b6');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - half);
    ctx.lineTo(cx + half, cy);
    ctx.lineTo(cx, cy + half);
    ctx.lineTo(cx - half, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawJumpPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, _cell: Cell): void {
    const topW = CELL_SIZE - 6;
    const botW = CELL_SIZE;
    const topY = y + 4;
    const botY = y + CELL_SIZE - 2;
    const cx = x + CELL_SIZE / 2;
    ctx.fillStyle = COLOR_JUMP_PLATFORM;
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, topY);
    ctx.lineTo(cx + topW / 2, topY);
    ctx.lineTo(cx + botW / 2, botY);
    ctx.lineTo(cx - botW / 2, botY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const px = this.player.x - this.scrollOffset;
    const py = this.player.y;
    const bodyColor = this.skin.bodyColor;

    const legPhase = this.player.isOnGround
      ? Math.sin(this.player.x * 0.3) * 4
      : 3;

    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + 1, py + 8, 12, 14);

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(px + 7, py + 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLOR_PLAYER_JOINT;
    ctx.beginPath();
    ctx.arc(px + 2, py + 14, 2, 0, Math.PI * 2);
    ctx.arc(px + 12, py + 14, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 3, py + 22);
    ctx.lineTo(px + 3, py + 22 + legPhase);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + 11, py + 22);
    ctx.lineTo(px + 11, py + 22 - legPhase);
    ctx.stroke();

    ctx.fillStyle = COLOR_PLAYER_JOINT;
    ctx.beginPath();
    ctx.arc(px + 3, py + 22 + legPhase, 2, 0, Math.PI * 2);
    ctx.arc(px + 11, py + 22 - legPhase, 2, 0, Math.PI * 2);
    ctx.fill();

    switch (this.skin.accessory) {
      case 'glasses':
        this.drawGlasses(ctx, px, py);
        break;
      case 'helmet':
        this.drawHelmet(ctx, px, py, bodyColor);
        break;
      case 'cape':
        this.drawCape(ctx, px, py, bodyColor);
        break;
    }
  }

  private drawGlasses(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = '#00ffff';
    const style = this.skin.accessoryStyle;
    if (style === 1) {
      ctx.fillRect(px + 3, py + 3, 4, 2);
      ctx.fillRect(px + 9, py + 3, 4, 2);
    } else if (style === 2) {
      ctx.fillStyle = '#ff006e';
      ctx.fillRect(px + 3, py + 3, 4, 2);
      ctx.fillRect(px + 9, py + 3, 4, 2);
    } else {
      ctx.fillStyle = '#ffbe0b';
      ctx.fillRect(px + 3, py + 3, 5, 2);
      ctx.fillRect(px + 9, py + 3, 5, 2);
    }
    ctx.fillStyle = '#888';
    ctx.fillRect(px + 7, py + 3, 2, 1);
  }

  private drawHelmet(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    bodyColor: string,
  ): void {
    const style = this.skin.accessoryStyle;
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (style === 1) {
      ctx.arc(px + 7, py + 4, 7, Math.PI, 0);
    } else if (style === 2) {
      ctx.arc(px + 7, py + 4, 7, Math.PI, Math.PI * 0.2, true);
    } else {
      ctx.arc(px + 7, py + 4, 7, Math.PI, Math.PI * -0.1);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(px + 7, py + 4, 7, Math.PI, 0);
    ctx.fill();
  }

  private drawCape(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    bodyColor: string,
  ): void {
    const style = this.skin.accessoryStyle;
    const wave = Math.sin(this.player.x * 0.15) * 3;
    ctx.fillStyle = bodyColor;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    if (style === 1) {
      ctx.moveTo(px + 1, py + 8);
      ctx.quadraticCurveTo(px - 8 + wave, py + 16, px - 4 + wave, py + 24);
      ctx.lineTo(px + 1, py + 22);
    } else if (style === 2) {
      ctx.moveTo(px + 1, py + 8);
      ctx.quadraticCurveTo(px - 12 + wave, py + 14, px - 6 + wave, py + 26);
      ctx.lineTo(px + 1, py + 22);
    } else {
      ctx.moveTo(px + 1, py + 8);
      ctx.quadraticCurveTo(px - 6 + wave, py + 12, px - 10 + wave, py + 28);
      ctx.lineTo(px + 1, py + 22);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawHUD(ctx: CanvasRenderingContext2D, w: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 36, 0.7)';
    ctx.fillRect(w - 180, 8, 172, 48);
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(w - 180, 8, 172, 48);

    ctx.fillStyle = '#00f5d4';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    const timeStr = (this.gameTime / 1000).toFixed(2) + 's';
    ctx.fillText(`TIME  ${timeStr}`, w - 16, 28);
    const speedStr = (this.player.speed * 2).toFixed(1) + ' m/s';
    ctx.fillText(`SPEED ${speedStr}`, w - 16, 48);
    ctx.restore();
  }
}

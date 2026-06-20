import { Level, LevelElement, Rect, rectsOverlap } from './level';
import { Player } from './player';
import { Enemy } from './enemy';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from './editor';

export type GameState = 'playing' | 'paused' | 'win' | 'lose';

export interface DebugInfo {
  fps: number;
  elapsed: number;
  player: Player;
  state: GameState;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  cameraX: number = 0;
  cameraY: number = 0;
  private readonly cameraSmooth: number = 0.12;
  private fpsHistory: number[] = [];
  private lastFrameTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
  }

  updateCamera(targetX: number, targetY: number, dt: number): void {
    const viewCenterX = targetX - CANVAS_WIDTH / 2;
    const viewCenterY = targetY - CANVAS_HEIGHT / 2;

    this.cameraX += (viewCenterX - this.cameraX) * this.cameraSmooth * Math.min(1, dt * 60);
    this.cameraY += (viewCenterY - this.cameraY) * this.cameraSmooth * Math.min(1, dt * 60);

    this.cameraX = Math.max(0, this.cameraX);
    this.cameraY = Math.max(0, this.cameraY);
  }

  resetCamera(): void {
    this.cameraX = 0;
    this.cameraY = 0;
  }

  beginFrame(now: number): number {
    const dt = this.lastFrameTime ? (now - this.lastFrameTime) / 1000 : 1 / 60;
    this.lastFrameTime = now;

    const currentFps = 1 / Math.max(dt, 0.0001);
    this.fpsHistory.push(currentFps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();

    const ctx = this.ctx;
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBackground();

    ctx.save();
    ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));

    return Math.min(dt, 1 / 30);
  }

  endFrame(): void {
    this.ctx.restore();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const parallaxX = this.cameraX * 0.3;

    ctx.fillStyle = '#a8d8ea';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 280 - parallaxX) % (CANVAS_WIDTH + 200) + CANVAS_WIDTH + 200) % (CANVAS_WIDTH + 200) - 100;
      const cy = 100 + (i % 2) * 40;
      this.drawCloud(cx, cy, 40 + (i % 3) * 15);
    }
  }

  private drawCloud(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y + 4, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x - size * 0.6, y + 6, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.4, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLevel(level: Level): void {
    const ctx = this.ctx;
    for (const el of level.elements) {
      this.drawLevelElement(ctx, el);
    }
  }

  private drawLevelElement(ctx: CanvasRenderingContext2D, el: LevelElement): void {
    switch (el.type) {
      case 'ground':
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.fillStyle = '#5fa04a';
        ctx.fillRect(el.x, el.y, el.width, Math.min(8, el.height));
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        for (let i = 0; i < el.width; i += 16) {
          ctx.fillRect(el.x + i, el.y + 10 + ((i / 16) % 2) * 6, 8, 4);
        }
        ctx.strokeStyle = '#6b4420';
        ctx.lineWidth = 1;
        ctx.strokeRect(el.x + 0.5, el.y + 0.5, el.width - 1, el.height - 1);
        break;

      case 'platform':
        const grad = ctx.createLinearGradient(el.x, el.y, el.x, el.y + el.height);
        grad.addColorStop(0, '#6abf55');
        grad.addColorStop(1, '#4a8c3f');
        ctx.fillStyle = grad;
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeStyle = '#356828';
        ctx.lineWidth = 1;
        ctx.strokeRect(el.x + 0.5, el.y + 0.5, el.width - 1, el.height - 1);
        break;

      case 'spike':
        const count = Math.max(1, Math.floor(el.width / 16));
        const spikeW = el.width / count;
        for (let i = 0; i < count; i++) {
          ctx.fillStyle = '#d94a4a';
          ctx.beginPath();
          ctx.moveTo(el.x + i * spikeW, el.y + el.height);
          ctx.lineTo(el.x + i * spikeW + spikeW / 2, el.y);
          ctx.lineTo(el.x + (i + 1) * spikeW, el.y + el.height);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#a03030';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        break;

      case 'flag':
        ctx.fillStyle = '#555';
        ctx.fillRect(el.x + el.width / 2 - 2, el.y, 4, el.height);
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(el.x + el.width / 2 + 2, el.y + 4);
        ctx.lineTo(el.x + el.width / 2 + 22, el.y + 12);
        ctx.lineTo(el.x + el.width / 2 + 2, el.y + 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#cc9900';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
    }
  }

  drawPlayer(player: Player, showCollisionBox: boolean = true): void {
    player.draw(this.ctx);
    if (showCollisionBox) player.drawCollisionBox(this.ctx);
  }

  drawEnemies(enemies: Enemy[], showCollisionBox: boolean = true): void {
    for (const e of enemies) {
      e.draw(this.ctx);
      if (showCollisionBox) e.drawCollisionBox(this.ctx);
    }
  }

  drawGridOverlay(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    const startX = Math.floor(this.cameraX / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor(this.cameraY / GRID_SIZE) * GRID_SIZE;

    for (let x = startX; x < this.cameraX + CANVAS_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, this.cameraY);
      ctx.lineTo(x + 0.5, this.cameraY + CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = startY; y < this.cameraY + CANVAS_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(this.cameraX, y + 0.5);
      ctx.lineTo(this.cameraX + CANVAS_WIDTH, y + 0.5);
      ctx.stroke();
    }
  }

  getAverageFps(): number {
    if (this.fpsHistory.length === 0) return 60;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsHistory.length);
  }
}

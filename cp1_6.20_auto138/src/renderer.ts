import type { CharacterState, TerrainBlock, TerrainType } from './types';
import { TILE_SIZE } from './types';

interface RenderConfig {
  width: number;
  height: number;
  gridSize: number;
}

const COLORS: Record<TerrainType, string> = {
  ground: '#555555',
  slope: '#27ae60',
  step: '#888888',
  moving: '#2980b9',
  oneway: 'rgba(41,128,185,0.5)'
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private trail: { x: number; y: number; alpha: number }[] = [];
  private frameCount = 0;
  private lastFpsTime = 0;
  private fps = 60;

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.config = config;
  }

  render(
    terrains: TerrainBlock[],
    character: CharacterState,
    selectedTool: TerrainType,
    mouseX: number | null,
    mouseY: number | null,
    isDragging: boolean
  ): void {
    const ctx = this.ctx;
    this.updateFPS();

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    this.drawGrid();

    for (const t of terrains) {
      this.drawTerrain(t);
    }

    if (mouseX !== null && mouseY !== null && !isDragging) {
      this.drawPreview(selectedTool, mouseX, mouseY);
    }

    this.drawCharacter(character);
    this.drawUI(character);
    this.frameCount++;
  }

  private updateFPS(): void {
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    const size = this.config.gridSize;

    for (let x = 0; x <= this.config.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, this.config.height);
      ctx.stroke();
    }
    for (let y = 0; y <= this.config.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(this.config.width, y + 0.5);
      ctx.stroke();
    }
  }

  private drawTerrain(t: TerrainBlock): void {
    const ctx = this.ctx;
    ctx.save();

    if (t.selected) {
      ctx.shadowColor = '#f39c12';
      ctx.shadowBlur = 10;
    }

    if (t.type === 'slope') {
      this.drawSlope(t);
    } else if (t.type === 'oneway') {
      ctx.fillStyle = COLORS.oneway;
      ctx.fillRect(t.x, t.y, t.width, 6);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.width - 1, 5);
    } else {
      ctx.fillStyle = COLORS[t.type];
      ctx.fillRect(t.x, t.y, t.width, t.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x + 0.5, t.y + 0.5, t.width - 1, t.height - 1);

      if (t.type === 'moving') {
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const arrow = t.movingConfig?.axis === 'vertical' ? '↕' : '↔';
        ctx.fillText(arrow, t.x + t.width / 2, t.y + t.height / 2 + 3);
      }
      if (t.type === 'step') {
        ctx.fillStyle = '#666';
        ctx.fillRect(t.x, t.y + t.height * 0.5, t.width, 2);
      }
    }

    ctx.restore();
  }

  private drawSlope(t: TerrainBlock): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.slope;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    ctx.beginPath();
    if (t.slopeDirection === 'right') {
      ctx.moveTo(t.x, t.y + t.height);
      ctx.lineTo(t.x + t.width, t.y + t.height);
      ctx.lineTo(t.x + t.width, t.y);
    } else {
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x, t.y + t.height);
      ctx.lineTo(t.x + t.width, t.y + t.height);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private drawPreview(type: TerrainType, mx: number, my: number): void {
    const ctx = this.ctx;
    const gx = Math.floor(mx / TILE_SIZE) * TILE_SIZE;
    const gy = Math.floor(my / TILE_SIZE) * TILE_SIZE;

    ctx.save();
    ctx.globalAlpha = 0.5;

    if (type === 'slope') {
      ctx.fillStyle = COLORS.slope;
      ctx.beginPath();
      ctx.moveTo(gx, gy + TILE_SIZE);
      ctx.lineTo(gx + TILE_SIZE, gy + TILE_SIZE);
      ctx.lineTo(gx + TILE_SIZE, gy);
      ctx.closePath();
      ctx.fill();
    } else if (type === 'oneway') {
      ctx.fillStyle = COLORS.oneway;
      ctx.fillRect(gx, gy, TILE_SIZE, 6);
    } else {
      ctx.fillStyle = COLORS[type];
      ctx.fillRect(gx, gy, TILE_SIZE, TILE_SIZE);
    }

    ctx.restore();
  }

  private drawCharacter(c: CharacterState): void {
    const ctx = this.ctx;
    const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);

    if (c.onGround && Math.abs(c.vx) > 50) {
      this.trail.push({ x: c.x + c.width / 2, y: c.y + c.height / 2, alpha: 0.3 });
      if (this.trail.length > 5) this.trail.shift();
    } else if (this.trail.length > 0) {
      this.trail.shift();
    }

    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      ctx.save();
      ctx.globalAlpha = t.alpha * ((i + 1) / this.trail.length);
      ctx.fillStyle = 'rgba(52,152,219,0.3)';
      ctx.fillRect(t.x - c.width / 2, t.y - c.height / 2, c.width, c.height);
      ctx.restore();
    }

    ctx.save();

    if (c.climbing && c.onWall) {
      ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
      if (c.onWall === 'left') ctx.scale(-1, 1);
      ctx.translate(-c.width / 2, -c.height / 2);
    } else if (c.facing === 'left') {
      ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
      ctx.scale(-1, 1);
      ctx.translate(-c.width / 2, -c.height / 2);
      c.x; c.y;
    }

    ctx.fillStyle = 'rgba(52,152,219,0.85)';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;

    this.roundRect(ctx, 3, 0, c.width - 6, c.height - 14, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e67e22';
    ctx.strokeStyle = '#d35400';

    if (c.onGround && Math.abs(c.vx) > 20) {
      const phase = Math.floor(c.runPhase / 0.15) % 2;
      if (phase === 0) {
        ctx.fillRect(4, c.height - 14, 9, 14);
        ctx.fillRect(c.width - 13, c.height - 10, 9, 10);
      } else {
        ctx.fillRect(4, c.height - 10, 9, 10);
        ctx.fillRect(c.width - 13, c.height - 14, 9, 14);
      }
    } else if (!c.onGround) {
      ctx.fillRect(5, c.height - 12, 8, 10);
      ctx.fillRect(c.width - 13, c.height - 12, 8, 10);
    } else {
      ctx.fillRect(4, c.height - 14, 9, 14);
      ctx.fillRect(c.width - 13, c.height - 14, 9, 14);
    }

    ctx.restore();

    this.drawCharacterInfo(c);
  }

  private drawCharacterInfo(c: CharacterState): void {
    const ctx = this.ctx;
    const speed = Math.round(Math.sqrt(c.vx * c.vx + c.vy * c.vy));
    const status = c.climbing ? '攀爬' : c.onGround ? '地面' : '空中';

    const label = `${speed}px/s | ${status}`;
    ctx.font = '11px Consolas, monospace';
    const textW = ctx.measureText(label).width + 10;

    const bx = c.x + c.width / 2 - textW / 2;
    const by = c.y - 22;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.roundRect(ctx, bx, by, textW, 18, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, c.x + c.width / 2, by + 9);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  private drawUI(c: CharacterState): void {
    const ctx = this.ctx;
    const speed = Math.round(Math.sqrt(c.vx * c.vx + c.vy * c.vy));

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this.roundRect(ctx, 10, 10, 160, 68, 6);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px Consolas, monospace';
    ctx.textBaseline = 'top';

    ctx.fillText(`FPS: ${this.fps}`, 20, 18);
    ctx.fillText(`速度: ${speed} px/s`, 20, 36);
    ctx.fillText(`状态: ${c.climbing ? '攀爬' : c.onGround ? '地面' : '空中'}`, 20, 54);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

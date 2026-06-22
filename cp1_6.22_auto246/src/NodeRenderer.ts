import type { GridNode, LightPath, EntangleEffect, Particle, Player } from './types';
import { COLORS, GRID_SIZE, NODE_RADIUS } from './GameEngine';

export class NodeRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cellSize: number;
  private gridCache: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, cellSize: number) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }
    this.ctx = ctx;
    this.cellSize = cellSize;
  }

  setCellSize(size: number): void {
    this.cellSize = size;
    this.gridCache = null;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(): void {
    if (this.gridCache) {
      this.ctx.drawImage(this.gridCache, 0, 0);
      return;
    }

    const cacheCanvas = document.createElement('canvas');
    cacheCanvas.width = this.canvas.width;
    cacheCanvas.height = this.canvas.height;
    const cacheCtx = cacheCanvas.getContext('2d');
    if (!cacheCtx) {
      this.drawGridDirect(this.ctx);
      return;
    }

    this.drawGridDirect(cacheCtx);
    this.gridCache = cacheCanvas;
    this.ctx.drawImage(this.gridCache, 0, 0);
  }

  private drawGridDirect(ctx: CanvasRenderingContext2D): void {
    const boardWidth = GRID_SIZE * this.cellSize;
    const boardHeight = GRID_SIZE * this.cellSize;
    const offsetX = (this.canvas.width - boardWidth) / 2;
    const offsetY = (this.canvas.height - boardHeight) / 2;

    ctx.fillStyle = COLORS.boardBg;
    ctx.fillRect(offsetX, offsetY, boardWidth, boardHeight);

    ctx.strokeStyle = COLORS.gridBorder;
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * this.cellSize, offsetY);
      ctx.lineTo(offsetX + i * this.cellSize, offsetY + boardHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * this.cellSize);
      ctx.lineTo(offsetX + boardWidth, offsetY + i * this.cellSize);
      ctx.stroke();
    }

    this.drawBoardGlow(ctx, offsetX, offsetY, boardWidth, boardHeight);
  }

  drawBoardGlow(ctx?: CanvasRenderingContext2D, offsetX?: number, offsetY?: number, boardWidth?: number, boardHeight?: number): void {
    const renderCtx = ctx || this.ctx;
    const width = boardWidth || GRID_SIZE * this.cellSize;
    const height = boardHeight || GRID_SIZE * this.cellSize;
    const offX = offsetX ?? (this.canvas.width - width) / 2;
    const offY = offsetY ?? (this.canvas.height - height) / 2;

    const gradient = renderCtx.createRadialGradient(
      offX + width / 2,
      offY + height / 2,
      Math.min(width, height) / 2,
      offX + width / 2,
      offY + height / 2,
      Math.min(width, height) / 2 + 40
    );
    gradient.addColorStop(0, 'rgba(74, 59, 107, 0.3)');
    gradient.addColorStop(1, 'rgba(74, 59, 107, 0)');

    renderCtx.fillStyle = gradient;
    renderCtx.fillRect(offX - 40, offY - 40, width + 80, height + 80);
  }

  drawNode(node: GridNode, time: number, isSelected: boolean): void {
    const boardWidth = GRID_SIZE * this.cellSize;
    const boardHeight = GRID_SIZE * this.cellSize;
    const offsetX = (this.canvas.width - boardWidth) / 2;
    const offsetY = (this.canvas.height - boardHeight) / 2;

    const x = offsetX + (node.col + 0.5) * this.cellSize;
    const y = offsetY + (node.row + 0.5) * this.cellSize;

    const breatheScale = 1 + 0.1 * Math.sin((time * Math.PI) / 0.3);
    const radius = NODE_RADIUS * breatheScale;

    const nodeColor = node.owner === 'player1' ? COLORS.player1 : COLORS.player2;

    this.ctx.save();

    const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    glowGradient.addColorStop(0, nodeColor + 'CC');
    glowGradient.addColorStop(0.5, nodeColor + '66');
    glowGradient.addColorStop(1, nodeColor + '00');

    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowColor = nodeColor;
    this.ctx.shadowBlur = 20;

    const bodyGradient = this.ctx.createRadialGradient(
      x - radius * 0.3,
      y - radius * 0.3,
      0,
      x,
      y,
      radius
    );
    bodyGradient.addColorStop(0, '#FFFFFF');
    bodyGradient.addColorStop(0.3, nodeColor);
    bodyGradient.addColorStop(1, this.darkenColor(nodeColor, 0.3));

    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    if (isSelected) {
      const pulseProgress = (time % 0.2) / 0.2;
      const pulseRadius = radius * (1.2 + pulseProgress * 0.3);
      const pulseAlpha = 1 - pulseProgress;

      this.ctx.shadowColor = COLORS.selected;
      this.ctx.shadowBlur = 15;
      this.ctx.strokeStyle = COLORS.selected;
      this.ctx.globalAlpha = pulseAlpha;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawLightPath(path: LightPath, cellSize: number): void {
    const boardWidth = GRID_SIZE * cellSize;
    const boardHeight = GRID_SIZE * cellSize;
    const offsetX = (this.canvas.width - boardWidth) / 2;
    const offsetY = (this.canvas.height - boardHeight) / 2;

    const startX = offsetX + (path.fromCol + 0.5) * cellSize;
    const startY = offsetY + (path.fromRow + 0.5) * cellSize;
    const endX = offsetX + (path.toCol + 0.5) * cellSize;
    const endY = offsetY + (path.toRow + 0.5) * cellSize;

    const progress = Math.min(path.progress, 1);
    const currentEndX = startX + (endX - startX) * progress;
    const currentEndY = startY + (endY - startY) * progress;

    const gradient = this.ctx.createLinearGradient(startX, startY, currentEndX, currentEndY);
    gradient.addColorStop(0, COLORS.pathStart);
    gradient.addColorStop(1, COLORS.pathEnd);

    this.ctx.save();

    this.ctx.shadowColor = COLORS.pathStart;
    this.ctx.shadowBlur = 15;

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(currentEndX, currentEndY);
    this.ctx.stroke();

    this.ctx.fillStyle = COLORS.pathStart;
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.arc(currentEndX, currentEndY, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawEntangleEffect(effect: EntangleEffect, cellSize: number): void {
    const boardWidth = GRID_SIZE * cellSize;
    const boardHeight = GRID_SIZE * cellSize;
    const offsetX = (this.canvas.width - boardWidth) / 2;
    const offsetY = (this.canvas.height - boardHeight) / 2;

    const x = offsetX + (effect.col + 0.5) * cellSize;
    const y = offsetY + (effect.row + 0.5) * cellSize;

    this.drawParticles(effect.particles, x, y, effect.progress, COLORS.pathStart);
  }

  drawParticles(particles: Particle[], x: number, y: number, progress: number, color: string): void {
    this.ctx.save();

    particles.forEach((particle) => {
      let px: number;
      let py: number;
      let alpha: number;
      let size: number;

      if (progress <= 0.3) {
        const expandProgress = progress / 0.3;
        const distance = expandProgress * 30;
        px = x + particle.vx * distance;
        py = y + particle.vy * distance;
        alpha = 1 - expandProgress * 0.5;
        size = 4 * (1 + expandProgress * 0.5);
      } else {
        const contractProgress = (progress - 0.3) / 0.7;
        const distance = 30 * (1 - contractProgress);
        px = x + particle.vx * distance;
        py = y + particle.vy * distance;
        alpha = 0.5 + contractProgress * 0.5;
        size = 4 * (1.5 - contractProgress * 0.5);
      }

      this.ctx.globalAlpha = alpha * particle.life;
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(px, py, size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.restore();
  }

  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) * (1 - amount));
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  }
}

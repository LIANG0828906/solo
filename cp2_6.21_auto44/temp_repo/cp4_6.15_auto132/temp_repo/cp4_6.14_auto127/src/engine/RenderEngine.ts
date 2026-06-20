import { Cell, FallingRock } from '../store/gameStore';

const CELL_COLORS: Record<string, string> = {
  rock: '#6b7280',
  empty: '#0f172a',
  iron: '#92400e',
  gold: '#f59e0b',
  diamond: '#06b6d4',
  exit: '#22c55e',
};

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private gridSize: number;
  private offsetX: number;
  private offsetY: number;
  private time: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.cellSize = 48;
    this.gridSize = 10;
    this.offsetX = 0;
    this.offsetY = 0;
    this.time = 0;

    this.ctx.imageSmoothingEnabled = false;
  }

  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  setCellSize(size: number): void {
    this.cellSize = size;
  }

  setOffset(x: number, y: number): void {
    this.offsetX = x;
    this.offsetY = y;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
  }

  clear(): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderGrid(grid: Cell[][]): void {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const px = this.offsetX + x * this.cellSize;
        const py = this.offsetY + y * this.cellSize;
        this.drawCell(cell, px, py);
      }
    }
  }

  private drawCell(cell: Cell, x: number, y: number): void {
    const ctx = this.ctx;
    const size = this.cellSize;

    if (cell.type === 'empty') {
      ctx.fillStyle = CELL_COLORS.empty;
      ctx.fillRect(x, y, size, size);
      this.drawDots(x, y, size);
      return;
    }

    if (cell.type === 'exit') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, size, size);
      const pulse = Math.sin(this.time * 3) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
      const padding = size * 0.2;
      ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.floor(size * 0.4)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('出', x + size / 2, y + size / 2);
      return;
    }

    ctx.fillStyle = CELL_COLORS[cell.type] || '#6b7280';
    ctx.fillRect(x, y, size, size);

    if (cell.type === 'rock') {
      this.drawRockTexture(x, y, size);
    } else if (cell.type === 'iron') {
      this.drawOreTexture(x, y, size, '#92400e', '#78350f');
    } else if (cell.type === 'gold') {
      const glow = Math.sin(this.time * 2) * 0.1 + 0.9;
      this.drawOreTexture(x, y, size, `rgba(245, 158, 11, ${glow})`, '#b45309');
    } else if (cell.type === 'diamond') {
      const sparkle = Math.sin(this.time * 4 + x + y) * 0.3 + 0.7;
      this.drawDiamondTexture(x, y, size, sparkle);
    }

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  private drawDots(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e293b';
    const dotSize = Math.max(2, size / 24);
    const step = size / 4;
    for (let dy = step; dy < size; dy += step) {
      for (let dx = step; dx < size; dx += step) {
        if ((Math.floor(dx / step) + Math.floor(dy / step)) % 2 === 0) {
          ctx.fillRect(x + dx - dotSize / 2, y + dy - dotSize / 2, dotSize, dotSize);
        }
      }
    }
  }

  private drawRockTexture(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#4b5563';
    const px = size / 8;
    
    ctx.fillRect(x + px, y + px, px * 2, px * 2);
    ctx.fillRect(x + px * 4, y + px * 2, px * 2, px);
    ctx.fillRect(x + px * 2, y + px * 4, px, px * 2);
    ctx.fillRect(x + px * 5, y + px * 5, px * 2, px);
    
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(x + px * 3, y + px, px, px);
    ctx.fillRect(x + px * 6, y + px * 3, px, px);
  }

  private drawOreTexture(x: number, y: number, size: number, mainColor: string, darkColor: string): void {
    const ctx = this.ctx;
    const px = size / 8;

    ctx.fillStyle = '#4b5563';
    ctx.fillRect(x, y, size, size);
    this.drawRockTexture(x, y, size);

    ctx.fillStyle = mainColor;
    ctx.fillRect(x + px * 2, y + px * 2, px * 4, px * 4);
    
    ctx.fillStyle = darkColor;
    ctx.fillRect(x + px * 2, y + px * 5, px * 4, px);
    ctx.fillRect(x + px * 5, y + px * 2, px, px * 4);
    
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + px * 2, y + px * 2, px * 2, px);
  }

  private drawDiamondTexture(x: number, y: number, size: number, sparkle: number): void {
    const ctx = this.ctx;
    const px = size / 8;

    ctx.fillStyle = '#4b5563';
    ctx.fillRect(x, y, size, size);
    this.drawRockTexture(x, y, size);

    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const diamondSize = size * 0.4;

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.fillStyle = `rgba(6, 182, 212, ${sparkle})`;
    ctx.beginPath();
    ctx.moveTo(0, -diamondSize);
    ctx.lineTo(diamondSize * 0.7, 0);
    ctx.lineTo(0, diamondSize);
    ctx.lineTo(-diamondSize * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -diamondSize);
    ctx.lineTo(diamondSize * 0.3, -diamondSize * 0.3);
    ctx.lineTo(0, -diamondSize * 0.1);
    ctx.lineTo(-diamondSize * 0.3, -diamondSize * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0891b2';
    ctx.beginPath();
    ctx.moveTo(diamondSize * 0.7, 0);
    ctx.lineTo(0, diamondSize);
    ctx.lineTo(0, diamondSize * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    if (sparkle > 0.85) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + px * 3, y + px * 1, px, px);
    }
  }

  renderPlayer(px: number, py: number, isHurt: boolean, isDigging: boolean, digProgress: number): void {
    const ctx = this.ctx;
    const size = this.cellSize;
    const playerSize = size * 0.6;
    const x = px + (size - playerSize) / 2;
    const y = py + (size - playerSize) / 2;

    const bodyColor = isHurt ? '#ef4444' : '#3b82f6';

    this.drawPixelPlayer(x, y, playerSize, bodyColor, isDigging);

    if (isDigging) {
      const barWidth = size * 0.8;
      const barHeight = 6;
      const barX = px + (size - barWidth) / 2;
      const barY = py - 12;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(barX, barY, barWidth * digProgress, barHeight);
    }
  }

  private drawPixelPlayer(x: number, y: number, size: number, color: string, isDigging: boolean): void {
    const ctx = this.ctx;
    const px = size / 8;

    ctx.fillStyle = color;
    ctx.fillRect(x + px * 2, y + px * 2, px * 4, px * 5);
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(x + px * 2, y, px * 4, px * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + px * 3, y + px * 0.5, px, px);
    ctx.fillRect(x + px * 5, y + px * 0.5, px, px);

    ctx.fillStyle = '#1e40af';
    ctx.fillRect(x + px * 2, y + px * 7, px * 1.5, px);
    ctx.fillRect(x + px * 4.5, y + px * 7, px * 1.5, px);

    ctx.fillStyle = '#fcd34d';
    if (isDigging) {
      ctx.fillRect(x + px * 6, y + px * 2, px * 2, px);
    } else {
      ctx.fillRect(x + px * 6, y + px * 3, px, px * 2);
    }
    ctx.fillRect(x, y + px * 3, px, px * 2);

    const pickaxeX = isDigging ? x + px * 7 : x + px * 6;
    const pickaxeY = isDigging ? y - px : y + px * 1;
    ctx.fillStyle = '#92400e';
    ctx.fillRect(pickaxeX, pickaxeY + px, px * 0.5, px * 3);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(pickaxeX - px, pickaxeY, px * 2.5, px);
  }

  renderFallingRocks(rocks: FallingRock[]): void {
    const ctx = this.ctx;

    for (const rock of rocks) {
      const size = 16;
      const x = this.offsetX + rock.x * this.cellSize + (this.cellSize - size) / 2;
      const y = this.offsetY + rock.y;

      ctx.save();
      ctx.translate(x + size / 2, y + size / 2);
      ctx.rotate(rock.rotation);

      ctx.fillStyle = '#6b7280';
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(-size / 2, size / 4, size, size / 4);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(-size / 4, -size / 2, size / 4, size / 4);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      ctx.restore();
    }
  }

  renderParticles(particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }>): void {
    const ctx = this.ctx;
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(this.offsetX + p.x, this.offsetY + p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}

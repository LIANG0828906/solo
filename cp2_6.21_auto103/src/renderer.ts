import { ObstaclePool, Obstacle, Collectible } from './obstacle';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screenFlashTimer: number = 0;
  private screenFlashColor: string = '';
  private panelGlowPhase: number = 0;
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#1a0520');
    grad.addColorStop(1, '#0d0221');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    this.drawStars(ctx, w, h);
  }

  private drawStars(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const seed = 42;
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 7919 + seed) % w);
      const sy = ((i * 6271 + seed * 3) % (h * 0.4));
      const sz = ((i * 3571) % 2) + 1;
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  drawBuildings(buildings: { x: number; width: number; height: number }[], cameraX: number): void {
    const ctx = this.ctx;
    const ch = this.canvas.height;

    for (const b of buildings) {
      const sx = b.x - cameraX;
      if (sx > this.canvas.width + 10 || sx + b.width < -10) continue;

      const roofY = ch - b.height;

      const grad = ctx.createLinearGradient(sx, roofY, sx, ch);
      grad.addColorStop(0, '#2c3e50');
      grad.addColorStop(1, '#34495e');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, roofY, b.width, b.height);

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.strokeRect(sx, roofY, b.width, b.height);
      ctx.shadowBlur = 0;

      this.drawWindows(ctx, sx, roofY, b.width, b.height);
    }
  }

  private drawWindows(ctx: CanvasRenderingContext2D, sx: number, sy: number, bw: number, bh: number): void {
    const cols = 3;
    const rows = Math.floor(bh / 35);
    const winW = 16;
    const winH = 20;
    const gapX = (bw - cols * winW) / (cols + 1);
    const gapY = (bh - rows * winH) / (rows + 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = sx + gapX + c * (winW + gapX);
        const wy = sy + gapY + r * (winH + gapY);
        const lit = Math.random() < 0.3;
        ctx.fillStyle = lit ? 'rgba(255,234,167,0.8)' : 'rgba(0,0,0,0.3)';
        ctx.fillRect(wx, wy, winW, winH);
        if (lit) {
          ctx.shadowColor = '#ffeaa7';
          ctx.shadowBlur = 4;
          ctx.fillRect(wx, wy, winW, winH);
          ctx.shadowBlur = 0;
        }
      }
    }
  }

  drawObstacles(obstacles: Obstacle[], cameraX: number): void {
    const ctx = this.ctx;

    for (const obs of obstacles) {
      if (!obs.active) continue;
      const sx = obs.x - cameraX;
      if (sx > this.canvas.width + 20 || sx + obs.width < -20) continue;

      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 4;

      switch (obs.type) {
        case 'vent':
          ctx.fillStyle = '#636e72';
          ctx.fillRect(sx, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, obs.y, obs.width, obs.height);
          for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = 'rgba(0,240,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(sx + 5 + i * 12, obs.y + 4);
            ctx.lineTo(sx + 5 + i * 12, obs.y + obs.height - 4);
            ctx.stroke();
          }
          break;
        case 'crate':
          ctx.fillStyle = '#795548';
          ctx.fillRect(sx, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, obs.y, obs.width, obs.height);
          ctx.strokeStyle = 'rgba(0,240,255,0.3)';
          ctx.beginPath();
          ctx.moveTo(sx, obs.y);
          ctx.lineTo(sx + obs.width, obs.y + obs.height);
          ctx.moveTo(sx + obs.width, obs.y);
          ctx.lineTo(sx, obs.y + obs.height);
          ctx.stroke();
          break;
        case 'plant':
          ctx.fillStyle = '#27ae60';
          ctx.fillRect(sx + 4, obs.y, obs.width - 8, obs.height - 8);
          ctx.fillStyle = '#6d4c41';
          ctx.fillRect(sx + 6, obs.y + obs.height - 8, obs.width - 12, 8);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, obs.y, obs.width, obs.height);
          break;
      }

      ctx.shadowBlur = 0;
    }
  }

  drawCollectibles(collectibles: Collectible[], cameraX: number): void {
    const ctx = this.ctx;

    for (const col of collectibles) {
      if (!col.active || col.collected) continue;
      const sx = col.x - cameraX;
      if (sx > this.canvas.width + 20 || sx < -20) continue;

      const pulse = Math.sin(col.pulsePhase) * 0.3 + 1;

      if (col.type === 'energy') {
        ctx.save();
        ctx.shadowColor = '#f1c40f';
        ctx.shadowBlur = 12 * pulse;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const px = sx + Math.cos(angle) * col.size * pulse;
          const py = col.y + Math.sin(angle) * col.size * pulse;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 10 * pulse;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(sx, col.y - col.size * pulse);
        ctx.lineTo(sx - col.size * pulse, col.y + col.size * 0.6 * pulse);
        ctx.lineTo(sx + col.size * pulse, col.y + col.size * 0.6 * pulse);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }
  }

  drawUI(score: number, health: number, highScore: number): void {
    const ctx = this.ctx;
    this.panelGlowPhase += 0.05;

    const panelX = 16;
    const panelY = 16;
    const panelW = 220;
    const panelH = 90;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    const glowIntensity = (Math.sin(this.panelGlowPhase) + 1) / 2;
    ctx.strokeStyle = `rgba(0,240,255,${0.4 + glowIntensity * 0.6})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 4 + glowIntensity * 8;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    ctx.shadowBlur = 0;

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`SCORE: ${score}`, panelX + 14, panelY + 28);
    ctx.fillText(`BEST:  ${highScore}`, panelX + 14, panelY + 48);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText('HP: ', panelX + 14, panelY + 72);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < health ? '#e74c3c' : '#2d3436';
      ctx.shadowColor = i < health ? '#e74c3c' : 'transparent';
      ctx.shadowBlur = i < health ? 6 : 0;
      ctx.fillRect(panelX + 52 + i * 24, panelY + 60, 16, 16);
    }
    ctx.shadowBlur = 0;
  }

  flashScreen(color: string): void {
    this.screenFlashTimer = 12;
    this.screenFlashColor = color;
  }

  drawScreenEffects(): void {
    if (this.screenFlashTimer > 0) {
      const ctx = this.ctx;
      const alpha = (this.screenFlashTimer / 12) * 0.3;
      ctx.fillStyle = `rgba(255,0,0,${alpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.screenFlashTimer--;
    }
  }

  drawGameOver(score: number, highScore: number, animProgress: number, onRestart: (() => void) | null): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    const eased = 1 - Math.pow(1 - Math.min(animProgress, 1), 3);
    const panelY = -200 + (h / 2 - 80) * eased;

    const pw = 360;
    const ph = 220;
    const px = w / 2 - pw / 2;

    ctx.fillStyle = 'rgba(10,0,20,0.9)';
    ctx.fillRect(px, panelY, pw, ph);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(px, panelY, pw, ph);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#ff0066';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', w / 2, panelY + 50);

    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`SCORE: ${score}`, w / 2, panelY + 90);
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText(`BEST:  ${highScore}`, w / 2, panelY + 120);

    if (animProgress >= 1 && onRestart) {
      const bx = w / 2 - 70;
      const by = panelY + 150;
      const bw = 140;
      const bh = 40;

      const gradient = ctx.createLinearGradient(bx, by, bx + bw, by);
      gradient.addColorStop(0, '#00f0ff');
      gradient.addColorStop(1, '#ff00ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#0d0221';
      ctx.fillText('RESTART', w / 2, by + 26);

      this._restartBtn = { x: bx, y: by, w: bw, h: bh, callback: onRestart };
    } else {
      this._restartBtn = null;
    }

    ctx.textAlign = 'left';
  }

  private _restartBtn: { x: number; y: number; w: number; h: number; callback: () => void } | null = null;

  getRestartBtn(): { x: number; y: number; w: number; h: number; callback: () => void } | null {
    return this._restartBtn;
  }

  addParticle(x: number, y: number, color: string, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 1) * 3,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  updateAndDrawParticles(): void {
    const ctx = this.ctx;

    this.particles = this.particles.filter(p => p.life > 0);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  trimParticles(maxCount: number): void {
    if (this.particles.length > maxCount) {
      this.particles = this.particles.slice(-maxCount);
    }
  }
}

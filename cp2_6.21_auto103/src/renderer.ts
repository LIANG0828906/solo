import { ObstaclePool, Obstacle, Collectible } from './obstacle';

interface BaseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  startSize: number;
}

interface CollectBurst {
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screenFlashTimer: number = 0;
  private screenFlashColor: string = '';
  private panelGlowPhase: number = 0;
  private panelEdgePhase: number = 0;
  private particles: BaseParticle[] = [];
  private collectBursts: CollectBurst[] = [];
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private cachedBlur: ImageData | null = null;
  private needsBlurCache: boolean = true;

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
      if (!col.active) continue;
      const sx = col.x - cameraX;
      if (sx > this.canvas.width + 20 || sx < -20) continue;

      if (col.collected) {
        const progress = 1 - col.collectAnimTimer / 18;
        const scale = 1 + progress * 2;
        const alpha = 1 - progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(sx, col.y);
        ctx.scale(scale, scale);
        if (col.type === 'energy') {
          ctx.shadowColor = '#f1c40f';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = Math.cos(angle) * col.size;
            const py = Math.sin(angle) * col.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.shadowColor = '#e74c3c';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#e74c3c';
          ctx.beginPath();
          ctx.moveTo(0, -col.size);
          ctx.lineTo(-col.size, col.size * 0.6);
          ctx.lineTo(col.size, col.size * 0.6);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        continue;
      }

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
    this.panelEdgePhase += 1 / 120;
    if (this.panelEdgePhase >= 1) this.panelEdgePhase = 0;

    const panelX = 16;
    const panelY = 16;
    const panelW = 220;
    const panelH = 90;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    const glowIntensity = (Math.sin(this.panelGlowPhase) + 1) / 2;
    ctx.strokeStyle = `rgba(0,240,255,${0.3 + glowIntensity * 0.4})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.drawEdgeFlow(panelX, panelY, panelW, panelH, this.panelEdgePhase);

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

  private drawEdgeFlow(x: number, y: number, w: number, h: number, phase: number): void {
    const ctx = this.ctx;
    const perimeter = 2 * (w + h);
    const headPos = phase * perimeter;
    const glowLen = 60;
    const tailPos = headPos - glowLen;

    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;

    const segments: Array<{ start: number; end: number; vertical: boolean; dir: number; x: number; y: number }> = [
      { start: 0, end: w, vertical: false, dir: 1, x, y },
      { start: w, end: w + h, vertical: true, dir: 1, x: x + w, y },
      { start: w + h, end: w + h + w, vertical: false, dir: -1, x: x + w, y: y + h },
      { start: w + h + w, end: perimeter, vertical: true, dir: -1, x, y: y + h },
    ];

    for (let loop = 0; loop < 2; loop++) {
      for (const seg of segments) {
        let segStart = seg.start;
        let segEnd = seg.end;
        if (loop === 1) {
          segStart += perimeter;
          segEnd += perimeter;
        }

        const overlapStart = Math.max(headPos - glowLen, segStart);
        const overlapEnd = Math.min(headPos, segEnd);

        if (overlapStart >= overlapEnd) continue;

        const startDist = headPos - overlapEnd;
        const endDist = headPos - overlapStart;

        const startAlpha = Math.max(0.2, 1 - startDist / glowLen);
        const endAlpha = Math.max(0.2, 1 - endDist / glowLen);

        let px1, py1, px2, py2;

        if (seg.vertical) {
          const localStart = overlapStart - (seg.start - loop * perimeter);
          const localEnd = overlapEnd - (seg.start - loop * perimeter);
          px1 = seg.x;
          py1 = seg.y + seg.dir * localStart;
          px2 = seg.x;
          py2 = seg.y + seg.dir * localEnd;
        } else {
          const localStart = overlapStart - (seg.start - loop * perimeter);
          const localEnd = overlapEnd - (seg.start - loop * perimeter);
          px1 = seg.x + seg.dir * localStart;
          py1 = seg.y;
          px2 = seg.x + seg.dir * localEnd;
          py2 = seg.y;
        }

        const grad = ctx.createLinearGradient(px1, py1, px2, py2);
        if (seg.dir > 0) {
          grad.addColorStop(0, `rgba(0,240,255,${startAlpha})`);
          grad.addColorStop(1, `rgba(0,240,255,${endAlpha})`);
        } else {
          grad.addColorStop(0, `rgba(0,240,255,${endAlpha})`);
          grad.addColorStop(1, `rgba(0,240,255,${startAlpha})`);
        }

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.stroke();
      }
    }

    ctx.restore();
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

  addCollectBurst(x: number, y: number, color: string): void {
    this.collectBursts.push({ x, y, color, life: 18, maxLife: 18 });
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const speed = 2 + Math.random() * 2;
      const startSize = 3 + Math.random() * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 18,
        maxLife: 18,
        color,
        size: startSize,
        startSize: startSize
      });
    }
  }

  invalidateBlurCache(): void {
    this.needsBlurCache = true;
    this.cachedBlur = null;
  }

  drawGameOver(score: number, highScore: number, animProgress: number, onRestart: (() => void) | null): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    if (this.needsBlurCache || !this.cachedBlur) {
      if (!this.offscreenCanvas || this.offscreenCanvas.width !== w || this.offscreenCanvas.height !== h) {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = w;
        this.offscreenCanvas.height = h;
      }
      const offCtx = this.offscreenCanvas.getContext('2d')!;
      offCtx.clearRect(0, 0, w, h);
      offCtx.drawImage(this.canvas, 0, 0);
      offCtx.filter = 'blur(4px)';
      offCtx.drawImage(this.offscreenCanvas, 0, 0);
      offCtx.filter = 'none';
      this.cachedBlur = offCtx.getImageData(0, 0, w, h);
      this.needsBlurCache = false;
    }

    ctx.putImageData(this.cachedBlur, 0, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const clamped = Math.min(animProgress, 1);
    const eased = 1 - Math.pow(1 - clamped, 3);
    const finalPanelY = h / 2 - 110;
    const panelY = -280 + (finalPanelY + 280) * eased;

    const pw = 360;
    const ph = 240;
    const px = w / 2 - pw / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(10,0,25,0.88)';
    ctx.fillRect(px, panelY, pw, ph);
    ctx.restore();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.strokeRect(px, panelY, pw, ph);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = '#ff0066';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 10;
    ctx.fillText('GAME OVER', w / 2, panelY + 50);
    ctx.shadowBlur = 0;

    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 4;
    ctx.fillText(`SCORE: ${score}`, w / 2, panelY + 95);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText(`BEST:  ${highScore}`, w / 2, panelY + 125);

    if (clamped >= 1 && onRestart) {
      const bx = w / 2 - 70;
      const by = panelY + 160;
      const bw = 140;
      const bh = 44;

      const gradient = ctx.createLinearGradient(bx, by, bx + bw, by);
      gradient.addColorStop(0, '#00f0ff');
      gradient.addColorStop(1, '#ff00ff');
      ctx.fillStyle = gradient;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(bx, by, bw, bh);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#0d0221';
      ctx.fillText('RESTART', w / 2, by + 28);

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
      const startSize = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 1) * 3,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: startSize,
        startSize: startSize
      });
    }
  }

  updateAndDrawParticles(): void {
    const ctx = this.ctx;

    this.particles = this.particles.filter(p => p.life > 0);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;

      const lifeRatio = p.life / p.maxLife;
      const currentSize = p.startSize * lifeRatio;
      const alpha = lifeRatio;

      if (alpha <= 0.01 || currentSize < 0.3) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 4;
      ctx.fillRect(p.x - currentSize / 2, p.y - currentSize / 2, currentSize, currentSize);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    this.collectBursts = this.collectBursts.filter(b => b.life > 0);
    for (let i = this.collectBursts.length - 1; i >= 0; i--) {
      const b = this.collectBursts[i];
      b.life--;
      if (b.life <= 0) {
        this.collectBursts.splice(i, 1);
        continue;
      }
      const progress = 1 - b.life / b.maxLife;
      const radius = 6 + progress * 30;
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
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

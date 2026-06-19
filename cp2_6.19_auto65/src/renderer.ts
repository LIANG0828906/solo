import { Star, Ship, Asteroid, Bullet, Ore, Particle, ORE_VALUES } from './entities';

export const CANVAS_W = 800;
export const CANVAS_H = 600;
const BG_COLOR = '#0a0a2e';

export interface HUDState {
  score: number;
  displayScore: number;
  shieldLevel: number;
  shieldMax: number;
  weaponLevel: number;
}

export interface BlackHoleState {
  active: boolean;
  phase: number;
  progress: number;
  x: number;
  y: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private vortexCtx: CanvasRenderingContext2D;
  private stars: Star[];
  private _nebulaData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement, vortexCanvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    const vctx = vortexCanvas.getContext('2d');
    if (!ctx || !vctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
    this.vortexCtx = vctx;
    this.stars = [];
    this._initStars();
    this._generateNebula();
  }

  private _initStars(): void {
    for (let i = 0; i < 150; i++) {
      this.stars.push(new Star());
    }
  }

  private _generateNebula(): void {
    const off = document.createElement('canvas');
    off.width = CANVAS_W;
    off.height = CANVAS_H;
    const octx = off.getContext('2d')!;

    const grad1 = octx.createRadialGradient(180, 120, 0, 180, 120, 260);
    grad1.addColorStop(0, 'rgba(100, 50, 200, 0.12)');
    grad1.addColorStop(1, 'rgba(100, 50, 200, 0)');
    octx.fillStyle = grad1;
    octx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const grad2 = octx.createRadialGradient(620, 460, 0, 620, 460, 300);
    grad2.addColorStop(0, 'rgba(30, 80, 200, 0.10)');
    grad2.addColorStop(1, 'rgba(30, 80, 200, 0)');
    octx.fillStyle = grad2;
    octx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const grad3 = octx.createRadialGradient(400, 300, 0, 400, 300, 200);
    grad3.addColorStop(0, 'rgba(150, 30, 180, 0.06)');
    grad3.addColorStop(1, 'rgba(150, 30, 180, 0)');
    octx.fillStyle = grad3;
    octx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    this._nebulaData = octx.getImageData(0, 0, CANVAS_W, CANVAS_H);
  }

  updateStars(): void {
    for (const s of this.stars) s.update();
  }

  clear(): void {
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  drawBackground(): void {
    if (this._nebulaData) {
      this.ctx.putImageData(this._nebulaData, 0, 0);
    }

    for (const s of this.stars) {
      const alpha = s.getAlpha();
      this.ctx.globalAlpha = alpha;
      if (s.size > 1.5) {
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 3;
      }
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(s.x, s.y, s.size, s.size);
      this.ctx.shadowBlur = 0;
    }
    this.ctx.globalAlpha = 1;

    const groundGrad = this.ctx.createLinearGradient(0, CANVAS_H - 50, 0, CANVAS_H);
    groundGrad.addColorStop(0, 'rgba(30, 30, 80, 0)');
    groundGrad.addColorStop(1, 'rgba(50, 30, 90, 0.6)');
    this.ctx.fillStyle = groundGrad;
    this.ctx.fillRect(0, CANVAS_H - 50, CANVAS_W, 50);

    this.ctx.strokeStyle = 'rgba(150, 100, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, CANVAS_H - 20);
    this.ctx.lineTo(CANVAS_W, CANVAS_H - 20);
    this.ctx.stroke();
  }

  drawShip(ship: Ship): void {
    ship.draw(this.ctx);
  }

  drawBullet(bullet: Bullet): void {
    bullet.draw(this.ctx);
  }

  drawAsteroid(asteroid: Asteroid): void {
    asteroid.draw(this.ctx);
  }

  drawOre(ore: Ore): void {
    ore.draw(this.ctx);
    if (!ore.collected && ore.onGround) {
      const pulse = (Math.sin(Date.now() * 0.008) + 1) / 2;
      this.ctx.save();
      this.ctx.globalAlpha = 0.3 + pulse * 0.3;
      this.ctx.strokeStyle = ORE_VALUES[ore.color].glow;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.arc(ore.x, ore.y, 12, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  drawCollectPrompt(ship: Ship, ores: Ore[]): void {
    for (const ore of ores) {
      if (!ore.collected && ore.onGround && ore.isNearShip(ship)) {
        this.ctx.save();
        const bounce = Math.sin(Date.now() * 0.01) * 2;
        this.ctx.font = 'bold 11px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffaa33';
        this.ctx.shadowColor = '#ffaa33';
        this.ctx.shadowBlur = 6;
        this.ctx.fillText('[E] 收集', ore.x, ore.y - 20 + bounce);
        this.ctx.restore();
        break;
      }
    }
  }

  drawParticle(particle: Particle): void {
    particle.draw(this.ctx);
  }

  drawHUD(state: HUDState): void {
    this.ctx.save();

    const panelX = CANVAS_W - 195;
    const panelY = 12;

    this.ctx.fillStyle = 'rgba(10, 10, 46, 0.6)';
    this.ctx.strokeStyle = 'rgba(0, 204, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this._roundRect(panelX, panelY, 183, 118, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.shadowColor = '#ffaa33';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = '#ffaa33';
    this.ctx.font = 'bold 11px "Courier New", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('矿石分数', panelX + 12, panelY + 22);
    this.ctx.shadowBlur = 0;

    const displayScore = Math.floor(state.displayScore);
    const digits = displayScore.toString().split('');
    let scoreX = panelX + 12;
    const baseY = panelY + 44;

    this.ctx.font = 'bold 22px "Courier New", monospace';
    for (let i = 0; i < digits.length; i++) {
      const d = digits[i];
      const seed = (displayScore * 7 + i * 13) % 100;
      const bounce = Math.abs(Math.sin(Date.now() * 0.006 + seed)) * -2.5;
      this.ctx.fillStyle = '#ffee88';
      this.ctx.shadowColor = '#ffaa33';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(d, scoreX, baseY + bounce);
      scoreX += this.ctx.measureText(d).width + 1;
    }
    this.ctx.shadowBlur = 0;

    this.ctx.shadowColor = '#66ff66';
    this.ctx.shadowBlur = 6;
    this.ctx.fillStyle = '#88ff88';
    this.ctx.font = 'bold 11px "Courier New", monospace';
    this.ctx.fillText('护盾等级', panelX + 12, panelY + 64);
    this.ctx.shadowBlur = 0;

    const barX = panelX + 12;
    const barY = panelY + 72;
    const cellCount = 5;
    const cellW = 30;
    const cellH = 12;
    const gap = 3;
    const filled = Math.min(state.shieldLevel, cellCount);

    for (let i = 0; i < cellCount; i++) {
      const cx = barX + i * (cellW + gap);
      const isFilled = i < filled;
      const t = cellCount > 1 ? i / (cellCount - 1) : 0;
      const r = isFilled ? Math.floor(100 + t * 155) : 40;
      const g = isFilled ? Math.floor(255 - t * 155) : 40;
      const b = isFilled ? Math.floor(150 - t * 100) : 40;
      const color = `rgb(${r},${g},${b})`;

      if (isFilled) {
        const grad = this.ctx.createLinearGradient(cx, barY, cx, barY + cellH);
        grad.addColorStop(0, color);
        grad.addColorStop(1, `rgb(${Math.max(0, r - 60)},${Math.max(0, g - 60)},${Math.max(0, b - 40)})`);
        this.ctx.fillStyle = grad;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 5;
      } else {
        this.ctx.fillStyle = 'rgba(60, 60, 100, 0.5)';
        this.ctx.shadowBlur = 0;
      }
      this._roundRect(cx, barY, cellW, cellH, 3);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.shadowColor = '#ffee66';
    this.ctx.shadowBlur = 6;
    this.ctx.fillStyle = '#ffdd66';
    this.ctx.font = 'bold 11px "Courier New", monospace';
    this.ctx.fillText('武器等级', panelX + 12, panelY + 102);
    this.ctx.shadowBlur = 0;

    const starY = panelY + 112;
    for (let i = 0; i < 5; i++) {
      const sx = panelX + 14 + i * 20;
      if (i < state.weaponLevel) {
        this._drawStar(sx, starY, 7, '#ffdd33', '#ffaa33');
      } else {
        this._drawStar(sx, starY, 7, 'rgba(80, 80, 120, 0.4)', 'rgba(60, 60, 100, 0.4)', false);
      }
    }

    this.ctx.fillStyle = 'rgba(10, 10, 46, 0.55)';
    this.ctx.strokeStyle = 'rgba(255, 170, 51, 0.25)';
    this.ctx.lineWidth = 1;
    this._roundRect(12, 12, 110, 46, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#88aaff';
    this.ctx.font = 'bold 11px "Courier New", monospace';
    this.ctx.shadowColor = '#00ccff';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('下次护盾', 22, 30);
    this.ctx.shadowBlur = 0;

    const shieldProgress = (state.score % 100) / 100;
    const pbX = 22;
    const pbY = 36;
    const pbW = 90;
    const pbH = 10;

    this.ctx.fillStyle = 'rgba(30, 30, 80, 0.8)';
    this._roundRect(pbX, pbY, pbW, pbH, 4);
    this.ctx.fill();

    const pGrad = this.ctx.createLinearGradient(pbX, pbY, pbX + pbW, pbY);
    pGrad.addColorStop(0, '#00ccff');
    pGrad.addColorStop(1, '#66ffff');
    this.ctx.fillStyle = pGrad;
    this.ctx.shadowColor = '#00ccff';
    this.ctx.shadowBlur = 6;
    this._roundRect(pbX, pbY, pbW * shieldProgress, pbH, 4);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    const weaponProgress = (state.score % 200) / 200;

    this.ctx.fillStyle = 'rgba(10, 10, 46, 0.55)';
    this.ctx.strokeStyle = 'rgba(255, 170, 51, 0.25)';
    this._roundRect(12, 64, 110, 46, 8);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffcc88';
    this.ctx.font = 'bold 11px "Courier New", monospace';
    this.ctx.shadowColor = '#ffaa33';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('下次武器', 22, 82);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'rgba(40, 30, 60, 0.8)';
    this._roundRect(pbX, 88, pbW, pbH, 4);
    this.ctx.fill();

    const wGrad = this.ctx.createLinearGradient(pbX, 88, pbX + pbW, 88);
    wGrad.addColorStop(0, '#ffaa33');
    wGrad.addColorStop(1, '#ffdd66');
    this.ctx.fillStyle = wGrad;
    this.ctx.shadowColor = '#ffaa33';
    this.ctx.shadowBlur = 6;
    this._roundRect(pbX, 88, pbW * weaponProgress, pbH, 4);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }

  drawUpgradePopup(text: string, alpha: number, scale: number): void {
    this.ctx.save();
    this.ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    this.ctx.scale(scale, scale);
    this.ctx.globalAlpha = alpha;
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.fillStyle = '#ffee88';
    this.ctx.shadowColor = '#ffaa33';
    this.ctx.shadowBlur = 20;
    this.ctx.strokeStyle = '#cc7700';
    this.ctx.lineWidth = 4;
    this.ctx.strokeText(text, 0, 0);
    this.ctx.fillText(text, 0, 0);
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  drawBlackHole(bh: BlackHoleState): void {
    if (!bh.active) return;

    this.vortexCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    if (bh.phase === 0 || bh.phase === 1) {
      const swirlAlpha = bh.phase === 0 ? bh.progress * 0.8 : (1 - bh.progress) * 0.8;
      this._drawSwirl(bh.x, bh.y, 80 + bh.progress * 180, swirlAlpha, bh.phase === 1 ? 1 - bh.progress : bh.progress);
    }

    if (bh.phase === 1) {
      const alpha = Math.min(1, bh.progress * 3);
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      const grad = this.ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, 200);
      grad.addColorStop(0, 'rgba(150, 50, 255, 0.5)');
      grad.addColorStop(0.4, 'rgba(100, 20, 200, 0.3)');
      grad.addColorStop(1, 'rgba(50, 10, 100, 0)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      this.ctx.restore();
    }
  }

  private _drawSwirl(cx: number, cy: number, radius: number, alpha: number, progress: number): void {
    const ctx = this.vortexCtx;
    const time = Date.now() * 0.004;

    for (let ring = 0; ring < 5; ring++) {
      const ringR = radius * (0.3 + ring * 0.18);
      const ringAlpha = alpha * (1 - ring * 0.18);

      ctx.save();
      ctx.globalAlpha = ringAlpha;
      ctx.translate(cx, cy);
      ctx.rotate(time * (ring % 2 === 0 ? 1 : -1) * (1 + ring * 0.15));

      for (let a = 0; a < Math.PI * 2; a += 0.08) {
        const wobble = Math.sin(a * 4 + time * 3) * (6 + ring * 2);
        const r = ringR + wobble;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        const colorAlpha = (Math.sin(a * 6 + time * 2) + 1) * 0.4 * ringAlpha;

        const hue = 270 + Math.sin(a * 3 + time) * 40;
        ctx.fillStyle = `hsla(${hue}, 80%, ${50 + progress * 20}%, ${colorAlpha})`;
        ctx.shadowColor = `hsla(${hue}, 90%, 60%, 1)`;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 3 + progress * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.6);
    grad.addColorStop(0, 'rgba(20, 0, 40, 1)');
    grad.addColorStop(0.5, 'rgba(80, 20, 160, 0.6)');
    grad.addColorStop(1, 'rgba(120, 40, 200, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private _drawStar(cx: number, cy: number, r: number, color: string, glow: string, glowActive = true): void {
    this.ctx.save();
    if (glowActive) {
      this.ctx.shadowColor = glow;
      this.ctx.shadowBlur = 8;
    }
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.restore();
  }

  private _roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}

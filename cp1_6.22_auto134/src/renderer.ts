import {
  RuneType, RUNE_COLORS, RUNE_GLOW_COLORS,
  CellData, GamePhase, Particle,
  BOARD_SIZE, GAME_DURATION, GLOW_DURATION, DESTROY_DURATION,
  BURST_FLASH_DURATION
} from './types';
import { Game } from './game';

interface BgStar {
  x: number;
  y: number;
  brightness: number;
  size: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  game: Game;

  readonly CANVAS_W = 600;
  readonly CANVAS_H = 700;
  readonly BOARD_X = 10;
  readonly BOARD_Y = 70;
  readonly CELL_SIZE = 80;
  readonly GAP = 4;
  readonly ENERGY_X = 535;
  readonly ENERGY_Y = 70;
  readonly ENERGY_W = 40;
  readonly ENERGY_H = 300;
  readonly BURST_BTN_X = 535;
  readonly BURST_BTN_Y = 390;
  readonly BURST_BTN_W = 40;
  readonly BURST_BTN_H = 50;

  bgStars: BgStar[] = [];
  time = 0;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.game = game;
    this.initBgStars();
  }

  initBgStars(): void {
    for (let i = 0; i < 80; i++) {
      this.bgStars.push({
        x: Math.random() * this.CANVAS_W,
        y: Math.random() * this.CANVAS_H,
        brightness: 0.3 + Math.random() * 0.7,
        size: 0.5 + Math.random() * 1.5,
        twinkleSpeed: 1 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const maxW = Math.min(600, window.innerWidth);
    const scale = maxW / this.CANVAS_W;
    const w = this.CANVAS_W * scale;
    const h = this.CANVAS_H * scale;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }

  getCanvasScale(): number {
    const maxW = Math.min(600, window.innerWidth);
    return maxW / this.CANVAS_W;
  }

  screenToCanvas(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scale = this.getCanvasScale();
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale
    };
  }

  render(dt: number): void {
    this.time += dt;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.CANVAS_W, this.CANVAS_H);

    this.drawBackground();
    this.drawTimerBar();
    this.drawScore();
    this.drawBoard();
    this.drawEnergyBar();
    this.drawBurstButton();
    this.drawParticles();

    if (this.game.phase === GamePhase.BurstFlash) {
      this.drawBurstFlash();
    }

    if (this.game.phase === GamePhase.GameOver) {
      this.drawGameOverPanel();
    }
  }

  drawBackground(): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.CANVAS_H);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#1E1B4B');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

    for (const star of this.bgStars) {
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset);
      const alpha = star.brightness * twinkle;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawTimerBar(): void {
    const ctx = this.ctx;
    const x = 0;
    const y = 15;
    const w = this.CANVAS_W;
    const h = 10;
    const progress = this.game.timeRemaining / GAME_DURATION;

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x, y, w, h);

    const grad = ctx.createLinearGradient(x, y, x + w * progress, y);
    grad.addColorStop(0, '#B91C1C');
    grad.addColorStop(1, '#EF4444');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * progress, h);

    if (this.game.timeRemaining <= 10) {
      const flash = Math.sin(this.time * 8) > 0;
      if (flash) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.fillRect(x, y, w * progress, h);
      }
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  drawScore(): void {
    const ctx = this.ctx;
    const animProgress = this.game.scoreAnimation;
    const scale = 1 + animProgress * 0.3 * Math.sin(animProgress * Math.PI);

    ctx.save();
    ctx.translate(this.CANVAS_W / 2, 50);
    ctx.scale(scale, scale);
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F8FAFC';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = animProgress > 0 ? 12 : 0;
    ctx.fillText(`${this.game.score}`, 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawBoard(): void {
    const ctx = this.ctx;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cellX = this.BOARD_X + c * (this.CELL_SIZE + this.GAP);
        const cellY = this.BOARD_Y + r * (this.CELL_SIZE + this.GAP);

        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        this.roundRect(ctx, cellX, cellY, this.CELL_SIZE, this.CELL_SIZE, 6);
        ctx.fill();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        this.roundRect(ctx, cellX, cellY, this.CELL_SIZE, this.CELL_SIZE, 6);
        ctx.stroke();
      }
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.game.board[r][c];
        if (cell.eliminated && cell.destroyTimer > 0 && this.game.phase === GamePhase.Eliminating) {
          continue;
        }

        let offsetX = cell.swipeOffsetX * (this.CELL_SIZE + this.GAP);
        let offsetY = cell.swipeOffsetY * (this.CELL_SIZE + this.GAP);

        if (cell.fallTimer < 1) {
          const ease = this.elasticOut(cell.fallTimer);
          offsetY += cell.fallOffsetY * (1 - ease);
        }

        const cellX = this.BOARD_X + c * (this.CELL_SIZE + this.GAP) + offsetX;
        const cellY = this.BOARD_Y + r * (this.CELL_SIZE + this.GAP) + offsetY;

        if (cell.swipeTimer > 0 && cell.swipeTimer < 1) {
          this.drawAfterimage(r, c, cell);
        }

        this.drawRuneCell(cell, cellX, cellY);
      }
    }
  }

  drawAfterimage(r: number, c: number, cell: CellData): void {
    const ctx = this.ctx;
    const alpha = 0.3 * (1 - cell.swipeTimer);

    const origOffX = -cell.swipeOffsetX * (this.CELL_SIZE + this.GAP);
    const origOffY = -cell.swipeOffsetY * (this.CELL_SIZE + this.GAP);
    const origX = this.BOARD_X + c * (this.CELL_SIZE + this.GAP) + origOffX;
    const origY = this.BOARD_Y + r * (this.CELL_SIZE + this.GAP) + origOffY;

    ctx.save();
    ctx.globalAlpha = alpha;
    this.drawRuneShape(cell.type, origX + 8, origY + 8, this.CELL_SIZE - 16, cell.isGolden, cell.goldenRotation);
    ctx.restore();
  }

  drawRuneCell(cell: CellData, x: number, y: number): void {
    const ctx = this.ctx;
    const type = cell.type;
    const padding = 8;
    const runeSize = this.CELL_SIZE - padding * 2;
    const runeX = x + padding;
    const runeY = y + padding;

    if (cell.glowTimer > 0 && this.game.phase === GamePhase.Eliminating) {
      ctx.save();
      ctx.shadowColor = RUNE_GLOW_COLORS[type] || '#FFFFFF';
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.7 + 0.3 * (cell.glowTimer / GLOW_DURATION);
      this.drawRuneShape(type, runeX, runeY, runeSize, cell.isGolden, cell.goldenRotation);
      ctx.restore();
    }

    if (cell.eliminated && this.game.phase === GamePhase.Eliminating) {
      const destroyProgress = cell.destroyTimer;
      if (destroyProgress > 0 && destroyProgress < 1) {
        ctx.save();
        ctx.globalAlpha = 1 - destroyProgress;
        const scale = 1 + destroyProgress * 0.2;
        const cx = runeX + runeSize / 2;
        const cy = runeY + runeSize / 2;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);
        this.drawRuneShape(type, runeX, runeY, runeSize, cell.isGolden, cell.goldenRotation);
        ctx.restore();
        return;
      }
      if (destroyProgress >= 1) return;
    }

    ctx.save();
    const glowColor = RUNE_GLOW_COLORS[type] || '#FFFFFF';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 4;
    this.drawRuneShape(type, runeX, runeY, runeSize, cell.isGolden, cell.goldenRotation);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  drawRuneShape(type: RuneType, x: number, y: number, size: number, isGolden: boolean, rotation: number): void {
    const ctx = this.ctx;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size / 2;

    ctx.save();

    if (isGolden) {
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.translate(-cx, -cy);

      ctx.save();
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.2);
      glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      glowGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.15)');
      glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - r * 0.2, y - r * 0.2, size + r * 0.4, size + r * 0.4);
      ctx.restore();
    }

    switch (type) {
      case RuneType.Fire:
        this.drawFireRune(cx, cy, r);
        break;
      case RuneType.Water:
        this.drawWaterRune(cx, cy, r);
        break;
      case RuneType.Wind:
        this.drawWindRune(cx, cy, r);
        break;
      case RuneType.Earth:
        this.drawEarthRune(cx, cy, r);
        break;
      case RuneType.Light:
        this.drawLightRune(cx, cy, r);
        break;
      case RuneType.Dark:
        this.drawDarkRune(cx, cy, r);
        break;
      case RuneType.Golden:
        this.drawGoldenRune(cx, cy, r);
        break;
    }

    ctx.restore();
  }

  drawFireRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(cx, cy + r * 0.15, 0, cx, cy, r * 0.85);
    grad.addColorStop(0, '#FDE68A');
    grad.addColorStop(0.4, '#F97316');
    grad.addColorStop(1, '#DC2626');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.85);
    ctx.bezierCurveTo(cx + r * 0.15, cy - r * 0.65, cx + r * 0.55, cy - r * 0.3, cx + r * 0.4, cy + r * 0.1);
    ctx.bezierCurveTo(cx + r * 0.35, cy + r * 0.35, cx + r * 0.55, cy + r * 0.55, cx + r * 0.3, cy + r * 0.8);
    ctx.bezierCurveTo(cx + r * 0.15, cy + r * 0.65, cx - r * 0.15, cy + r * 0.65, cx - r * 0.3, cy + r * 0.8);
    ctx.bezierCurveTo(cx - r * 0.55, cy + r * 0.55, cx - r * 0.35, cy + r * 0.35, cx - r * 0.4, cy + r * 0.1);
    ctx.bezierCurveTo(cx - r * 0.55, cy - r * 0.3, cx - r * 0.15, cy - r * 0.65, cx, cy - r * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  drawWaterRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(cx, cy + r * 0.1, 0, cx, cy, r * 0.8);
    grad.addColorStop(0, '#BFDBFE');
    grad.addColorStop(0.5, '#3B82F6');
    grad.addColorStop(1, '#1E3A8A');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.8);
    ctx.bezierCurveTo(cx + r * 0.1, cy - r * 0.7, cx + r * 0.55, cy - r * 0.1, cx + r * 0.5, cy + r * 0.15);
    ctx.arc(cx, cy + r * 0.15, r * 0.5, -0.15, Math.PI + 0.15, false);
    ctx.bezierCurveTo(cx - r * 0.55, cy - r * 0.1, cx - r * 0.1, cy - r * 0.7, cx, cy - r * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  drawWindRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (let i = 0; i < 3; i++) {
      const yOff = (i - 1) * r * 0.35;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.6, cy + yOff);
      ctx.bezierCurveTo(
        cx - r * 0.2, cy + yOff - r * 0.25,
        cx + r * 0.2, cy + yOff + r * 0.25,
        cx + r * 0.6, cy + yOff
      );
      ctx.stroke();
    }

    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(cx + r * 0.6, cy - r * 0.35, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.6, cy + r * 0.35, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.6, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawEarthRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(cx, cy - r * 0.7, cx, cy + r * 0.7);
    grad.addColorStop(0, '#84CC16');
    grad.addColorStop(0.5, '#65A30D');
    grad.addColorStop(1, '#92400E');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.6, cy);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.lineTo(cx - r * 0.6, cy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#A3E635';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.6, cy);
    ctx.lineTo(cx, cy + r * 0.7);
    ctx.lineTo(cx - r * 0.6, cy);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(163, 230, 53, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.3, cy - r * 0.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.35);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.35);
    ctx.stroke();
  }

  drawLightRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.8);
    grad.addColorStop(0, '#FEF9C3');
    grad.addColorStop(0.4, '#FBBF24');
    grad.addColorStop(1, '#D97706');

    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const outerR = r * 0.75;
      const innerR = r * 0.35;
      const nextAngle = ((i + 0.5) / 6) * Math.PI * 2 - Math.PI / 2;

      if (i === 0) {
        ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      } else {
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      }
      ctx.lineTo(cx + Math.cos(nextAngle) * innerR, cy + Math.sin(nextAngle) * innerR);
    }
    ctx.closePath();
    ctx.fill();
  }

  drawDarkRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r * 0.8);
    grad.addColorStop(0, '#C084FC');
    grad.addColorStop(0.5, '#7C3AED');
    grad.addColorStop(1, '#3B0764');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + r * 0.15, cy, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E293B';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const grad2 = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, 0, cx, cy, r * 0.8);
    grad2.addColorStop(0, '#C084FC');
    grad2.addColorStop(0.5, '#7C3AED');
    grad2.addColorStop(1, '#3B0764');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(cx + r * 0.15, cy, r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.05, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGoldenRune(cx: number, cy: number, r: number): void {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.8);
    grad.addColorStop(0, '#FEFCE8');
    grad.addColorStop(0.3, '#FFD700');
    grad.addColorStop(0.7, '#F59E0B');
    grad.addColorStop(1, '#92400E');

    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const outerR = r * 0.8;
      const innerR = r * 0.35;
      const nextAngle = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;

      if (i === 0) {
        ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      } else {
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      }
      ctx.lineTo(cx + Math.cos(nextAngle) * innerR, cy + Math.sin(nextAngle) * innerR);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FEF9C3';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.game.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawEnergyBar(): void {
    const ctx = this.ctx;
    const x = this.ENERGY_X;
    const y = this.ENERGY_Y;
    const w = this.ENERGY_W;
    const h = this.ENERGY_H;

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    this.roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    const fillH = h * this.game.energy;
    if (fillH > 0) {
      const grad = ctx.createLinearGradient(x, y + h, x, y + h - fillH);
      grad.addColorStop(0, '#7C3AED');
      grad.addColorStop(0.5, '#A855F7');
      grad.addColorStop(1, '#C084FC');
      ctx.fillStyle = grad;
      ctx.beginPath();
      this.roundRect(ctx, x + 2, y + h - fillH + 2, w - 4, fillH - 4, 2);
      ctx.fill();
    }

    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('能量', x + w / 2, y + h + 16);
  }

  drawBurstButton(): void {
    const ctx = this.ctx;
    const x = this.BURST_BTN_X;
    const y = this.BURST_BTN_Y;
    const w = this.BURST_BTN_W;
    const h = this.BURST_BTN_H;
    const available = this.game.energy >= 1;

    ctx.save();
    if (available) {
      const pulse = 1 + Math.sin(this.game.burstButtonPulse) * 0.1;
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      ctx.translate(-cx, -cy);

      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.8);
      glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
      glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    }

    ctx.fillStyle = available ? '#FBBF24' : '#374151';
    ctx.beginPath();
    this.roundRect(ctx, x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = available ? '#FDE68A' : '#4B5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.roundRect(ctx, x, y, w, h, 6);
    ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = available ? '#1E293B' : '#6B7280';
    ctx.fillText('爆发', x + w / 2, y + h / 2);

    ctx.restore();
  }

  drawBurstFlash(): void {
    const ctx = this.ctx;
    const progress = this.game.burstFlashTimer / BURST_FLASH_DURATION;
    const alpha = Math.max(0, 1 - progress) * 0.8;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);
  }

  drawGameOverPanel(): void {
    const ctx = this.ctx;
    const panelW = 320;
    const panelH = 280;
    const panelX = (this.CANVAS_W - panelW) / 2;
    const panelY = (this.CANVAS_H - panelH) / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.filter = 'blur(0px)';
    ctx.fillRect(0, 0, this.CANVAS_W, this.CANVAS_H);

    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.fillStyle = 'rgba(30, 27, 75, 0.9)';
    ctx.fillRect(panelX - 10, panelY - 10, panelW + 20, panelH + 20);
    ctx.restore();

    ctx.fillStyle = 'rgba(30, 27, 75, 0.92)';
    ctx.beginPath();
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(124, 58, 237, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.stroke();

    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText('游戏结束', this.CANVAS_W / 2, panelY + 40);

    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('最终得分', this.CANVAS_W / 2, panelY + 80);

    ctx.font = 'bold 42px "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12;
    ctx.fillText(`${this.game.score}`, this.CANVAS_W / 2, panelY + 125);
    ctx.shadowBlur = 0;

    const stars = this.game.getStarRating();
    ctx.font = '36px serif';
    for (let i = 0; i < 3; i++) {
      const sx = this.CANVAS_W / 2 + (i - 1) * 44;
      const sy = panelY + 175;
      ctx.fillStyle = i < stars ? '#FFD700' : '#374151';
      ctx.fillText('★', sx, sy);
    }

    const btnW = 160;
    const btnH = 44;
    const btnX = (this.CANVAS_W - btnW) / 2;
    const btnY = panelY + panelH - 60;

    ctx.fillStyle = '#7C3AED';
    ctx.beginPath();
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('再来一局', this.CANVAS_W / 2, btnY + btnH / 2);
  }

  isRestartButtonHit(canvasX: number, canvasY: number): boolean {
    if (this.game.phase !== GamePhase.GameOver) return false;
    const panelW = 320;
    const panelH = 280;
    const panelX = (this.CANVAS_W - panelW) / 2;
    const panelY = (this.CANVAS_H - panelH) / 2;
    const btnW = 160;
    const btnH = 44;
    const btnX = (this.CANVAS_W - btnW) / 2;
    const btnY = panelY + panelH - 60;
    return canvasX >= btnX && canvasX <= btnX + btnW &&
           canvasY >= btnY && canvasY <= btnY + btnH;
  }

  isBurstButtonHit(canvasX: number, canvasY: number): boolean {
    return canvasX >= this.BURST_BTN_X && canvasX <= this.BURST_BTN_X + this.BURST_BTN_W &&
           canvasY >= this.BURST_BTN_Y && canvasY <= this.BURST_BTN_Y + this.BURST_BTN_H;
  }

  getCellAt(canvasX: number, canvasY: number): { row: number; col: number } | null {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cellX = this.BOARD_X + c * (this.CELL_SIZE + this.GAP);
        const cellY = this.BOARD_Y + r * (this.CELL_SIZE + this.GAP);
        if (canvasX >= cellX && canvasX <= cellX + this.CELL_SIZE &&
            canvasY >= cellY && canvasY <= cellY + this.CELL_SIZE) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  elasticOut(t: number): number {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
  }

  roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

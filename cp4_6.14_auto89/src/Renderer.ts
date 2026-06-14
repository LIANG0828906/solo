import { LevelGenerator } from './LevelGenerator';
import type { Platform } from './LevelGenerator';
import type { Player, Particle, Ripple } from './PlayerController';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 40;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private levelGenerator: LevelGenerator | null = null;
  private bgGradient: CanvasGradient;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    this.bgGradient = this.createBackgroundGradient();
  }

  setLevelGenerator(lg: LevelGenerator): void {
    this.levelGenerator = lg;
  }

  private createBackgroundGradient(): CanvasGradient {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e3a8a');
    return gradient;
  }

  clear(): void {
    this.ctx.fillStyle = this.bgGradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  applyShake(offsetX: number, offsetY: number): void {
    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
  }

  resetShake(): void {
    this.ctx.restore();
  }

  drawGround(): void {
    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 2);
  }

  drawPlatforms(platforms: Platform[], currentTime: number, mouseX: number, mouseY: number): void {
    const activePlatforms = platforms.filter(p => !p.fadeOut);
    this.drawDashedConnections(activePlatforms, currentTime);

    for (const platform of platforms) {
      this.drawPlatform(platform, currentTime, mouseX, mouseY);
    }
  }

  private drawDashedConnections(platforms: Platform[], currentTime: number): void {
    if (platforms.length < 2 || !this.levelGenerator) return;

    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff33';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);

    for (let i = 0; i < platforms.length - 1; i++) {
      const a = platforms[i];
      const b = platforms[i + 1];

      const ax = this.levelGenerator.getPlatformRenderX(a, currentTime) + a.width / 2;
      const ay = a.y + a.height / 2;
      const bx = this.levelGenerator.getPlatformRenderX(b, currentTime) + b.width / 2;
      const by = b.y + b.height / 2;

      const dist = Math.hypot(bx - ax, by - ay);
      if (dist < 250) {
        this.ctx.beginPath();
        this.ctx.moveTo(ax, ay);
        this.ctx.lineTo(bx, by);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  private drawPlatform(platform: Platform, currentTime: number, mouseX: number, mouseY: number): void {
    const ctx = this.ctx;

    let renderX: number;
    let opacity: number;

    if (this.levelGenerator) {
      renderX = this.levelGenerator.getPlatformRenderX(platform, currentTime);
      opacity = this.levelGenerator.getPlatformFadeOpacity(platform, currentTime);
    } else {
      renderX = platform.x;
      opacity = 1;
    }

    const isHovered = this.isPointInRect(
      mouseX, mouseY,
      renderX, platform.y,
      platform.width, platform.height
    );

    ctx.save();
    ctx.globalAlpha = opacity;

    const color = isHovered ? this.brightenColor(platform.color, 20) : platform.color;

    ctx.fillStyle = color;
    ctx.fillRect(renderX, platform.y, platform.width, platform.height);

    ctx.fillStyle = this.brightenColor(color, 30);
    ctx.fillRect(renderX, platform.y, platform.width, 2);

    ctx.fillStyle = this.darkenColor(color, 20);
    ctx.fillRect(renderX, platform.y + platform.height - 2, platform.width, 2);

    if (isHovered) {
      ctx.strokeStyle = this.brightenColor(platform.color, 40);
      ctx.lineWidth = 1;
      ctx.strokeRect(renderX, platform.y, platform.width, platform.height);
    }

    ctx.restore();
  }

  drawPlayer(player: Player): void {
    const ctx = this.ctx;
    const { x, y, width, height, color, tiltAngle, squashStretch } = player;

    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate((tiltAngle * Math.PI) / 180);
    ctx.scale(1 / squashStretch, squashStretch);

    ctx.fillStyle = color;
    ctx.fillRect(-width / 2, -height / 2, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-width / 2 + 3, -height / 2 + 3, width - 6, 2);

    ctx.fillStyle = '#1e293b';
    const eyeY = -2;
    ctx.fillRect(-4, eyeY, 3, 3);
    ctx.fillRect(1, eyeY, 3, 3);

    ctx.restore();
  }

  drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;

    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    }
  }

  drawRipples(ripples: Ripple[]): void {
    const ctx = this.ctx;

    for (const r of ripples) {
      const alpha = (r.life / r.maxLife) * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawDifficultyChart(
    canvas: HTMLCanvasElement,
    history: { avgGap: number; avgHeightDiff: number }[]
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 10, right: 10, bottom: 15, left: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    for (let i = 0; i <= 5; i++) {
      const x = padding.left + (chartW / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();
    }

    if (history.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据不足', w / 2, h / 2 + 4);
      return;
    }

    const dataPoints = Math.min(10, history.length);
    const data = history.slice(-dataPoints);

    const maxVal = Math.max(
      ...data.map(d => Math.max(d.avgGap, d.avgHeightDiff)),
      50
    );

    const drawLine = (
      values: number[],
      lineColor: string,
      dotColor: string
    ) => {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      for (let i = 0; i < values.length; i++) {
        const x = padding.left + (chartW / (dataPoints - 1)) * i;
        const y = padding.top + chartH - (values[i] / maxVal) * chartH;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      for (let i = 0; i < values.length; i++) {
        const x = padding.left + (chartW / (dataPoints - 1)) * i;
        const y = padding.top + chartH - (values[i] / maxVal) * chartH;

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawLine(
      data.map(d => d.avgGap),
      '#3b82f6',
      '#22c55e'
    );

    drawLine(
      data.map(d => d.avgHeightDiff),
      '#a855f7',
      '#f472b6'
    );

    ctx.fillStyle = '#64748b';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal).toString(), padding.left - 3, padding.top + 5);
    ctx.fillText('0', padding.left - 3, h - padding.bottom + 2);

    ctx.textAlign = 'center';
    for (let i = 0; i < dataPoints; i++) {
      const x = padding.left + (chartW / (dataPoints - 1)) * i;
      ctx.fillText((i + 1).toString(), x, h - 1);
    }
  }

  private isPointInRect(
    px: number, py: number,
    rx: number, ry: number,
    rw: number, rh: number
  ): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  private brightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.min(255, (num >> 16) + amt);
    const g = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const b = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, (num >> 16) - amt);
    const g = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const b = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}

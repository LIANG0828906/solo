import { Ball, Pocket, TABLE_WIDTH, TABLE_HEIGHT, CUSHION_WIDTH, PLAY_AREA_LEFT, PLAY_AREA_TOP } from './balls';
import { Particle } from './particles';
import { WallCollisionEvent } from './physics';

export interface ScoreEntry {
  ball: Ball;
  time: number;
  slideProgress: number;
}

export interface RenderState {
  balls: Ball[];
  pockets: Pocket[];
  particles: Particle[];
  scoreEntries: ScoreEntry[];
  shotCount: number;
  isAiming: boolean;
  aimStart: { x: number; y: number };
  aimEnd: { x: number; y: number };
  power: number;
  wallGlows: WallGlow[];
}

export interface WallGlow {
  x: number;
  y: number;
  width: number;
  height: number;
  life: number;
  maxLife: number;
  wall: 'top' | 'bottom' | 'left' | 'right';
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
  }

  render(state: RenderState): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawTable();
    this.drawPockets(state.pockets);
    this.drawWallGlows(state.wallGlows);
    this.drawBalls(state.balls);
    this.drawParticles(state.particles);

    if (state.isAiming) {
      this.drawAimLine(state.aimStart, state.aimEnd);
      this.drawPowerBar(state.aimStart, state.aimEnd, state.power);
    }

    this.drawScorePanel(state.scoreEntries);
    this.drawShotCounter(state.shotCount);
  }

  private drawTable(): void {
    const ctx = this.ctx;

    const cushionGradient = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
    cushionGradient.addColorStop(0, '#5D3A1A');
    cushionGradient.addColorStop(0.5, '#8B4513');
    cushionGradient.addColorStop(1, '#5D3A1A');

    ctx.fillStyle = cushionGradient;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    const innerGradient = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT);
    innerGradient.addColorStop(0, '#3E2723');
    innerGradient.addColorStop(0.5, '#5D3A1A');
    innerGradient.addColorStop(1, '#3E2723');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(4, 4, TABLE_WIDTH - 8, TABLE_HEIGHT - 8);

    const feltGradient = ctx.createRadialGradient(
      TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 50,
      TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 400
    );
    feltGradient.addColorStop(0, '#1B7A2E');
    feltGradient.addColorStop(1, '#0B5D1E');

    ctx.fillStyle = feltGradient;
    ctx.fillRect(CUSHION_WIDTH, CUSHION_WIDTH, TABLE_WIDTH - CUSHION_WIDTH * 2, TABLE_HEIGHT - CUSHION_WIDTH * 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = CUSHION_WIDTH; x < TABLE_WIDTH - CUSHION_WIDTH; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, CUSHION_WIDTH);
      ctx.lineTo(x, TABLE_HEIGHT - CUSHION_WIDTH);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(CUSHION_WIDTH - 1, CUSHION_WIDTH - 1, TABLE_WIDTH - CUSHION_WIDTH * 2 + 2, TABLE_HEIGHT - CUSHION_WIDTH * 2 + 2);
  }

  private drawPockets(pockets: Pocket[]): void {
    const ctx = this.ctx;

    for (const pocket of pockets) {
      const gradient = ctx.createRadialGradient(
        pocket.x, pocket.y, 0,
        pocket.x, pocket.y, pocket.radius
      );
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(0.7, '#1a1a1a');
      gradient.addColorStop(1, '#333333');

      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = '#2a1810';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawWallGlows(wallGlows: WallGlow[]): void {
    const ctx = this.ctx;

    for (const glow of wallGlows) {
      const alpha = glow.life / glow.maxLife;
      ctx.save();

      const gradient = ctx.createLinearGradient(
        glow.x, glow.y,
        glow.x + glow.width, glow.y + glow.height
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.6})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

      ctx.fillStyle = gradient;

      if (glow.wall === 'top' || glow.wall === 'bottom') {
        ctx.fillRect(glow.x - 15, glow.y, 30, glow.height);
      } else {
        ctx.fillRect(glow.x, glow.y - 15, glow.width, 30);
      }

      ctx.restore();
    }
  }

  private drawBalls(balls: Ball[]): void {
    const ctx = this.ctx;

    for (const ball of balls) {
      if (ball.pocketed && ball.scale <= 0.01) continue;

      ctx.save();
      ctx.translate(ball.x, ball.y);
      ctx.scale(ball.scale / ball.squash, ball.scale * ball.squash);

      const radius = ball.radius;
      const gradient = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.3, 0,
        0, 0, radius
      );

      if (ball.type === 'stripe' && ball.stripeColor) {
        gradient.addColorStop(0, lightenColor(ball.color, 40));
        gradient.addColorStop(0.5, ball.color);
        gradient.addColorStop(1, darkenColor(ball.color, 40));

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.05, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = ball.stripeColor;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.05, radius * 0.28, 0, 0, Math.PI * 2);
        const stripeGradient = ctx.createRadialGradient(
          -radius * 0.2, -radius * 0.1, 0,
          0, 0, radius * 0.5
        );
        stripeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        stripeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = stripeGradient;
        ctx.fill();
      } else {
        gradient.addColorStop(0, lightenColor(ball.color, 50));
        gradient.addColorStop(0.6, ball.color);
        gradient.addColorStop(1, darkenColor(ball.color, 50));

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      const highlightGradient = ctx.createRadialGradient(
        -radius * 0.35, -radius * 0.35, 0,
        -radius * 0.2, -radius * 0.2, radius * 0.5
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      ctx.restore();
    }
  }

  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;

    for (const p of particles) {
      if (!p.active) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'flash') {
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private drawAimLine(start: { x: number; y: number }, end: { x: number; y: number }): void {
    const ctx = this.ctx;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const lineLength = Math.min(dist, 150);
    const lineEndX = start.x + nx * lineLength;
    const lineEndY = start.y + ny * lineLength;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.stroke();
    ctx.restore();
  }

  private drawPowerBar(start: { x: number; y: number }, end: { x: number; y: number }, power: number): void {
    const ctx = this.ctx;

    const dx = start.x - end.x;
    const dy = start.y - end.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const barWidth = 6;
    const barLength = Math.min(power, 200);
    const barStartX = start.x + nx * 10;
    const barStartY = start.y + ny * 10;
    const barEndX = barStartX + nx * barLength;
    const barEndY = barStartY + ny * barLength;

    const gradient = ctx.createLinearGradient(
      barStartX, barStartY,
      barEndX, barEndY
    );
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FF8C00');
    gradient.addColorStop(1, '#DC143C');

    ctx.save();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = barWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(barStartX, barStartY);
    ctx.lineTo(barEndX, barEndY);
    ctx.stroke();
    ctx.restore();
  }

  private drawScorePanel(entries: ScoreEntry[]): void {
    const ctx = this.ctx;
    const panelX = TABLE_WIDTH + 15;
    const panelY = 20;
    const panelWidth = 160;
    const padding = 12;
    const titleHeight = 30;
    const entryHeight = 28;
    const panelHeight = titleHeight + entries.length * entryHeight + padding;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, Math.max(panelHeight, 80), 8);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('得分', panelX + padding, panelY + padding);

    const totalScore = entries.reduce((sum, e) => sum + e.ball.score, 0);
    ctx.textAlign = 'right';
    ctx.fillText(`总分: ${totalScore}`, panelX + panelWidth - padding, panelY + padding);
    ctx.textAlign = 'left';

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const slideOffset = (1 - entry.slideProgress) * 30;
      const y = panelY + titleHeight + i * entryHeight + 2;

      ctx.save();
      ctx.globalAlpha = entry.slideProgress;
      ctx.translate(slideOffset, 0);

      const ballPreviewX = panelX + padding;
      const ballPreviewY = y + entryHeight / 2 - 6;

      ctx.beginPath();
      ctx.arc(ballPreviewX + 6, ballPreviewY + 6, 6, 0, Math.PI * 2);
      ctx.fillStyle = entry.ball.color;
      ctx.fill();

      if (entry.ball.type === 'stripe') {
        ctx.beginPath();
        ctx.ellipse(ballPreviewX + 6, ballPreviewY + 6, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }

      let typeText = '';
      if (entry.ball.type === 'solid') typeText = '实心球';
      else if (entry.ball.type === 'stripe') typeText = '条纹球';
      else if (entry.ball.type === 'black') typeText = '黑球';

      ctx.fillStyle = '#CCCCCC';
      ctx.font = '11px sans-serif';
      ctx.fillText(typeText, ballPreviewX + 20, ballPreviewY + 3);

      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`+${entry.ball.score}`, panelX + panelWidth - padding, ballPreviewY + 4);
      ctx.textAlign = 'left';

      ctx.restore();
    }

    ctx.restore();
  }

  private drawShotCounter(count: number): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(PLAY_AREA_LEFT + 8, PLAY_AREA_TOP + 8, 80, 26, 4);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(`击球: ${count}`, PLAY_AREA_LEFT + 16, PLAY_AREA_TOP + 21);
    ctx.restore();
  }
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export function updateWallGlows(wallGlows: WallGlow[], deltaTime: number): WallGlow[] {
  return wallGlows
    .map(g => ({ ...g, life: g.life - deltaTime }))
    .filter(g => g.life > 0);
}

export function createWallGlow(event: WallCollisionEvent): WallGlow {
  const isHorizontal = event.wall === 'top' || event.wall === 'bottom';
  return {
    x: isHorizontal ? event.x : event.x,
    y: isHorizontal ? event.y : event.y,
    width: isHorizontal ? 0 : (event.wall === 'left' ? 8 : -8),
    height: isHorizontal ? (event.wall === 'top' ? 8 : -8) : 0,
    life: 0.2,
    maxLife: 0.2,
    wall: event.wall,
  };
}

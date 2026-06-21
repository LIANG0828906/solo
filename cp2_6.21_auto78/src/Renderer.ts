import {
  Ball,
  TableDimensions,
  CushionFlash,
  BallTrajectory,
  SnapshotBall,
  AIM_LINE_LENGTH,
  AIM_BLINK_INTERVAL,
  CUSHION_FLASH_DURATION,
  BALL_RADIUS,
} from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setTransform(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  private tx(x: number): number {
    return x * this.scale + this.offsetX;
  }

  private ty(y: number): number {
    return y * this.scale + this.offsetY;
  }

  private ts(s: number): number {
    return s * this.scale;
  }

  clear(w: number, h: number): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, w, h);
  }

  drawTable(table: TableDimensions): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(
      this.tx(table.x),
      this.ty(table.y),
      this.ts(table.width),
      this.ts(table.height)
    );

    const innerX = table.x + table.cushionWidth;
    const innerY = table.y + table.cushionWidth;
    const innerW = table.width - 2 * table.cushionWidth;
    const innerH = table.height - 2 * table.cushionWidth;

    ctx.fillStyle = '#0d6b3e';
    ctx.fillRect(this.tx(innerX), this.ty(innerY), this.ts(innerW), this.ts(innerH));

    ctx.strokeStyle = '#3d2a15';
    ctx.lineWidth = this.ts(2);
    ctx.strokeRect(
      this.tx(innerX),
      this.ty(innerY),
      this.ts(innerW),
      this.ts(innerH)
    );

    const spotX = table.x + table.cushionWidth + innerW * 0.25;
    const spotY = table.y + table.cushionWidth + innerH / 2;
    ctx.beginPath();
    ctx.arc(this.tx(spotX), this.ty(spotY), this.ts(2), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();

    const headX = table.x + table.cushionWidth + innerW * 0.75;
    ctx.beginPath();
    ctx.moveTo(this.tx(headX), this.ty(innerY + this.ts(1)));
    ctx.lineTo(this.tx(headX), this.ty(innerY + innerH - this.ts(1)));
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = this.ts(1);
    ctx.stroke();
  }

  drawPockets(table: TableDimensions): void {
    const ctx = this.ctx;
    for (const pocket of table.pockets) {
      ctx.beginPath();
      ctx.arc(this.tx(pocket.x), this.ty(pocket.y), this.ts(pocket.radius), 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.tx(pocket.x), this.ty(pocket.y), this.ts(pocket.radius - 1.5), 0, Math.PI * 2);
      ctx.fillStyle = '#111111';
      ctx.fill();
    }
  }

  drawBall(ball: Ball): void {
    if (ball.pocketed) return;
    const ctx = this.ctx;
    const x = this.tx(ball.x);
    const y = this.ty(ball.y);
    const r = this.ts(ball.radius);

    if (ball.number === 0) {
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#CCCCCC');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      return;
    }

    if (ball.stripe) {
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#EEEEEE');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = ball.color;
      ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.8);
      ctx.restore();
    } else {
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      const baseColor = ball.color;
      grad.addColorStop(0, this.lightenColor(baseColor, 60));
      grad.addColorStop(1, baseColor);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    if (ball.number > 0) {
      const numR = r * 0.45;
      ctx.beginPath();
      ctx.arc(x, y, numR, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = `bold ${Math.max(6, this.ts(5))}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(ball.number), x, y + 0.5);
    }

    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  }

  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }

  drawAimLine(
    cueBall: Ball,
    mouseX: number,
    mouseY: number,
    show: boolean
  ): void {
    if (!show || cueBall.pocketed) return;

    const now = Date.now();
    const blinkPhase = Math.floor(now / (AIM_BLINK_INTERVAL / 2)) % 2;
    const isVisible = blinkPhase === 0;
    if (!isVisible) return;

    const ctx = this.ctx;
    const dx = mouseX - cueBall.x;
    const dy = mouseY - cueBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.001) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const startX = cueBall.x + nx * (cueBall.radius + 2);
    const startY = cueBall.y + ny * (cueBall.radius + 2);
    const endX = cueBall.x + nx * AIM_LINE_LENGTH;
    const endY = cueBall.y + ny * AIM_LINE_LENGTH;

    ctx.beginPath();
    ctx.setLineDash([this.ts(6), this.ts(4)]);
    ctx.moveTo(this.tx(startX), this.ty(startY));
    ctx.lineTo(this.tx(endX), this.ty(endY));
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = this.ts(2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawPowerBar(
    power: number,
    canvasWidth: number,
    canvasHeight: number,
    show: boolean
  ): void {
    if (!show) return;
    const ctx = this.ctx;

    const barWidth = Math.max(200, canvasWidth * 0.35);
    const barHeight = 16;
    const barX = (canvasWidth - barWidth) / 2;
    const barY = canvasHeight - 44;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const fillWidth = (power / 100) * barWidth;
    const grad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    grad.addColorStop(0, '#00FF00');
    grad.addColorStop(0.5, '#FFFF00');
    grad.addColorStop(1, '#FF0000');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${Math.round(power)}`, barX + barWidth / 2, barY - 8);
  }

  drawCushionFlash(
    flashes: CushionFlash[],
    table: TableDimensions
  ): void {
    const now = Date.now();
    const ctx = this.ctx;

    for (const flash of flashes) {
      if (now - flash.time > CUSHION_FLASH_DURATION) continue;

      const alpha = 0.5;
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;

      const innerX = table.x + table.cushionWidth;
      const innerY = table.y + table.cushionWidth;
      const innerW = table.width - 2 * table.cushionWidth;
      const innerH = table.height - 2 * table.cushionWidth;
      const flashSize = this.ts(4);

      switch (flash.side) {
        case 'top':
          ctx.fillRect(this.tx(innerX), this.ty(innerY), this.ts(innerW), flashSize);
          break;
        case 'bottom':
          ctx.fillRect(
            this.tx(innerX),
            this.ty(innerY + innerH) - flashSize,
            this.ts(innerW),
            flashSize
          );
          break;
        case 'left':
          ctx.fillRect(this.tx(innerX), this.ty(innerY), flashSize, this.ts(innerH));
          break;
        case 'right':
          ctx.fillRect(
            this.tx(innerX + innerW) - flashSize,
            this.ty(innerY),
            flashSize,
            this.ts(innerH)
          );
          break;
      }
    }
  }

  drawTrajectories(trajectories: BallTrajectory[]): void {
    const ctx = this.ctx;

    for (const traj of trajectories) {
      if (traj.points.length < 2) continue;

      ctx.beginPath();
      ctx.setLineDash([this.ts(4), this.ts(4)]);
      ctx.moveTo(this.tx(traj.points[0].x), this.ty(traj.points[0].y));
      for (let i = 1; i < traj.points.length; i++) {
        ctx.lineTo(this.tx(traj.points[i].x), this.ty(traj.points[i].y));
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = this.ts(1);
      ctx.stroke();
      ctx.setLineDash([]);

      const first = traj.points[0];
      ctx.beginPath();
      ctx.arc(this.tx(first.x), this.ty(first.y), this.ts(3), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();

      const last = traj.points[traj.points.length - 1];
      ctx.beginPath();
      ctx.arc(this.tx(last.x), this.ty(last.y), this.ts(3), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,80,80,0.8)';
      ctx.fill();
    }
  }

  drawReplayBalls(balls: SnapshotBall[], colors: Record<number, string>): void {
    const ctx = this.ctx;
    for (const b of balls) {
      const x = this.tx(b.x);
      const y = this.ty(b.y);
      const r = this.ts(BALL_RADIUS);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = colors[b.id] || '#FFFFFF';
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = this.ts(0.5);
      ctx.stroke();
    }
  }

  drawFoul(canvasWidth: number, canvasHeight: number, show: boolean, intensity: number): void {
    if (!show) return;
    const ctx = this.ctx;

    const pulseAlpha = 0.4 + 0.4 * intensity;
    ctx.strokeStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, canvasWidth - 6, canvasHeight - 6);

    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 50, 50, ${0.8 + 0.2 * intensity})`;
    ctx.fillText('犯规', canvasWidth / 2, canvasHeight / 2 - 60);

    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 200, 200, 0.9)';
    ctx.fillText('击球顺序错误', canvasWidth / 2, canvasHeight / 2 - 15);
  }
}

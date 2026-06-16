import { Obstacle, DataFragment } from '../types';

export class ObstacleRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  drawObstacle(obstacle: Obstacle): void {
    const ctx = this.ctx;
    const { x, y, width, height, type, color, textFrame } = obstacle;

    ctx.save();

    switch (type) {
      case 'vent':
        this.drawVent(x, y, width, height, color);
        break;
      case 'antenna':
        this.drawAntenna(x, y, width, height, color);
        break;
      case 'billboard':
        this.drawBillboard(x, y, width, height, color, textFrame);
        break;
    }

    ctx.restore();
  }

  private drawVent(x: number, y: number, w: number, h: number, color: string): void {
    const ctx = this.ctx;

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#2a2a2a';
    const gridSize = 10;
    for (let gy = y + 10; gy < y + h - 10; gy += gridSize) {
      for (let gx = x + 5; gx < x + w - 5; gx += gridSize) {
        ctx.fillRect(gx, gy, gridSize - 2, 2);
      }
    }

    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  private drawAntenna(x: number, y: number, w: number, h: number, color: string): void {
    const ctx = this.ctx;
    const cx = x + w / 2;

    ctx.fillStyle = color;
    ctx.fillRect(x + w * 0.3, y + h * 0.7, w * 0.4, h * 0.3);

    ctx.fillStyle = '#888888';
    ctx.fillRect(cx - 3, y, 6, h * 0.7);

    ctx.fillStyle = '#FF0000';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const levelY = y + h * 0.2 + i * (h * 0.15);
      ctx.beginPath();
      ctx.moveTo(cx - 15, levelY);
      ctx.lineTo(cx + 15, levelY);
      ctx.stroke();
    }
  }

  private drawBillboard(x: number, y: number, w: number, h: number, color: string, frame: number): void {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.shadowBlur = 0;

    const textAlpha = frame > 100 ? 1 : 0.5;
    ctx.fillStyle = `rgba(0, 0, 0, ${textAlpha})`;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const messages = ['DATA', 'HACK', 'NET', 'CYBER', 'SYSTEM', 'NEON'];
    const msg = messages[Math.floor((x + y) / 100) % messages.length];
    ctx.fillText(msg, x + w / 2, y + h / 2 - 8);
    ctx.fillText('LINK', x + w / 2, y + h / 2 + 8);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;
  }

  drawDataFragment(fragment: DataFragment): void {
    if (fragment.collected) return;

    const ctx = this.ctx;
    const { x, y, size, rotation } = fragment;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -size / 4);
    ctx.lineTo(size / 4, 0);
    ctx.lineTo(0, size / 4);
    ctx.lineTo(-size / 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

import type { CarState, ArenaState, Obstacle, TireMark, HudData } from './types';

const COLORS = {
  background: '#0A0B1A',
  platformInner: '#1A1B4B',
  platformOuter: '#2D1B4B',
  platformEdge: '#FF3333',
  tireMark: '#FF6B35',
  tireMarkGlow: '#FF8C42',
  carBody: '#FF6B35',
  carBodyDark: '#CC4A1A',
  carWindow: '#1A1B4B',
  carWheel: '#111122',
  obstacle: '#3A3A4A',
  obstacleGrid: '#4A4A5A',
  hudText: '#FFFFFF',
  hudSubtext: '#AAAAAA',
  gaugeBg: '#2A2A3A',
  gaugeProgress: '#FF6B35',
  gaugePointer: '#FF3333',
  panelBg: 'rgba(0, 0, 0, 0.6)',
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    canvas.width = width;
    canvas.height = height;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(
    car: CarState,
    arena: ArenaState,
    obstacles: Obstacle[],
    tireMarks: TireMark[],
    hud: HudData
  ): void {
    this.drawBackground();
    this.drawTireMarks(tireMarks);
    this.drawArena(arena);
    this.drawObstacles(obstacles);
    this.drawCar(car);
    this.drawHUD(hud, car);
    this.drawControlsPanel();

    if (hud.gameStatus === 'gameover') {
      this.drawGameOver(hud);
    }
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(100, 100, 150, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  private drawArena(arena: ArenaState): void {
    const ctx = this.ctx;
    const { centerX, centerY, diameter, edgeFlashOn } = arena;
    const radius = diameter / 2;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, COLORS.platformInner);
    gradient.addColorStop(0.7, COLORS.platformOuter);
    gradient.addColorStop(1, '#1A0F2E');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 100, 200, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (edgeFlashOn) {
      ctx.shadowColor = COLORS.platformEdge;
      ctx.shadowBlur = 20;
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = edgeFlashOn ? COLORS.platformEdge : '#882222';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = edgeFlashOn ? 'rgba(255, 80, 80, 0.5)' : 'rgba(100, 30, 30, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawObstacles(obstacles: Obstacle[]): void {
    const ctx = this.ctx;

    for (const obs of obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      const gradient = ctx.createRadialGradient(
        -obs.radius * 0.3, -obs.radius * 0.3, 0,
        0, 0, obs.radius
      );
      gradient.addColorStop(0, '#4A4A5A');
      gradient.addColorStop(0.5, COLORS.obstacle);
      gradient.addColorStop(1, '#2A2A3A');

      ctx.beginPath();
      ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(0, 0, obs.radius - 2, 0, Math.PI * 2);
      ctx.save();
      ctx.clip();

      ctx.strokeStyle = COLORS.obstacleGrid;
      ctx.lineWidth = 1;
      const gridSize = 6;

      for (let gx = -obs.radius; gx < obs.radius; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, -obs.radius);
        ctx.lineTo(gx, obs.radius);
        ctx.stroke();
      }
      for (let gy = -obs.radius; gy < obs.radius; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-obs.radius, gy);
        ctx.lineTo(obs.radius, gy);
        ctx.stroke();
      }

      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, obs.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#5A5A6A';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawTireMarks(tireMarks: TireMark[]): void {
    const ctx = this.ctx;

    for (const mark of tireMarks) {
      ctx.save();
      ctx.translate(mark.x, mark.y);
      ctx.rotate(mark.angle);

      const alpha = mark.alpha;

      ctx.shadowColor = COLORS.tireMarkGlow;
      ctx.shadowBlur = 8;

      ctx.fillStyle = `rgba(255, 107, 53, ${alpha * 0.7})`;
      ctx.fillRect(-10, -3, 20, 6);

      ctx.fillStyle = `rgba(255, 180, 100, ${alpha * 0.4})`;
      ctx.fillRect(-10, -2, 20, 4);

      ctx.restore();
    }
    ctx.shadowBlur = 0;
  }

  private drawCar(car: CarState): void {
    const ctx = this.ctx;
    const { x, y, angle, carWidth, carHeight, isDrifting, driftAngle } = car;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + driftAngle * 0.5);

    const halfW = carWidth / 2;
    const halfH = carHeight / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;

    const bodyGradient = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bodyGradient.addColorStop(0, COLORS.carBody);
    bodyGradient.addColorStop(0.5, COLORS.carBody);
    bodyGradient.addColorStop(1, COLORS.carBodyDark);

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(halfW, -halfH * 0.5);
    ctx.lineTo(halfW, halfH * 0.7);
    ctx.lineTo(halfW * 0.6, halfH);
    ctx.lineTo(-halfW * 0.6, halfH);
    ctx.lineTo(-halfW, halfH * 0.7);
    ctx.lineTo(-halfW, -halfH * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.carWindow;
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.5, -halfH * 0.3);
    ctx.lineTo(halfW * 0.5, -halfH * 0.3);
    ctx.lineTo(halfW * 0.4, halfH * 0.2);
    ctx.lineTo(-halfW * 0.4, halfH * 0.2);
    ctx.closePath();
    ctx.fill();

    const wheelW = 5;
    const wheelH = 8;
    const wheelOffsetY = halfH * 0.6;
    const wheelOffsetX = halfW + 1;

    ctx.fillStyle = COLORS.carWheel;
    ctx.fillRect(-wheelOffsetX - wheelW / 2, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(wheelOffsetX - wheelW / 2, -wheelOffsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(-wheelOffsetX - wheelW / 2, wheelOffsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(wheelOffsetX - wheelW / 2, wheelOffsetY - wheelH / 2, wheelW, wheelH);

    if (isDrifting) {
      ctx.shadowColor = COLORS.tireMarkGlow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(255, 150, 80, 0.6)';
      ctx.fillRect(-wheelOffsetX - wheelW / 2, wheelOffsetY + wheelH / 2 - 2, wheelW, 4);
      ctx.fillRect(wheelOffsetX - wheelW / 2, wheelOffsetY + wheelH / 2 - 2, wheelW, 4);
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#FFEB99';
    ctx.beginPath();
    ctx.arc(-halfW * 0.4, -halfH + 2, 2, 0, Math.PI * 2);
    ctx.arc(halfW * 0.4, -halfH + 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF3333';
    ctx.beginPath();
    ctx.arc(-halfW * 0.4, halfH - 2, 2, 0, Math.PI * 2);
    ctx.arc(halfW * 0.4, halfH - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawHUD(hud: HudData, car: CarState): void {
    this.drawGauge(80, 80, 60, car.speed, car.maxSpeed * car.boostMultiplier);
    this.drawScore(80, 160, hud.score);
    this.drawTopRight(hud);
    this.drawFPS(hud.fps);
  }

  private drawGauge(x: number, y: number, radius: number, value: number, maxValue: number): void {
    const ctx = this.ctx;
    const percent = Math.min(value / maxValue, 1);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gaugeBg;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + percent * Math.PI * 2);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fillStyle = COLORS.gaugeProgress;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.gaugeBg;
    ctx.fill();

    const angle = -Math.PI / 2 + percent * Math.PI * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = COLORS.gaugePointer;
    ctx.shadowColor = '#FF3333';
    ctx.shadowBlur = 5;
    ctx.fillRect(-2, -radius * 0.8, 4, radius * 0.6);
    ctx.restore();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1A1A2A';
    ctx.fill();
    ctx.strokeStyle = '#FF3333';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const speedDisplay = Math.round(value);
    ctx.fillText(`${speedDisplay}`, x, y + radius + 18);

    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.hudSubtext;
    ctx.fillText('KM/H', x, y + radius + 32);
  }

  private drawScore(x: number, y: number, score: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.floor(score)}`, x - 60, y);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.hudSubtext;
    ctx.fillText('得分', x - 60, y + 28);
  }

  private drawTopRight(hud: HudData): void {
    const ctx = this.ctx;
    const x = this.width - 30;

    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const timeStr = this.formatTime(hud.survivalTime);
    ctx.fillText(timeStr, x, 25);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.hudSubtext;
    ctx.fillText('存活时间', x, 50);

    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText(`${Math.round(hud.diameterPercent)}%`, x, 80);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.hudSubtext;
    ctx.fillText('平台直径', x, 105);
  }

  private drawFPS(fps: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = fps < 50 ? '#FF6666' : '#66FF66';
    ctx.font = '12px "Consolas", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${Math.round(fps)} FPS`, 10, 10);
  }

  private drawControlsPanel(): void {
    const ctx = this.ctx;
    const panelX = this.width - 200;
    const panelY = this.height - 120;
    const panelW = 180;
    const panelH = 100;

    ctx.fillStyle = COLORS.panelBg;
    ctx.beginPath();
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 12);
    ctx.fill();

    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('操作说明', panelX + 15, panelY + 12);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('WASD - 控制方向', panelX + 15, panelY + 38);
    ctx.fillText('空格 - 漂移/加速', panelX + 15, panelY + 58);
    ctx.fillText('躲避障碍，坚持越久分越高', panelX + 15, panelY + 78);
  }

  private drawGameOver(hud: HudData): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#FF3333';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FF3333';
    ctx.shadowBlur = 20;
    ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.fillText(`最终得分: ${Math.floor(hud.score)}`, this.width / 2, this.height / 2 + 10);

    ctx.fillStyle = COLORS.hudSubtext;
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText(`存活时间: ${this.formatTime(hud.survivalTime)}`, this.width / 2, this.height / 2 + 50);

    ctx.fillStyle = '#FF6B35';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText('按 R 键重新开始', this.width / 2, this.height / 2 + 90);
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    width: number, height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

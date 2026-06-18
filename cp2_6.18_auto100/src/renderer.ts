import type { CarState, SkidMark, ArenaState, Obstacle, GameState } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  public getCenter(): { x: number; y: number } {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }

  public render(
    car: CarState,
    skidMarks: SkidMark[],
    arena: ArenaState,
    obstacles: Obstacle[],
    game: GameState,
    edgeFlashing: boolean,
    diameterPercent: number
  ): void {
    const ctx = this.ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.fillStyle = '#0A0B1A';
    ctx.fillRect(0, 0, width, height);

    this.drawBackgroundStars();
    this.drawArena(arena, edgeFlashing);
    this.drawSkidMarks(skidMarks, game.lowFpsMode);
    this.drawObstacles(obstacles);
    this.drawCar(car);
    this.drawHUD(car, game, diameterPercent);
    this.drawControlsPanel();

    if (game.gameOver) {
      this.drawGameOver(car, game);
    }
  }

  private drawBackgroundStars(): void {
    const ctx = this.ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const starSeed = 137;
    for (let i = 0; i < 80; i++) {
      const x = ((i * 9301 + starSeed * 49297) % 233280) / 233280 * width;
      const y = ((i * 7919 + starSeed * 6271) % 233280) / 233280 * height;
      const size = ((i * 17) % 3) + 0.5;
      ctx.fillRect(x, y, size, size);
    }
  }

  private drawArena(arena: ArenaState, edgeFlashing: boolean): void {
    const ctx = this.ctx;
    const cx = arena.center.x;
    const cy = arena.center.y;
    const r = arena.currentRadius;

    ctx.save();
    const gradient = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
    gradient.addColorStop(0, '#1a1f4a');
    gradient.addColorStop(0.6, '#251a4a');
    gradient.addColorStop(1, '#18103a');

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(80, 100, 180, 0.15)';
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r / 5) * ring, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }

    if (edgeFlashing) {
      ctx.shadowColor = '#FF3333';
      ctx.shadowBlur = 25;
      ctx.strokeStyle = '#FF3333';
    } else {
      ctx.shadowColor = 'rgba(255,51,51,0.4)';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(255,51,51,0.6)';
    }
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  private drawSkidMarks(skidMarks: SkidMark[], lowFps: boolean): void {
    const ctx = this.ctx;
    const marks = lowFps ? skidMarks.filter((_, i) => i % 2 === 0) : skidMarks;
    for (const mark of marks) {
      ctx.save();
      ctx.translate(mark.x, mark.y);
      ctx.rotate(mark.angle);
      ctx.globalAlpha = mark.alpha;
      ctx.shadowColor = '#FF8800';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(-4, -2, 8, 4);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private drawObstacles(obstacles: Obstacle[]): void {
    const ctx = this.ctx;
    for (const obs of obstacles) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(
        obs.x - obs.radius * 0.3,
        obs.y - obs.radius * 0.3,
        obs.radius * 0.1,
        obs.x,
        obs.y,
        obs.radius
      );
      grad.addColorStop(0, '#4a4a4a');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(100,100,100,0.4)';
      ctx.lineWidth = 1;
      const gridStep = 6;
      ctx.beginPath();
      for (let gx = -obs.radius; gx <= obs.radius; gx += gridStep) {
        const yOffset = Math.sqrt(Math.max(0, obs.radius * obs.radius - gx * gx));
        ctx.moveTo(obs.x + gx, obs.y - yOffset);
        ctx.lineTo(obs.x + gx, obs.y + yOffset);
      }
      for (let gy = -obs.radius; gy <= obs.radius; gy += gridStep) {
        const xOffset = Math.sqrt(Math.max(0, obs.radius * obs.radius - gy * gy));
        ctx.moveTo(obs.x - xOffset, obs.y + gy);
        ctx.lineTo(obs.x + xOffset, obs.y + gy);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,100,50,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawCar(car: CarState): void {
    const ctx = this.ctx;
    const cx = car.position.x;
    const cy = car.position.y;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(car.angle);

    if (car.boostTime > 0) {
      ctx.shadowColor = '#FF6600';
      ctx.shadowBlur = 20;
    } else if (car.isDrifting) {
      ctx.shadowColor = '#FFAA00';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowColor = 'rgba(100,150,255,0.5)';
      ctx.shadowBlur = 6;
    }

    const bodyGrad = ctx.createLinearGradient(-14, 0, 14, 0);
    bodyGrad.addColorStop(0, '#FF4500');
    bodyGrad.addColorStop(0.5, '#FF8800');
    bodyGrad.addColorStop(1, '#FF4500');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(6, -7);
    ctx.lineTo(-12, -8);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-12, 8);
    ctx.lineTo(6, 7);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(-2, -4, 8, 8);

    ctx.fillStyle = '#111111';
    ctx.fillRect(-10, -10, 5, 3);
    ctx.fillRect(-10, 7, 5, 3);
    ctx.fillRect(4, -10, 5, 3);
    ctx.fillRect(4, 7, 5, 3);

    if (car.boostTime > 0) {
      const flameLen = 8 + Math.random() * 6;
      ctx.fillStyle = '#FF8800';
      ctx.beginPath();
      ctx.moveTo(-14, -3);
      ctx.lineTo(-14 - flameLen, 0);
      ctx.lineTo(-14, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFEE00';
      ctx.beginPath();
      ctx.moveTo(-14, -1.5);
      ctx.lineTo(-14 - flameLen * 0.6, 0);
      ctx.lineTo(-14, 1.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private drawHUD(car: CarState, game: GameState, diameterPercent: number): void {
    const ctx = this.ctx;
    const width = window.innerWidth;

    this.drawSpeedometer(70, 80, car.speed, 300);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${car.score}`, 140, 65);
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FF8844';
    ctx.fillText(`Lap: ${car.lapCount}`, 140, 90);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'right';
    const minutes = Math.floor(game.survivalTime / 60);
    const seconds = Math.floor(game.survivalTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillText(`Time: ${timeStr}`, width - 30, 45);

    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = diameterPercent <= 40 ? '#FF3333' : '#FF8844';
    ctx.fillText(`Platform: ${diameterPercent}%`, width - 30, 75);

    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = game.lowFpsMode ? '#FFAA44' : '#666666';
    ctx.textAlign = 'right';
    ctx.fillText(
      `FPS: ${Math.round(game.currentFps)}${game.lowFpsMode ? ' (Low Perf)' : ''}`,
      width - 30,
      100
    );
  }

  private drawSpeedometer(x: number, y: number, speed: number, maxSpeed: number): void {
    const ctx = this.ctx;
    const radius = 45;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#333344';
    ctx.lineWidth = 3;
    ctx.stroke();

    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const speedRatio = Math.min(speed / maxSpeed, 1);
    const gaugeAngle = startAngle + (endAngle - startAngle) * speedRatio;

    ctx.beginPath();
    ctx.arc(x, y, radius - 6, startAngle, gaugeAngle);
    ctx.strokeStyle = speed > maxSpeed * 0.8 ? '#FF3333' : '#FF6600';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    const pointerAngle = gaugeAngle;
    const pointerLen = radius - 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pointerAngle);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(pointerLen, 0);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fillStyle = '#FF4422';
    ctx.shadowColor = '#FF4422';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#222233';
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(speed)}`, x, y + radius + 18);
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#888888';
    ctx.fillText('u', x, y + radius + 30);

    ctx.restore();
  }

  private drawControlsPanel(): void {
    const ctx = this.ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const panelW = 180;
    const panelH = 130;
    const px = width - panelW - 25;
    const py = height - panelH - 25;

    ctx.save();
    ctx.beginPath();
    const radius = 12;
    ctx.moveTo(px + radius, py);
    ctx.lineTo(px + panelW - radius, py);
    ctx.quadraticCurveTo(px + panelW, py, px + panelW, py + radius);
    ctx.lineTo(px + panelW, py + panelH - radius);
    ctx.quadraticCurveTo(px + panelW, py + panelH, px + panelW - radius, py + panelH);
    ctx.lineTo(px + radius, py + panelH);
    ctx.quadraticCurveTo(px, py + panelH, px, py + panelH - radius);
    ctx.lineTo(px, py + radius);
    ctx.quadraticCurveTo(px, py, px + radius, py);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,136,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FF8844';
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Controls', px + 15, py + 25);

    ctx.fillStyle = '#CCCCCC';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText('W A S D  — Move', px + 15, py + 50);
    ctx.fillText('SPACE    — Drift', px + 15, py + 72);
    ctx.fillStyle = '#888888';
    ctx.font = '11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Release space for boost!', px + 15, py + 98);
    ctx.fillText('Avoid edges & obstacles', px + 15, py + 115);

    ctx.restore();
  }

  private drawGameOver(car: CarState, game: GameState): void {
    const ctx = this.ctx;
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#FF3333';
    ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF3333';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', width / 2, height / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '26px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Final Score: ${car.score}`, width / 2, height / 2 + 10);

    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FF8844';
    const minutes = Math.floor(game.survivalTime / 60);
    const seconds = Math.floor(game.survivalTime % 60);
    ctx.fillText(
      `Survived ${minutes}:${seconds.toString().padStart(2, '0')}  |  ${car.lapCount} Laps`,
      width / 2,
      height / 2 + 45
    );

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Press R to Restart', width / 2, height / 2 + 90);

    ctx.restore();
  }
}

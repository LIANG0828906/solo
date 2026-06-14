export interface Car {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  score: number;
  highScore: number;
  lives: number;
  roadOffset: number;
  player: Car;
  obstacles: Car[];
  particles: Particle[];
  debris: Debris[];
  isBoosting: boolean;
  boostTime: number;
  boostCooldown: number;
  flashTime: number;
  gameOver: boolean;
  gameStarted: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  private readonly ROAD_LEFT: number = 150;
  private readonly ROAD_RIGHT: number = 650;
  private readonly ROAD_WIDTH: number = 500;
  private readonly GRASS_COLOR: string = '#4ade80';
  private readonly ROAD_COLOR: string = '#374151';
  private readonly LANE_COLOR: string = '#ffffff';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public render(state: GameState): void {
    this.clear();
    this.drawGrass();
    this.drawRoad(state.roadOffset);
    this.drawObstacles(state.obstacles);
    this.drawPlayer(state.player, state.isBoosting);
    this.drawParticles(state.particles);
    this.drawDebris(state.debris);
    this.drawFlash(state.flashTime);
    this.drawHUD(state.score, state.highScore, state.lives, state.boostCooldown, state.isBoosting);
  }

  private clear(): void {
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawGrass(): void {
    this.ctx.fillStyle = this.GRASS_COLOR;
    this.ctx.fillRect(0, 0, this.ROAD_LEFT, this.canvas.height);
    this.ctx.fillRect(this.ROAD_RIGHT, 0, this.canvas.width - this.ROAD_RIGHT, this.canvas.height);
  }

  private drawRoad(roadOffset: number): void {
    this.ctx.fillStyle = this.ROAD_COLOR;
    this.ctx.fillRect(this.ROAD_LEFT, 0, this.ROAD_WIDTH, this.canvas.height);

    this.ctx.strokeStyle = '#fbbf24';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(this.ROAD_LEFT, 0);
    this.ctx.lineTo(this.ROAD_LEFT, this.canvas.height);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(this.ROAD_RIGHT, 0);
    this.ctx.lineTo(this.ROAD_RIGHT, this.canvas.height);
    this.ctx.stroke();

    this.ctx.strokeStyle = this.LANE_COLOR;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([20, 40]);

    const laneCount = 3;
    const laneWidth = this.ROAD_WIDTH / laneCount;
    for (let i = 1; i < laneCount; i++) {
      const x = this.ROAD_LEFT + laneWidth * i;
      const offset = roadOffset % 60;
      this.ctx.lineDashOffset = -offset;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    this.ctx.setLineDash([]);
  }

  private drawCar(car: Car, isPlayer: boolean = false): void {
    const { x, y, width, height, color } = car;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.roundRect(x - width / 2, y - height / 2, width, height, 6);
    this.ctx.fill();

    const windowColor = isPlayer ? '#60a5fa' : '#1f2937';
    const windowHeight = height * 0.3;
    const windowY = isPlayer ? y - height * 0.25 : y + height * 0.05;
    this.ctx.fillStyle = windowColor;
    this.ctx.beginPath();
    this.roundRect(x - width * 0.35, windowY - windowHeight / 2, width * 0.7, windowHeight, 3);
    this.ctx.fill();

    this.ctx.fillStyle = '#1f2937';
    const tireWidth = width * 0.18;
    const tireHeight = height * 0.18;
    const tireOffsetX = width * 0.32;
    const tireOffsetY = height * 0.32;

    this.ctx.fillRect(x - tireOffsetX - tireWidth / 2, y - tireOffsetY - tireHeight / 2, tireWidth, tireHeight);
    this.ctx.fillRect(x + tireOffsetX - tireWidth / 2, y - tireOffsetY - tireHeight / 2, tireWidth, tireHeight);
    this.ctx.fillRect(x - tireOffsetX - tireWidth / 2, y + tireOffsetY - tireHeight / 2, tireWidth, tireHeight);
    this.ctx.fillRect(x + tireOffsetX - tireWidth / 2, y + tireOffsetY - tireHeight / 2, tireWidth, tireHeight);

    if (isPlayer) {
      this.ctx.fillStyle = '#fef3c7';
      const headlightSize = width * 0.12;
      this.ctx.beginPath();
      this.ctx.arc(x - width * 0.3, y - height * 0.4, headlightSize, 0, Math.PI * 2);
      this.ctx.arc(x + width * 0.3, y - height * 0.4, headlightSize, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawPlayer(player: Car, isBoosting: boolean): void {
    if (isBoosting) {
      this.ctx.save();
      this.ctx.shadowColor = '#f97316';
      this.ctx.shadowBlur = 20;
    }
    this.drawCar(player, true);
    if (isBoosting) {
      this.ctx.restore();
    }
  }

  private drawObstacles(obstacles: Car[]): void {
    obstacles.forEach(obs => this.drawCar(obs, false));
  }

  private drawParticles(particles: Particle[]): void {
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }

  private drawDebris(debris: Debris[]): void {
    debris.forEach(d => {
      const alpha = d.life / d.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.translate(d.x, d.y);
      this.ctx.rotate(d.rotation);
      this.ctx.fillStyle = d.color;
      this.ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      this.ctx.restore();
    });
    this.ctx.globalAlpha = 1;
  }

  private drawFlash(flashTime: number): void {
    if (flashTime > 0) {
      this.ctx.fillStyle = `rgba(239, 68, 68, 0.3)`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private drawHUD(score: number, highScore: number, lives: number, boostCooldown: number, isBoosting: boolean): void {
    this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = '#ffffff';

    const scoreText = `得分: ${Math.floor(score)}`;
    this.ctx.strokeText(scoreText, this.canvas.width - 20, 40);
    this.ctx.fillText(scoreText, this.canvas.width - 20, 40);

    this.ctx.font = 'bold 16px "Segoe UI", sans-serif';
    const highText = `最高: ${Math.floor(highScore)}`;
    this.ctx.strokeText(highText, this.canvas.width - 20, 65);
    this.ctx.fillText(highText, this.canvas.width - 20, 65);

    this.ctx.textAlign = 'left';
    this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
    const livesText = `生命: ${'❤️'.repeat(lives)}`;
    this.ctx.strokeText(livesText, 20, 40);
    this.ctx.fillText(livesText, 20, 40);

    const barWidth = 120;
    const barHeight = 10;
    const barX = 20;
    const barY = 55;

    this.ctx.fillStyle = '#374151';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    let fillRatio = 0;
    let barColor = '#6b7280';
    if (isBoosting) {
      fillRatio = 1;
      barColor = '#f97316';
    } else if (boostCooldown > 0) {
      fillRatio = 1 - (boostCooldown / 3);
      barColor = '#3b82f6';
    } else {
      fillRatio = 1;
      barColor = '#22c55e';
    }

    this.ctx.fillStyle = barColor;
    this.ctx.fillRect(barX, barY, barWidth * fillRatio, barHeight);

    this.ctx.strokeStyle = '#1f2937';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);

    this.ctx.font = 'bold 12px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    const boostText = isBoosting ? '加速中!' : (boostCooldown > 0 ? '冷却中' : '空格加速');
    this.ctx.fillText(boostText, barX, barY + barHeight + 14);
  }

  public drawStartScreen(highScore: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.shadowColor = '#fbbf24';
    this.ctx.shadowBlur = 30;
    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('🏎️ 赛车避障', this.canvas.width / 2, 150);
    this.ctx.restore();

    this.ctx.font = '18px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('选择难度开始游戏', this.canvas.width / 2, 200);

    if (highScore > 0) {
      this.ctx.font = 'bold 20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.fillText(`最高分: ${Math.floor(highScore)}`, this.canvas.width / 2, 240);
    }

    this.ctx.font = '16px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#64748b';
    this.ctx.fillText('操作说明: WASD 移动 | 空格 加速', this.canvas.width / 2, 550);
  }

  public drawGameOverScreen(score: number, highScore: number, isNewRecord: boolean): void {
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = 'bold 48px "Segoe UI", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillText('游戏结束', this.canvas.width / 2, 180);

    this.ctx.font = 'bold 28px "Segoe UI", sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`最终得分: ${Math.floor(score)}`, this.canvas.width / 2, 250);

    if (isNewRecord) {
      this.ctx.save();
      this.ctx.shadowColor = '#fbbf24';
      this.ctx.shadowBlur = 15;
      this.ctx.font = 'bold 24px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.fillText('🎉 新纪录!', this.canvas.width / 2, 295);
      this.ctx.restore();
    } else {
      this.ctx.font = '20px "Segoe UI", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText(`最高分: ${Math.floor(highScore)}`, this.canvas.width / 2, 295);
    }
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
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

  public getRoadBounds(): { left: number; right: number } {
    return { left: this.ROAD_LEFT, right: this.ROAD_RIGHT };
  }
}

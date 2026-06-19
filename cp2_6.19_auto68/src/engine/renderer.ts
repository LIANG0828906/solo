import {
  Ball,
  Paddle,
  Brick,
  PowerUp,
  Particle,
  PHYSICS_CONSTANTS,
  GameState
} from './physics';
import { BRICK_HP_COLORS } from './levelGenerator';

export type ScreenType = 'title' | 'playing' | 'gameover' | 'levelcomplete';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

const POWERUP_COLORS: Record<string, string> = {
  expand: '#22c55e',
  multiball: '#3b82f6',
  piercing: '#facc15'
};

const POWERUP_LABELS: Record<string, string> = {
  expand: 'W',
  multiball: 'M',
  piercing: 'P'
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.initStars();
  }

  private initStars(): void {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  private drawBackground(time: number): void {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#000000');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const star of this.stars) {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
      const alpha = star.brightness * (0.5 + twinkle * 0.5);
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
    }
  }

  private drawBoundary(): void {
    const ctx = this.ctx;
    const { PLAY_TOP, PLAY_BOTTOM, PLAY_LEFT, PLAY_RIGHT } = PHYSICS_CONSTANTS;

    ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PLAY_LEFT, PLAY_TOP);
    ctx.lineTo(PLAY_RIGHT, PLAY_TOP);
    ctx.lineTo(PLAY_RIGHT, PLAY_BOTTOM);
    ctx.lineTo(PLAY_LEFT, PLAY_BOTTOM);
    ctx.closePath();
    ctx.stroke();
  }

  private drawBall(ball: Ball, time: number): void {
    if (!ball.active) return;
    const ctx = this.ctx;

    if (ball.piercing) {
      const glow = Math.sin(time * 8) * 0.3 + 0.7;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `rgba(250, 204, 21, ${glow})`;
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    }

    const gradient = ctx.createRadialGradient(
      ball.x - ball.radius * 0.3,
      ball.y - ball.radius * 0.3,
      0,
      ball.x,
      ball.y,
      ball.radius
    );
    if (ball.piercing) {
      gradient.addColorStop(0, '#fef08a');
      gradient.addColorStop(0.5, '#facc15');
      gradient.addColorStop(1, '#ca8a04');
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#e0e7ff');
      gradient.addColorStop(1, '#818cf8');
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawPaddle(paddle: Paddle): void {
    const ctx = this.ctx;

    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(200, 200, 220, 0.6)';

    const gradient = ctx.createLinearGradient(
      paddle.x,
      paddle.y,
      paddle.x,
      paddle.y + paddle.height
    );
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(0.5, '#a0a0b0');
    gradient.addColorStop(1, '#606070');

    const radius = paddle.height / 2;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, radius);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawBrick(brick: Brick): void {
    if (!brick.active) return;
    const ctx = this.ctx;

    const colors = BRICK_HP_COLORS[Math.min(brick.hp, 3)];
    const gradient = ctx.createLinearGradient(
      brick.x,
      brick.y,
      brick.x,
      brick.y + brick.height
    );
    gradient.addColorStop(0, colors[1]);
    gradient.addColorStop(1, colors[0]);

    ctx.shadowBlur = 8;
    ctx.shadowColor = `${colors[0]}80`;

    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (brick.hp > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        brick.hp.toString(),
        brick.x + brick.width / 2,
        brick.y + brick.height / 2
      );
    }
  }

  private drawPowerUp(powerUp: PowerUp, time: number): void {
    if (!powerUp.active) return;
    const ctx = this.ctx;
    const cx = powerUp.x + powerUp.width / 2;
    const cy = powerUp.y + powerUp.height / 2;

    const glow = Math.sin(time * 5 + powerUp.x) * 0.3 + 0.7;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `${POWERUP_COLORS[powerUp.type]}${Math.floor(glow * 255).toString(16).padStart(2, '0')}`;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(powerUp.rotation);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, powerUp.width / 2);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, POWERUP_COLORS[powerUp.type]);
    gradient.addColorStop(1, POWERUP_COLORS[powerUp.type]);

    ctx.beginPath();
    ctx.arc(0, 0, powerUp.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.rotate(-powerUp.rotation);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUP_LABELS[powerUp.type], 0, 0);

    ctx.restore();
  }

  private drawParticle(particle: Particle): void {
    const ctx = this.ctx;
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      particle.size * alpha,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawHeart(x: number, y: number, size: number, filled: boolean): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 20, size / 20);

    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.bezierCurveTo(-10, -5, -10, -12, 0, -5);
    ctx.bezierCurveTo(10, -12, 10, -5, 0, 5);
    ctx.closePath();

    if (filled) {
      const gradient = ctx.createLinearGradient(0, -10, 0, 5);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(1, '#dc2626');
      ctx.fillStyle = gradient;
      ctx.fill();
    } else {
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawUI(state: GameState): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH } = PHYSICS_CONSTANTS;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (state.scorePopup) {
      const scale = 1 + state.scorePopup.scale * 0.5;
      ctx.save();
      ctx.translate(state.scorePopup.x, state.scorePopup.y);
      ctx.scale(scale, scale);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = state.scorePopup.life;
      ctx.fillText(`+${state.scorePopup.value}`, 0, 0);
      ctx.restore();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`分数: ${state.score}`, 20, 18);

    ctx.textAlign = 'center';
    ctx.fillText(`第 ${state.level} 关`, CANVAS_WIDTH / 2, 18);

    for (let i = 0; i < 3; i++) {
      this.drawHeart(CANVAS_WIDTH - 35 - i * 32, 28, 24, i < state.lives);
    }

    ctx.fillStyle = 'rgba(180, 180, 220, 0.7)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      '移动鼠标控制挡板，击碎所有砖块过关',
      CANVAS_WIDTH / 2,
      PHYSICS_CONSTANTS.CANVAS_HEIGHT - 12
    );
  }

  drawTitleScreen(time: number): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;

    this.drawBackground(time);

    const glow = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.shadowBlur = 30;
    ctx.shadowColor = `rgba(100, 150, 255, ${glow})`;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('弹球闯关', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    ctx.shadowBlur = 0;

    const blink = Math.sin(time * 3) * 0.4 + 0.6;
    ctx.fillStyle = `rgba(180, 200, 255, ${blink})`;
    ctx.font = '22px sans-serif';
    ctx.fillText('点击任意处开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

    ctx.fillStyle = 'rgba(150, 180, 220, 0.6)';
    ctx.font = '15px sans-serif';
    ctx.fillText('移动鼠标控制挡板', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
    ctx.fillText('击碎所有砖块即可过关', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
  }

  drawGameOver(score: number, time: number): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;

    this.drawBackground(time);

    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 80, 80, 0.7)';

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`最终得分: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

    const btnX = CANVAS_WIDTH / 2 - 80;
    const btnY = CANVAS_HEIGHT / 2 + 50;
    const btnW = 160;
    const btnH = 50;

    this.drawButton(btnX, btnY, btnW, btnH, '重新开始', time, false);
  }

  drawLevelComplete(state: GameState, time: number, celebrationParticles: Particle[]): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;

    this.drawBackground(time);
    this.drawBricks(state.bricks);
    this.drawPaddle(state.paddle);
    for (const particle of celebrationParticles) {
      this.drawParticle(particle);
    }

    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(100, 255, 150, 0.8)';

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${state.level} 关完成!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    ctx.shadowBlur = 0;

    const blink = Math.sin(time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(200, 255, 200, ${blink})`;
    ctx.font = '20px sans-serif';
    ctx.fillText('准备进入下一关...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }

  private drawButton(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    _time: number,
    hover: boolean
  ): void {
    const ctx = this.ctx;

    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    if (hover) {
      gradient.addColorStop(0, '#fde047');
      gradient.addColorStop(1, '#ca8a04');
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(250, 204, 21, 0.7)';
    } else {
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#4338ca');
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
    }

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = hover ? '#fef08a' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
  }

  private drawBricks(bricks: Brick[]): void {
    for (const brick of bricks) {
      this.drawBrick(brick);
    }
  }

  render(
    state: GameState,
    time: number,
    celebrationParticles: Particle[] = []
  ): void {
    this.drawBackground(time);
    this.drawBoundary();

    for (const brick of state.bricks) {
      this.drawBrick(brick);
    }

    for (const particle of state.particles) {
      this.drawParticle(particle);
    }

    for (const particle of celebrationParticles) {
      this.drawParticle(particle);
    }

    for (const powerUp of state.powerUps) {
      this.drawPowerUp(powerUp, time);
    }

    this.drawPaddle(state.paddle);

    for (const ball of state.balls) {
      this.drawBall(ball, time);
    }

    this.drawUI(state);
  }

  isButtonClicked(mx: number, my: number): boolean {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = PHYSICS_CONSTANTS;
    const btnX = CANVAS_WIDTH / 2 - 80;
    const btnY = CANVAS_HEIGHT / 2 + 50;
    return mx >= btnX && mx <= btnX + 160 && my >= btnY && my <= btnY + 50;
  }

  isButtonHovered(mx: number, my: number): boolean {
    return this.isButtonClicked(mx, my);
  }
}

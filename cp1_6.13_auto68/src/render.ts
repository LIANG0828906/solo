import type { GameState, Paddle, Ball, Particle } from './logic';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export class Renderer {
  render(ctx: CanvasRenderingContext2D, state: GameState): void {
    this.clearCanvas(ctx);
    this.drawBackground(ctx);
    this.drawCenterLine(ctx);
    this.drawTrail(ctx, state.trail);
    this.drawPaddle(ctx, state.leftPaddle, '#0f3460', '#1a5276');
    this.drawPaddle(ctx, state.rightPaddle, '#e94560', '#c0392b');
    this.drawBall(ctx, state.ball);
    this.drawParticles(ctx, state.particles);
    this.drawScore(ctx, state);
    this.drawStatusText(ctx, state);
    this.drawFlash(ctx, state);
  }

  private clearCanvas(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_WIDTH - 2, CANVAS_HEIGHT - 2);
  }

  private drawCenterLine(ctx: CanvasRenderingContext2D): void {
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: { x: number; y: number }[]): void {
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      const alpha = (1 - i / trail.length) * 0.3;
      const size = 12 * (1 - i / trail.length * 0.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle, colorStart: string, colorEnd: string): void {
    const gradient = ctx.createLinearGradient(
      paddle.x,
      paddle.y,
      paddle.x + paddle.width,
      paddle.y
    );
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 4);
    ctx.fill();

    ctx.shadowColor = colorStart;
    ctx.shadowBlur = 15;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(ball.x - 3, ball.y - 3, ball.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawScore(ctx: CanvasRenderingContext2D, state: GameState): void {
    const centerX = CANVAS_WIDTH / 2;
    const y = 40;

    ctx.font = 'bold 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    const leftScale = state.scoreAnimation.active && state.scoreAnimation.side === 'left'
      ? state.scoreAnimation.scale
      : 1;
    const rightScale = state.scoreAnimation.active && state.scoreAnimation.side === 'right'
      ? state.scoreAnimation.scale
      : 1;

    ctx.save();
    ctx.translate(centerX - 50, y);
    ctx.scale(leftScale, leftScale);
    ctx.fillText(state.scores.left.toString(), 0, 0);
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(':', centerX, y);

    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.translate(centerX + 50, y);
    ctx.scale(rightScale, rightScale);
    ctx.fillText(state.scores.right.toString(), 0, 0);
    ctx.restore();
  }

  private drawStatusText(ctx: CanvasRenderingContext2D, state: GameState): void {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    ctx.font = 'bold 36px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state.status === 'idle') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Press any key to start', centerX, centerY);
      ctx.font = '18px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('W/S for Player 1 | Arrow keys for Player 2', centerX, centerY + 40);
    } else if (state.status === 'paused') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('PAUSED', centerX, centerY);
      ctx.font = '18px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Press Space to continue', centerX, centerY + 40);
    } else if (state.status === 'ended') {
      const winnerText = state.winner === 'left' ? 'Player 1 Wins!' : 'Player 2 Wins!';
      const winnerColor = state.winner === 'left' ? '#0f3460' : '#e94560';

      ctx.fillStyle = winnerColor;
      ctx.shadowColor = winnerColor;
      ctx.shadowBlur = 20;
      ctx.fillText(winnerText, centerX, centerY - 20);
      ctx.shadowBlur = 0;

      ctx.font = '18px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Press R to restart', centerX, centerY + 30);
    }
  }

  private drawFlash(ctx: CanvasRenderingContext2D, state: GameState): void {
    if (state.flashEffect.active && state.flashEffect.alpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${state.flashEffect.alpha})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }
}

export const renderer = new Renderer();

import { Ball } from './ball';
import { Paddle } from './paddle';
import { ParticlePool } from './particle';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const WINNING_SCORE = 5;
const WIN_MASK_FADE_IN = 0.5;
const WIN_MASK_FADE_OUT = 0.3;

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  private leftPaddle: Paddle;
  private rightPaddle: Paddle;
  private particlePool: ParticlePool;

  private leftScore: number = 0;
  private rightScore: number = 0;

  private gameOver: boolean = false;
  private winner: string | null = null;
  private winMaskAlpha: number = 0;
  private winMaskDirection: 'in' | 'out' | 'none' = 'none';
  private winTextOffset: number = -CANVAS_WIDTH;
  private showRestartButton: boolean = false;

  private lastTime: number = 0;

  private keys: { [key: string]: boolean } = {};

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context not available');
    }
    this.ctx = ctx;

    this.ball = new Ball(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.leftPaddle = new Paddle('left', CANVAS_WIDTH, CANVAS_HEIGHT);
    this.rightPaddle = new Paddle('right', CANVAS_WIDTH, CANVAS_HEIGHT);
    this.particlePool = new ParticlePool(50);

    this.setupEventListeners();
    this.updatePaddleColors();
    this.start();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyW' || e.code === 'KeyS') {
        e.preventDefault();
      }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.gameOver && this.showRestartButton) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const btnX = CANVAS_WIDTH / 2 - 80;
        const btnY = CANVAS_HEIGHT / 2 + 40;
        const btnW = 160;
        const btnH = 44;

        if (x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH) {
          this.restartGame();
        }
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.gameOver && this.showRestartButton) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const btnX = CANVAS_WIDTH / 2 - 80;
        const btnY = CANVAS_HEIGHT / 2 + 40;
        const btnW = 160;
        const btnH = 44;

        const isHover = x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH;
        this.canvas.style.cursor = isHover ? 'pointer' : 'default';
      }
    });
  }

  private start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 1 / 30);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    if (!this.gameOver || this.winMaskDirection !== 'none') {
      this.handleInput();
      this.leftPaddle.update(deltaTime);
      this.rightPaddle.update(deltaTime);
    }

    if (!this.gameOver) {
      const collision = this.ball.update(deltaTime, this.leftPaddle.getRect(), this.rightPaddle.getRect());

      if (collision.hitPaddle && collision.paddleSide) {
        this.particlePool.emit(
          collision.hitX,
          collision.hitY,
          15,
          this.ball.color,
          collision.normalAngle,
          Math.PI / 3,
          2,
          5,
          0.4
        );
        this.updatePaddleColors();
      }

      const outOfBounds = this.ball.isOutOfBounds();
      if (outOfBounds) {
        if (outOfBounds === 'left') {
          this.rightScore++;
          if (this.rightScore >= WINNING_SCORE) {
            this.triggerWin('玩家2');
          }
        } else {
          this.leftScore++;
          if (this.leftScore >= WINNING_SCORE) {
            this.triggerWin('玩家1');
          }
        }
        if (!this.gameOver) {
          this.ball.resetToCenter();
        }
      }
    }

    this.particlePool.update(deltaTime);
    this.updateWinMask(deltaTime);
  }

  private updatePaddleColors(): void {
    this.leftPaddle.setColor(this.ball.color);
    this.rightPaddle.setColor(this.ball.color);
  }

  private handleInput(): void {
    this.leftPaddle.setUp(this.keys['KeyW'] || false);
    this.leftPaddle.setDown(this.keys['KeyS'] || false);

    this.rightPaddle.setUp(this.keys['ArrowUp'] || false);
    this.rightPaddle.setDown(this.keys['ArrowDown'] || false);
  }

  private triggerWin(winner: string): void {
    this.gameOver = true;
    this.winner = winner;
    this.winMaskDirection = 'in';
    this.winTextOffset = -CANVAS_WIDTH;
    this.showRestartButton = false;
  }

  private updateWinMask(deltaTime: number): void {
    if (this.winMaskDirection === 'in') {
      this.winMaskAlpha += deltaTime / WIN_MASK_FADE_IN;
      if (this.winMaskAlpha >= 0.7) {
        this.winMaskAlpha = 0.7;
        this.winMaskDirection = 'none';
        this.showRestartButton = true;
      }
    } else if (this.winMaskDirection === 'out') {
      this.winMaskAlpha -= deltaTime / WIN_MASK_FADE_OUT;
      if (this.winMaskAlpha <= 0) {
        this.winMaskAlpha = 0;
        this.winMaskDirection = 'none';
      }
    }

    if (this.winMaskAlpha > 0.3 && this.gameOver) {
      const targetOffset = 0;
      this.winTextOffset += (targetOffset - this.winTextOffset) * 0.1;
      if (Math.abs(this.winTextOffset - targetOffset) < 0.5) {
        this.winTextOffset = targetOffset;
      }
    }
  }

  private restartGame(): void {
    this.leftScore = 0;
    this.rightScore = 0;
    this.gameOver = false;
    this.winner = null;
    this.winMaskDirection = 'out';
    this.showRestartButton = false;
    this.ball.resetToCenter();
    this.leftPaddle = new Paddle('left', CANVAS_WIDTH, CANVAS_HEIGHT);
    this.rightPaddle = new Paddle('right', CANVAS_WIDTH, CANVAS_HEIGHT);
    this.updatePaddleColors();
  }

  private render(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBackground();
    this.drawCenterLine();
    this.drawTitle();
    this.drawScores();

    this.leftPaddle.render(this.ctx);
    this.rightPaddle.render(this.ctx);

    this.particlePool.render(this.ctx);

    this.ball.render(this.ctx);

    this.drawInstructions();

    if (this.winMaskAlpha > 0) {
      this.drawWinOverlay();
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#1a1a4e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }
  }

  private drawCenterLine(): void {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 5;
    this.ctx.setLineDash([15, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH / 2, 0);
    this.ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawTitle(): void {
    this.ctx.save();
    this.ctx.font = 'bold 20px "Courier New", Consolas, monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    this.ctx.fillText('弹球对决', CANVAS_WIDTH / 2, 35);
    this.ctx.restore();
  }

  private drawScores(): void {
    this.ctx.save();
    this.ctx.font = 'bold 28px "Courier New", Consolas, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    this.ctx.shadowColor = '#000000';
    this.ctx.shadowOffsetX = 3;
    this.ctx.shadowOffsetY = 3;
    this.ctx.fillStyle = '#ffffff';

    this.ctx.fillText(String(this.leftScore), CANVAS_WIDTH / 4, 60);
    this.ctx.fillText(String(this.rightScore), (CANVAS_WIDTH * 3) / 4, 60);

    this.ctx.restore();
  }

  private drawInstructions(): void {
    this.ctx.save();
    this.ctx.font = '12px "Courier New", Consolas, monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.textAlign = 'center';

    this.ctx.fillText('玩家1: W / S    |    玩家2: ↑ / ↓', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);

    this.ctx.restore();
  }

  private drawWinOverlay(): void {
    this.ctx.save();

    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.winMaskAlpha})`;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (this.winner && this.winMaskAlpha > 0.2) {
      const textAlpha = Math.min(1, (this.winMaskAlpha - 0.2) / 0.3);

      this.ctx.save();
      this.ctx.globalAlpha = textAlpha;
      this.ctx.font = 'bold 48px "Courier New", Consolas, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      const gradient = this.ctx.createLinearGradient(
        CANVAS_WIDTH / 2 - 150,
        0,
        CANVAS_WIDTH / 2 + 150,
        0
      );
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.5, '#FFF8DC');
      gradient.addColorStop(1, '#FFD700');
      this.ctx.fillStyle = gradient;

      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 20;

      const textX = CANVAS_WIDTH / 2 + this.winTextOffset;
      const textY = CANVAS_HEIGHT / 2 - 30;

      this.ctx.fillText(`${this.winner} 胜利!`, textX, textY);
      this.ctx.restore();
    }

    if (this.showRestartButton) {
      this.drawRestartButton();
    }

    this.ctx.restore();
  }

  private drawRestartButton(): void {
    const btnX = CANVAS_WIDTH / 2 - 80;
    const btnY = CANVAS_HEIGHT / 2 + 40;
    const btnW = 160;
    const btnH = 44;

    this.ctx.save();

    this.ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';
    this.ctx.shadowColor = '#4ECDC4';
    this.ctx.shadowBlur = 10;

    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    this.ctx.fill();

    this.ctx.font = 'bold 18px "Courier New", Consolas, monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('再来一局', CANVAS_WIDTH / 2, btnY + btnH / 2);

    this.ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

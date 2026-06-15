import { Ball } from './Ball';
import { Brick } from './Brick';
import { Paddle } from './Paddle';
import { ScoreManager } from './ScoreManager';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BG_COLOR = '#1e293b';
const UI_BG_COLOR = '#00000050';
const UI_HEIGHT = 48;

const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 25;
const BRICK_COLS = 10;
const BRICK_ROWS_INIT = 6;
const BRICK_ROW_GAP = 8;
const BRICK_COL_GAP = 10;
const BRICK_TOP_OFFSET = 80;

const PADDLE_WIDTH_INIT = 120;
const PADDLE_HEIGHT = 16;
const PADDLE_Y = CANVAS_HEIGHT - 40;

const BALL_RADIUS = 8;
const BALL_SPEED_Y_INIT = 5;
const BALL_SPEED_Y_MAX = 8;

const BRICK_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
];

interface FlashEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

interface BorderFlash {
  startTime: number;
  duration: number;
}

type GameState = 'ready' | 'playing' | 'gameover' | 'levelcomplete';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ball: Ball;
  private paddle: Paddle;
  private bricks: Brick[] = [];
  private scoreManager: ScoreManager;

  private gameState: GameState = 'ready';
  private lastTime: number = 0;
  private animationId: number = 0;

  private flashes: FlashEffect[] = [];
  private borderFlash: BorderFlash | null = null;

  private ballLaunched: boolean = false;
  private isCombo: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.paddle = new Paddle(
      CANVAS_WIDTH / 2 - PADDLE_WIDTH_INIT / 2,
      PADDLE_Y,
      PADDLE_WIDTH_INIT,
      PADDLE_HEIGHT,
      CANVAS_WIDTH
    );

    this.ball = new Ball(CANVAS_WIDTH / 2, PADDLE_Y - BALL_RADIUS - 20, BALL_RADIUS);

    this.scoreManager = new ScoreManager();

    this.setupEventListeners();
    this.initBricks();
    this.start();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.paddle.handleKeyDown(e.key);
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.handleAction();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.paddle.handleKeyUp(e.key);
      }
    });
  }

  private handleAction(): void {
    if (this.gameState === 'ready') {
      this.launchBall();
    } else if (this.gameState === 'gameover') {
      this.resetGame();
    } else if (this.gameState === 'levelcomplete') {
      this.nextLevel();
    }
  }

  private initBricks(): void {
    this.bricks = [];
    const level = this.scoreManager.getLevel();
    const rows = Math.min(BRICK_ROWS_INIT + (level - 1), 10);

    const totalBricksWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_COL_GAP;
    const startX = (CANVAS_WIDTH - totalBricksWidth) / 2;

    for (let row = 0; row < rows; row++) {
      const colorIndex = Math.min(row, BRICK_COLORS.length - 1);
      const color = this.getBrickColor(row, rows);

      for (let col = 0; col < BRICK_COLS; col++) {
        const x = startX + col * (BRICK_WIDTH + BRICK_COL_GAP);
        const y = BRICK_TOP_OFFSET + UI_HEIGHT + row * (BRICK_HEIGHT + BRICK_ROW_GAP);
        const brick = new Brick(x, y, BRICK_WIDTH, BRICK_HEIGHT, color);
        this.bricks.push(brick);
      }
    }
  }

  private getBrickColor(row: number, totalRows: number): string {
    if (totalRows <= BRICK_COLORS.length) {
      return BRICK_COLORS[row % BRICK_COLORS.length];
    }

    const t = row / (totalRows - 1);
    const colorIndex = t * (BRICK_COLORS.length - 1);
    const index = Math.floor(colorIndex);
    const fraction = colorIndex - index;

    if (index >= BRICK_COLORS.length - 1) {
      return BRICK_COLORS[BRICK_COLORS.length - 1];
    }

    return this.lerpColor(
      BRICK_COLORS[index],
      BRICK_COLORS[index + 1],
      fraction
    );
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private launchBall(): void {
    this.gameState = 'playing';
    this.ballLaunched = true;
    this.isCombo = false;
    const angle = (Math.random() - 0.5) * (Math.PI / 4);
    this.ball.vx = Math.sin(angle) * 3;
    this.ball.vy = BALL_SPEED_Y_INIT;
  }

  private resetBall(): void {
    this.ballLaunched = false;
    this.ball.x = this.paddle.getCenterX();
    this.ball.y = PADDLE_Y - BALL_RADIUS - 20;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.scoreManager.resetCombo();
  }

  private resetGame(): void {
    this.scoreManager.reset();
    this.paddle.reset(CANVAS_WIDTH / 2, PADDLE_WIDTH_INIT);
    this.ball.setVerticalSpeed(BALL_SPEED_Y_INIT);
    this.bricks = [];
    this.flashes = [];
    this.borderFlash = null;
    this.initBricks();
    this.resetBall();
    this.gameState = 'ready';
  }

  private nextLevel(): void {
    this.scoreManager.nextLevel();

    const currentVy = Math.abs(this.ball.vy);
    const newVy = Math.min(currentVy + 0.5, BALL_SPEED_Y_MAX);
    this.ball.setVerticalSpeed(newVy);

    const newPaddleWidth = Math.max(PADDLE_WIDTH_INIT - (this.scoreManager.getLevel() - 1) * 10, 80);
    this.paddle.setWidth(newPaddleWidth);

    this.initBricks();
    this.resetBall();
    this.gameState = 'ready';
  }

  private start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();

    this.update(currentTime);
    this.render(currentTime);

    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  private update(currentTime: number): void {
    this.paddle.update(currentTime);

    if (this.gameState === 'playing' && this.ballLaunched) {
      this.ball.update();
      this.checkWallCollisions();
      this.checkPaddleCollision();
      this.checkBrickCollisions(currentTime);
      this.checkBottomCollision();
      this.checkLevelComplete();
    } else if (!this.ballLaunched && this.gameState !== 'gameover' && this.gameState !== 'levelcomplete') {
      this.ball.x = this.paddle.getCenterX();
      this.ball.y = PADDLE_Y - BALL_RADIUS - 20;
    }

    this.updateFlashes(currentTime);
    this.cleanupBricks(currentTime);
  }

  private checkWallCollisions(): void {
    if (this.ball.x - this.ball.radius <= 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx = Math.abs(this.ball.vx);
    } else if (this.ball.x + this.ball.radius >= CANVAS_WIDTH) {
      this.ball.x = CANVAS_WIDTH - this.ball.radius;
      this.ball.vx = -Math.abs(this.ball.vx);
    }

    if (this.ball.y - this.ball.radius <= UI_HEIGHT) {
      this.ball.y = UI_HEIGHT + this.ball.radius;
      this.ball.vy = Math.abs(this.ball.vy);
    }
  }

  private checkPaddleCollision(): void {
    if (
      this.ball.y + this.ball.radius >= this.paddle.getTop() &&
      this.ball.y - this.ball.radius <= this.paddle.getBottom() &&
      this.ball.x + this.ball.radius >= this.paddle.getLeft() &&
      this.ball.x - this.ball.radius <= this.paddle.getRight() &&
      this.ball.vy > 0
    ) {
      this.ball.y = this.paddle.getTop() - this.ball.radius;

      const hitPoint = (this.ball.x - this.paddle.getCenterX()) / (this.paddle.width / 2);
      const maxAngle = Math.PI / 3;
      const angle = hitPoint * maxAngle;

      const speed = this.ball.getSpeed();
      this.ball.vx = Math.sin(angle) * speed;
      this.ball.vy = -Math.abs(Math.cos(angle) * speed);

      if (this.ball.vx > 3) this.ball.vx = 3;
      if (this.ball.vx < -3) this.ball.vx = -3;

      this.isCombo = false;
      this.scoreManager.resetCombo();
    }
  }

  private checkBrickCollisions(currentTime: number): void {
    for (const brick of this.bricks) {
      if (brick.isDestroyed) continue;

      if (this.checkBallBrickCollision(brick)) {
        const destroyed = brick.hit();
        if (destroyed) {
          this.addFlash(brick.getCenterX(), brick.getCenterY());
          this.scoreManager.addScore(this.isCombo);
          this.isCombo = true;
        }
        break;
      }
    }
  }

  private checkBallBrickCollision(brick: Brick): boolean {
    const closestX = Math.max(brick.getLeft(), Math.min(this.ball.x, brick.getRight()));
    const closestY = Math.max(brick.getTop(), Math.min(this.ball.y, brick.getBottom()));

    const dx = this.ball.x - closestX;
    const dy = this.ball.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared <= this.ball.radius * this.ball.radius) {
      const overlapLeft = this.ball.x + this.ball.radius - brick.getLeft();
      const overlapRight = brick.getRight() - (this.ball.x - this.ball.radius);
      const overlapTop = this.ball.y + this.ball.radius - brick.getTop();
      const overlapBottom = brick.getBottom() - (this.ball.y - this.ball.radius);

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        this.ball.vx = -this.ball.vx;
        if (overlapLeft < overlapRight) {
          this.ball.x = brick.getLeft() - this.ball.radius;
        } else {
          this.ball.x = brick.getRight() + this.ball.radius;
        }
      } else {
        this.ball.vy = -this.ball.vy;
        if (overlapTop < overlapBottom) {
          this.ball.y = brick.getTop() - this.ball.radius;
        } else {
          this.ball.y = brick.getBottom() + this.ball.radius;
        }
      }

      const hitOffsetX = (this.ball.x - brick.getCenterX()) / (brick.width / 2);
      const maxAngleOffset = Math.PI / 3;
      const angleOffset = hitOffsetX * maxAngleOffset * 0.5;

      const speed = this.ball.getSpeed();
      const currentAngle = Math.atan2(this.ball.vy, this.ball.vx);
      const newAngle = currentAngle + angleOffset * 0.3;

      this.ball.vx = Math.cos(newAngle) * speed;
      this.ball.vy = Math.sin(newAngle) * speed;

      if (this.ball.vx > 3) this.ball.vx = 3;
      if (this.ball.vx < -3) this.ball.vx = -3;

      return true;
    }

    return false;
  }

  private checkBottomCollision(): void {
    if (this.ball.y + this.ball.radius >= CANVAS_HEIGHT) {
      const gameOver = this.scoreManager.loseLife();
      if (gameOver) {
        this.gameState = 'gameover';
      } else {
        this.borderFlash = {
          startTime: performance.now(),
          duration: 300,
        };
        this.resetBall();
        this.gameState = 'ready';
      }
    }
  }

  private checkLevelComplete(): void {
    const remainingBricks = this.bricks.filter(b => !b.isDestroyed).length;
    if (remainingBricks === 0) {
      this.gameState = 'levelcomplete';
    }
  }

  private addFlash(x: number, y: number): void {
    this.flashes.push({
      x,
      y,
      startTime: performance.now(),
      duration: 200,
    });
  }

  private updateFlashes(currentTime: number): void {
    this.flashes = this.flashes.filter(flash => {
      const elapsed = currentTime - flash.startTime;
      return elapsed < flash.duration;
    });

    if (this.borderFlash) {
      const elapsed = currentTime - this.borderFlash.startTime;
      if (elapsed >= this.borderFlash.duration) {
        this.borderFlash = null;
      }
    }
  }

  private cleanupBricks(currentTime: number): void {
    this.bricks = this.bricks.filter(brick => {
      if (!brick.isDestroyed) return true;
      if (brick.destroyStartTime === null) return true;
      const elapsed = currentTime - brick.destroyStartTime;
      return elapsed < brick.destroyDuration;
    });
  }

  private render(currentTime: number): void {
    this.ctx.fillStyle = BG_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawUI();

    for (const brick of this.bricks) {
      brick.draw(this.ctx, currentTime);
    }

    this.paddle.draw(this.ctx);
    this.ball.draw(this.ctx);

    this.drawFlashes(currentTime);
    this.drawBorderFlash(currentTime);

    if (this.gameState === 'gameover') {
      this.drawGameOver();
    } else if (this.gameState === 'levelcomplete') {
      this.drawLevelComplete();
    } else if (this.gameState === 'ready') {
      this.drawReadyText();
    }
  }

  private drawUI(): void {
    this.ctx.fillStyle = UI_BG_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, UI_HEIGHT);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textBaseline = 'middle';

    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.scoreManager.getScore()}`, 20, UI_HEIGHT / 2);

    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      `Level: ${this.scoreManager.getLevel()}  Lives: ${this.scoreManager.getLives()}`,
      CANVAS_WIDTH - 20,
      UI_HEIGHT / 2
    );
  }

  private drawFlashes(currentTime: number): void {
    for (const flash of this.flashes) {
      const elapsed = currentTime - flash.startTime;
      const progress = Math.min(elapsed / flash.duration, 1);
      const eased = this.easeOut(progress);

      const radius = 10 + eased * 30;
      const alpha = 0.8 * (1 - eased);

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.closePath();
      this.ctx.restore();
    }
  }

  private drawBorderFlash(currentTime: number): void {
    if (!this.borderFlash) return;

    const elapsed = currentTime - this.borderFlash.startTime;
    const progress = Math.min(elapsed / this.borderFlash.duration, 1);
    const alpha = 1 - this.easeOut(progress);

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
    this.ctx.restore();
  }

  private drawGameOver(): void {
    this.ctx.fillStyle = '#00000080';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Final Score: ${this.scoreManager.getScore()}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 30
    );

    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press Space or Enter to Restart',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 80
    );
  }

  private drawLevelComplete(): void {
    this.ctx.fillStyle = '#00000080';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Level Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `Score: ${this.scoreManager.getScore()}`,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 20
    );

    this.ctx.font = '20px Arial';
    this.ctx.fillText(
      'Press Space or Enter for Next Level',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 70
    );
  }

  private drawReadyText(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      'Press Space or Enter to Start',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2
    );
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

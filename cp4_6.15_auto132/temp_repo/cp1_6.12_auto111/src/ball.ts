export const BALL_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
];

export interface BallCollisionResult {
  hitPaddle: boolean;
  paddleSide: 'left' | 'right' | null;
  hitX: number;
  hitY: number;
  normalAngle: number;
}

export class Ball {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  radius: number = 8;
  color: string = '#ffffff';

  private initialSpeed: number = 4;
  private speedMultiplier: number = 1.0;

  private flashTimer: number = 0;
  private flashDuration: number = 0.1;
  private isFlashing: boolean = false;
  private flashColor: string = '#ffffff';

  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.color = BALL_COLORS[0];
    this.resetToCenter();
  }

  resetToCenter(): void {
    this.x = this.canvasWidth / 2;
    this.y = this.canvasHeight / 2;
    this.speedMultiplier = 1.0;

    const angle = (Math.random() * 0.5 - 0.25) * Math.PI * 2;
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.vx = Math.cos(angle) * this.initialSpeed * direction;
    this.vy = Math.sin(angle) * this.initialSpeed;

    if (Math.abs(this.vx) < 2) {
      this.vx = 2 * (this.vx >= 0 ? 1 : -1);
    }
  }

  update(deltaTime: number, leftPaddle: { x: number; y: number; width: number; height: number }, rightPaddle: { x: number; y: number; width: number; height: number }): BallCollisionResult {
    const result: BallCollisionResult = {
      hitPaddle: false,
      paddleSide: null,
      hitX: 0,
      hitY: 0,
      normalAngle: 0,
    };

    if (this.isFlashing) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
        this.color = this.flashColor;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy;
    }
    if (this.y + this.radius > this.canvasHeight) {
      this.y = this.canvasHeight - this.radius;
      this.vy = -this.vy;
    }

    const leftHit = this.checkPaddleCollision(leftPaddle, 'left');
    if (leftHit.hit) {
      result.hitPaddle = true;
      result.paddleSide = 'left';
      result.hitX = leftHit.hitX;
      result.hitY = leftHit.hitY;
      result.normalAngle = leftHit.normalAngle;
      this.onPaddleHit(leftPaddle, 'left');
    }

    const rightHit = this.checkPaddleCollision(rightPaddle, 'right');
    if (rightHit.hit) {
      result.hitPaddle = true;
      result.paddleSide = 'right';
      result.hitX = rightHit.hitX;
      result.hitY = rightHit.hitY;
      result.normalAngle = rightHit.normalAngle;
      this.onPaddleHit(rightPaddle, 'right');
    }

    return result;
  }

  private checkPaddleCollision(paddle: { x: number; y: number; width: number; height: number }, side: 'left' | 'right'): { hit: boolean; hitX: number; hitY: number; normalAngle: number } {
    const closestX = Math.max(paddle.x, Math.min(this.x, paddle.x + paddle.width));
    const closestY = Math.max(paddle.y, Math.min(this.y, paddle.y + paddle.height));

    const dx = this.x - closestX;
    const dy = this.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.radius) {
      let hitX = closestX;
      let hitY = closestY;
      let normalAngle: number;

      if (side === 'left') {
        normalAngle = 0;
      } else {
        normalAngle = Math.PI;
      }

      return { hit: true, hitX, hitY, normalAngle };
    }

    return { hit: false, hitX: 0, hitY: 0, normalAngle: 0 };
  }

  private onPaddleHit(paddle: { x: number; y: number; width: number; height: number }, side: 'left' | 'right'): void {
    const paddleCenterY = paddle.y + paddle.height / 2;
    const hitOffset = (this.y - paddleCenterY) / (paddle.height / 2);
    const maxAngle = Math.PI / 4;
    const angle = hitOffset * maxAngle;

    this.speedMultiplier *= 1.1;
    const currentSpeed = this.initialSpeed * this.speedMultiplier;

    if (side === 'left') {
      this.vx = Math.cos(angle) * currentSpeed;
      this.x = paddle.x + paddle.width + this.radius;
    } else {
      this.vx = -Math.cos(angle) * currentSpeed;
      this.x = paddle.x - this.radius;
    }
    this.vy = Math.sin(angle) * currentSpeed;

    this.startFlash();
  }

  private startFlash(): void {
    const currentIndex = BALL_COLORS.indexOf(this.color);
    let newIndex = Math.floor(Math.random() * BALL_COLORS.length);
    while (newIndex === currentIndex && BALL_COLORS.length > 1) {
      newIndex = Math.floor(Math.random() * BALL_COLORS.length);
    }
    this.flashColor = BALL_COLORS[newIndex];
    this.flashTimer = this.flashDuration;
    this.isFlashing = true;
  }

  isOutOfBounds(): 'left' | 'right' | null {
    if (this.x + this.radius < 0) {
      return 'left';
    }
    if (this.x - this.radius > this.canvasWidth) {
      return 'right';
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const drawColor = this.isFlashing ? '#ffffff' : this.color;

    ctx.shadowColor = drawColor;
    ctx.shadowBlur = 4;
    ctx.fillStyle = drawColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
}

export interface BrickData {
  x: number;
  y: number;
  color: 'red' | 'blue' | 'green';
  hp: number;
}

export interface CollisionEvent {
  type: 'brick_destroy' | 'brick_hit' | 'wall' | 'paddle';
  x: number;
  y: number;
  normalX: number;
  normalY: number;
  brickColor?: string;
}

const COLOR_HP: Record<string, number> = {
  red: 3,
  blue: 2,
  green: 1
};

export class PhysicsEngine {
  ballX = 15;
  ballY = 18;
  ballVX = 5;
  ballVY = -8;
  ballRadius = 0.3;

  paddleX = 15;
  paddleWidth = 4;
  paddleHeight = 0.4;
  paddleY = 19;

  bricks: BrickData[] = [];
  brickWidth = 1;
  brickHeight = 0.5;

  fieldWidth = 30;
  fieldHeight = 20;

  score = 0;
  lives = 3;
  gameOver = false;
  ballLaunched = false;

  collisionEvents: CollisionEvent[] = [];

  loadBricks(bricks: BrickData[]): void {
    this.bricks = bricks.map(b => ({
      ...b,
      hp: b.hp > 0 ? b.hp : COLOR_HP[b.color] ?? 1
    }));
  }

  resetBall(): void {
    this.ballLaunched = false;
    this.ballX = this.paddleX;
    this.ballY = this.paddleY - this.paddleHeight / 2 - this.ballRadius - 0.1;
    const speed = Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY);
    const angle = (Math.random() - 0.5) * (Math.PI / 3);
    this.ballVX = speed * Math.sin(angle);
    this.ballVY = -Math.abs(speed * Math.cos(angle));
  }

  launchBall(): void {
    if (!this.ballLaunched) {
      this.ballLaunched = true;
    }
  }

  restart(bricks: BrickData[]): void {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.loadBricks(bricks);
    this.resetBall();
  }

  update(dt: number): void {
    if (this.gameOver) return;

    this.collisionEvents = [];

    if (!this.ballLaunched) {
      this.ballX = this.paddleX;
      this.ballY = this.paddleY - this.paddleHeight / 2 - this.ballRadius - 0.1;
      return;
    }

    this.ballX += this.ballVX * dt;
    this.ballY += this.ballVY * dt;

    this.checkWallCollisions();

    if (this.ballY - this.ballRadius > this.fieldHeight) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver = true;
        return;
      }
      this.resetBall();
      return;
    }

    this.checkPaddleCollision();
    this.checkBrickCollisions();
  }

  private reflectVelocity(nx: number, ny: number): void {
    const dot = this.ballVX * nx + this.ballVY * ny;
    if (dot >= 0) return;
    this.ballVX -= 2 * dot * nx;
    this.ballVY -= 2 * dot * ny;
  }

  private checkWallCollisions(): void {
    if (this.ballX - this.ballRadius < 0) {
      this.ballX = this.ballRadius;
      this.reflectVelocity(1, 0);
      this.collisionEvents.push({
        type: 'wall', x: 0, y: this.ballY, normalX: 1, normalY: 0
      });
    }
    if (this.ballX + this.ballRadius > this.fieldWidth) {
      this.ballX = this.fieldWidth - this.ballRadius;
      this.reflectVelocity(-1, 0);
      this.collisionEvents.push({
        type: 'wall', x: this.fieldWidth, y: this.ballY, normalX: -1, normalY: 0
      });
    }
    if (this.ballY - this.ballRadius < 0) {
      this.ballY = this.ballRadius;
      this.reflectVelocity(0, 1);
      this.collisionEvents.push({
        type: 'wall', x: this.ballX, y: 0, normalX: 0, normalY: 1
      });
    }
  }

  private checkPaddleCollision(): void {
    const paddleLeft = this.paddleX - this.paddleWidth / 2;
    const paddleRight = this.paddleX + this.paddleWidth / 2;
    const paddleTop = this.paddleY - this.paddleHeight / 2;

    if (this.ballVY <= 0) return;

    const closestX = Math.max(paddleLeft, Math.min(this.ballX, paddleRight));
    const dx = this.ballX - closestX;
    const dy = this.ballY - paddleTop;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.ballRadius && this.ballY < this.paddleY) {
      const hitPos = (this.ballX - this.paddleX) / (this.paddleWidth / 2);
      const clampedHit = Math.max(-1, Math.min(1, hitPos));
      const speed = Math.sqrt(this.ballVX * this.ballVX + this.ballVY * this.ballVY);
      const angle = clampedHit * (Math.PI / 3);
      this.ballVX = speed * Math.sin(angle);
      this.ballVY = -speed * Math.cos(angle);
      this.ballY = paddleTop - this.ballRadius;

      this.collisionEvents.push({
        type: 'paddle', x: this.ballX, y: paddleTop, normalX: 0, normalY: -1
      });
    }
  }

  private checkBrickCollisions(): void {
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      const bx = brick.x;
      const by = brick.y;

      const closestX = Math.max(bx, Math.min(this.ballX, bx + this.brickWidth));
      const closestY = Math.max(by, Math.min(this.ballY, by + this.brickHeight));

      const dx = this.ballX - closestX;
      const dy = this.ballY - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq >= this.ballRadius * this.ballRadius) continue;

      const dist = Math.sqrt(distSq);
      let nx: number;
      let ny: number;

      if (dist < 0.0001) {
        const oLeft = this.ballX - bx;
        const oRight = (bx + this.brickWidth) - this.ballX;
        const oTop = this.ballY - by;
        const oBottom = (by + this.brickHeight) - this.ballY;
        const minO = Math.min(oLeft, oRight, oTop, oBottom);
        if (minO === oLeft) { nx = -1; ny = 0; }
        else if (minO === oRight) { nx = 1; ny = 0; }
        else if (minO === oTop) { nx = 0; ny = -1; }
        else { nx = 0; ny = 1; }
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }

      this.reflectVelocity(nx, ny);

      const penetration = this.ballRadius - dist;
      this.ballX += nx * (penetration + 0.01);
      this.ballY += ny * (penetration + 0.01);

      brick.hp--;
      if (brick.hp <= 0) {
        this.bricks.splice(i, 1);
        this.score += 10;
        this.collisionEvents.push({
          type: 'brick_destroy',
          x: bx + this.brickWidth / 2,
          y: by + this.brickHeight / 2,
          normalX: nx,
          normalY: ny,
          brickColor: brick.color
        });
      } else {
        this.collisionEvents.push({
          type: 'brick_hit',
          x: closestX,
          y: closestY,
          normalX: nx,
          normalY: ny
        });
      }

      break;
    }
  }
}

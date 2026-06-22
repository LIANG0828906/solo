import {
  GameState,
  GamePhase,
  PowerUpType,
  type Ball,
  type Brick,
  type Particle,
  type BrickFragment,
  type PowerUp,
  GAME_WIDTH,
  GAME_HEIGHT,
  BALL_RADIUS,
} from './GameState';

export class PhysicsEngine {
  update(state: GameState, dt: number): void {
    if (state.phase !== GamePhase.PLAYING) return;

    const paddle = state.paddle;
    const diff = paddle.targetX - paddle.x;
    paddle.x += diff * Math.min(1, dt * 18);
    paddle.x = Math.max(0, Math.min(GAME_WIDTH - paddle.width, paddle.x));

    for (let bi = state.balls.length - 1; bi >= 0; bi--) {
      const ball = state.balls[bi];
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      this.checkWallCollision(ball, state);
      this.checkPaddleCollision(ball, paddle, state);

      const hitBricks = this.checkBrickCollision(ball, state);
      for (const brick of hitBricks) {
        this.handleBrickHit(brick, state);
      }

      if (ball.y - ball.radius > GAME_HEIGHT) {
        state.balls.splice(bi, 1);
        if (state.balls.length === 0) {
          state.loseLife();
        }
      }
    }

    for (let i = state.powerUps.length - 1; i >= 0; i--) {
      const pu = state.powerUps[i];
      if (this.checkPowerUpCollision(pu, paddle)) {
        this.applyPowerUp(pu.type, state);
        state.powerUps.splice(i, 1);
        state.flashAlpha = 0.5;
      }
    }

    if (state.allBricksDestroyed()) {
      state.triggerWin();
    }
  }

  private checkWallCollision(ball: Ball, state: GameState): void {
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + ball.radius >= GAME_WIDTH) {
      ball.x = GAME_WIDTH - ball.radius;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
  }

  private checkPaddleCollision(ball: Ball, paddle: { x: number; y: number; width: number; height: number }, state: GameState): void {
    if (
      ball.vy > 0 &&
      ball.y + ball.radius >= paddle.y &&
      ball.y + ball.radius <= paddle.y + paddle.height + 4 &&
      ball.x >= paddle.x - ball.radius &&
      ball.x <= paddle.x + paddle.width + ball.radius
    ) {
      const hitPos = (ball.x - paddle.x) / paddle.width;
      const angle = -Math.PI * (0.15 + hitPos * 0.7);
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      ball.y = paddle.y - ball.radius - 1;
    }
  }

  private checkBrickCollision(ball: Ball, state: GameState): Brick[] {
    const hitBricks: Brick[] = [];

    for (const brick of state.bricks) {
      if (!brick.alive) continue;

      const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
      const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
      const distX = ball.x - closestX;
      const distY = ball.y - closestY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist <= ball.radius) {
        hitBricks.push(brick);

        if (!ball.isPiercing) {
          const overlapX = ball.radius - Math.abs(distX);
          const overlapY = ball.radius - Math.abs(distY);

          if (overlapX < overlapY) {
            ball.vx = -ball.vx;
            ball.x += distX > 0 ? overlapX : -overlapX;
          } else {
            ball.vy = -ball.vy;
            ball.y += distY > 0 ? overlapY : -overlapY;
          }
        }

        if (!ball.isPiercing) break;
      }
    }

    return hitBricks;
  }

  private handleBrickHit(brick: Brick, state: GameState): void {
    brick.hp--;
    state.addScore(10 * brick.maxHp);

    if (brick.hp <= 0) {
      brick.alive = false;
      this.spawnBrickFragments(brick, state);
      this.spawnBrickParticles(brick, state, 12);
      this.spawnPowerUpDrop(brick, state);
    } else {
      brick.flickering = true;
      brick.flickerTimer = 0.15;
      this.spawnBrickParticles(brick, state, 5);
    }
  }

  private spawnBrickFragments(brick: Brick, state: GameState): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const fw = brick.width / 3 * (0.5 + Math.random() * 0.5);
      const fh = brick.height / 2 * (0.5 + Math.random() * 0.5);
      state.fragments.push({
        x: brick.x + Math.random() * brick.width,
        y: brick.y + Math.random() * brick.height,
        vx: (Math.random() - 0.5) * 300,
        vy: -100 - Math.random() * 200,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        color: brick.color,
        width: fw,
        height: fh,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  private spawnBrickParticles(brick: Brick, state: GameState, count: number): void {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x: brick.x + Math.random() * brick.width,
        y: brick.y + Math.random() * brick.height,
        vx: (Math.random() - 0.5) * 200,
        vy: -50 - Math.random() * 150,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
        color: brick.color,
        size: 2 + Math.random() * 4,
        lod: 0,
      });
    }
  }

  private spawnPowerUpDrop(brick: Brick, state: GameState): void {
    if (Math.random() > 0.2) return;

    const types = [PowerUpType.WIDER_PADDLE, PowerUpType.SPLIT_BALL, PowerUpType.PIERCING];
    const type = types[Math.floor(Math.random() * types.length)];

    state.powerUps.push({
      x: brick.x + brick.width / 2 - 14,
      y: brick.y + brick.height,
      vy: 120,
      type,
      width: 28,
      height: 28,
      lightPillarAlpha: 0.3,
    });
  }

  private checkPowerUpCollision(pu: PowerUp, paddle: { x: number; y: number; width: number; height: number }): boolean {
    return (
      pu.x < paddle.x + paddle.width &&
      pu.x + pu.width > paddle.x &&
      pu.y < paddle.y + paddle.height &&
      pu.y + pu.height > paddle.y
    );
  }

  private applyPowerUp(type: PowerUpType, state: GameState): void {
    switch (type) {
      case PowerUpType.WIDER_PADDLE:
        state.paddle.width = state.paddle.baseWidth * 1.6;
        state.paddle.widenedTimer = 8;
        break;
      case PowerUpType.SPLIT_BALL: {
        const newBalls: Ball[] = [];
        for (const ball of state.balls) {
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          for (let a = -0.4; a <= 0.4; a += 0.8) {
            if (a === 0) continue;
            const angle = Math.atan2(ball.vy, ball.vx) + a;
            newBalls.push({
              x: ball.x,
              y: ball.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: BALL_RADIUS,
              isPiercing: ball.isPiercing,
              piercingTimer: ball.piercingTimer,
              trail: [],
            });
          }
        }
        state.balls.push(...newBalls);
        break;
      }
      case PowerUpType.PIERCING:
        for (const ball of state.balls) {
          ball.isPiercing = true;
          ball.piercingTimer = 6;
        }
        break;
    }
  }
}

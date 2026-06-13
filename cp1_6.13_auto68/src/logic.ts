export type GameStatus = 'idle' | 'playing' | 'paused' | 'ended';

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface ScoreAnimation {
  active: boolean;
  scale: number;
  side: 'left' | 'right';
  timer: number;
}

export interface FlashEffect {
  active: boolean;
  alpha: number;
  timer: number;
}

export interface GameState {
  status: GameStatus;
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;
  scores: { left: number; right: number };
  particles: Particle[];
  trail: { x: number; y: number }[];
  flashEffect: FlashEffect;
  scoreAnimation: ScoreAnimation;
  winner: 'left' | 'right' | null;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_RADIUS = 12;
const PADDLE_SPEED = 600;
const INITIAL_BALL_SPEED = 300;
const MAX_SPEED_MULTIPLIER = 2;
const WINNING_SCORE = 5;
const TRAIL_LENGTH = 12;
const MAX_PARTICLES = 100;
const PARTICLES_PER_HIT = 6;

const PARTICLE_COLORS = ['#e94560', '#0f3460', '#00ff88', '#ffd700', '#9b59b6'];

export class GameLogic {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const leftPaddle: Paddle = {
      x: 20,
      y: CANVAS_HEIGHT / 2 - PADDLE_WIDTH / 2,
      width: PADDLE_HEIGHT,
      height: PADDLE_WIDTH
    };

    const rightPaddle: Paddle = {
      x: CANVAS_WIDTH - 20 - PADDLE_HEIGHT,
      y: CANVAS_HEIGHT / 2 - PADDLE_WIDTH / 2,
      width: PADDLE_HEIGHT,
      height: PADDLE_WIDTH
    };

    const ball: Ball = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      vx: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      vy: (Math.random() - 0.5) * 200
    };

    return {
      status: 'idle',
      leftPaddle,
      rightPaddle,
      ball,
      scores: { left: 0, right: 0 },
      particles: [],
      trail: [],
      flashEffect: { active: false, alpha: 0, timer: 0 },
      scoreAnimation: { active: false, scale: 1, side: 'left', timer: 0 },
      winner: null
    };
  }

  getState(): GameState {
    return this.state;
  }

  setStatus(status: GameStatus): void {
    this.state.status = status;
  }

  reset(): void {
    const initial = this.createInitialState();
    this.state = initial;
  }

  resetBall(direction: number): void {
    this.state.ball.x = CANVAS_WIDTH / 2;
    this.state.ball.y = CANVAS_HEIGHT / 2;
    this.state.ball.vx = INITIAL_BALL_SPEED * direction;
    this.state.ball.vy = (Math.random() - 0.5) * 200;
    this.state.trail = [];
  }

  startGame(): void {
    this.state.status = 'playing';
  }

  update(deltaTime: number, isKeyPressed: (key: string) => boolean): void {
    if (this.state.status !== 'playing') {
      this.updateEffects(deltaTime);
      return;
    }

    this.updatePaddles(deltaTime, isKeyPressed);
    this.updateBall(deltaTime);
    this.updateTrail();
    this.updateParticles(deltaTime);
    this.updateEffects(deltaTime);
    this.checkCollisions();
    this.checkScore();
  }

  private updatePaddles(deltaTime: number, isKeyPressed: (key: string) => boolean): void {
    const moveDistance = PADDLE_SPEED * deltaTime;

    if (isKeyPressed('w')) {
      this.state.leftPaddle.y = Math.max(0, this.state.leftPaddle.y - moveDistance);
    }
    if (isKeyPressed('s')) {
      this.state.leftPaddle.y = Math.min(
        CANVAS_HEIGHT - this.state.leftPaddle.height,
        this.state.leftPaddle.y + moveDistance
      );
    }

    if (isKeyPressed('arrowup')) {
      this.state.rightPaddle.y = Math.max(0, this.state.rightPaddle.y - moveDistance);
    }
    if (isKeyPressed('arrowdown')) {
      this.state.rightPaddle.y = Math.min(
        CANVAS_HEIGHT - this.state.rightPaddle.height,
        this.state.rightPaddle.y + moveDistance
      );
    }
  }

  private updateBall(deltaTime: number): void {
    this.state.ball.x += this.state.ball.vx * deltaTime;
    this.state.ball.y += this.state.ball.vy * deltaTime;
  }

  private updateTrail(): void {
    this.state.trail.unshift({ x: this.state.ball.x, y: this.state.ball.y });
    if (this.state.trail.length > TRAIL_LENGTH) {
      this.state.trail.pop();
    }
  }

  private updateParticles(deltaTime: number): void {
    const particles = this.state.particles;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      const lifeRatio = Math.max(0, p.life / p.maxLife);
      p.size = 4 * lifeRatio * lifeRatio;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  private easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  private updateEffects(deltaTime: number): void {
    if (this.state.flashEffect.active) {
      this.state.flashEffect.timer -= deltaTime;
      if (this.state.flashEffect.timer <= 0) {
        this.state.flashEffect.active = false;
        this.state.flashEffect.alpha = 0;
      } else {
        this.state.flashEffect.alpha = 0.6 * (this.state.flashEffect.timer / 0.3);
      }
    }

    if (this.state.scoreAnimation.active) {
      this.state.scoreAnimation.timer -= deltaTime;
      if (this.state.scoreAnimation.timer <= 0) {
        this.state.scoreAnimation.active = false;
        this.state.scoreAnimation.scale = 1;
      } else {
        const t = 1 - this.state.scoreAnimation.timer / 0.5;
        this.state.scoreAnimation.scale = 1 + 0.2 * (1 - this.easeOutElastic(t));
      }
    }
  }

  private checkCollisions(): void {
    const ball = this.state.ball;

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
    }
    if (ball.y + ball.radius >= CANVAS_HEIGHT) {
      ball.y = CANVAS_HEIGHT - ball.radius;
      ball.vy = -Math.abs(ball.vy);
    }

    if (ball.vx < 0) {
      this.checkPaddleCollision(this.state.leftPaddle, 'left');
    } else if (ball.vx > 0) {
      this.checkPaddleCollision(this.state.rightPaddle, 'right');
    }
  }

  private checkPaddleCollision(paddle: Paddle, side: 'left' | 'right'): void {
    const ball = this.state.ball;

    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height
    ) {
      if (side === 'left') {
        const paddleFrontX = paddle.x + paddle.width;
        if (ball.x - ball.radius <= paddleFrontX && ball.x - ball.radius >= paddle.x - ball.radius && ball.vx < 0) {
          this.handlePaddleHit(paddle, side);
        }
      } else {
        const paddleFrontX = paddle.x;
        if (ball.x + ball.radius >= paddleFrontX && ball.x + ball.radius <= paddle.x + paddle.width + ball.radius && ball.vx > 0) {
          this.handlePaddleHit(paddle, side);
        }
      }
    }
  }

  private handlePaddleHit(paddle: Paddle, side: 'left' | 'right'): void {
    const ball = this.state.ball;

    const paddleCenterY = paddle.y + paddle.height / 2;
    const normalizedHit = (ball.y - paddleCenterY) / (paddle.height / 2);
    const clampedHit = Math.max(-1, Math.min(1, normalizedHit));
    const maxAngle = Math.PI / 3;
    const angleOffset = clampedHit * maxAngle;

    const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const baseSpeed = Math.max(currentSpeed, INITIAL_BALL_SPEED);
    const newSpeed = Math.min(baseSpeed * 1.1, INITIAL_BALL_SPEED * MAX_SPEED_MULTIPLIER);

    const direction = side === 'left' ? 1 : -1;
    ball.vx = direction * newSpeed * Math.cos(angleOffset);
    ball.vy = newSpeed * Math.sin(angleOffset);

    if (side === 'left') {
      ball.x = paddle.x + paddle.width + ball.radius;
    } else {
      ball.x = paddle.x - ball.radius;
    }

    this.spawnParticles(
      side === 'left' ? paddle.x + paddle.width : paddle.x,
      ball.y
    );
  }

  private spawnParticles(x: number, y: number): void {
    const particles = this.state.particles;
    const toSpawn = Math.min(PARTICLES_PER_HIT, MAX_PARTICLES - particles.length);

    for (let i = 0; i < toSpawn; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 150;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 4,
        life: 0.8,
        maxLife: 0.8
      });
    }
  }

  private checkScore(): void {
    const ball = this.state.ball;

    if (ball.x - ball.radius <= 0) {
      this.scorePoint('right');
    } else if (ball.x + ball.radius >= CANVAS_WIDTH) {
      this.scorePoint('left');
    }
  }

  private scorePoint(side: 'left' | 'right'): void {
    if (side === 'left') {
      this.state.scores.left++;
    } else {
      this.state.scores.right++;
    }

    this.state.flashEffect = { active: true, alpha: 0.6, timer: 0.3 };
    this.state.scoreAnimation = { active: true, scale: 1.2, side, timer: 0.5 };

    if (this.state.scores.left >= WINNING_SCORE) {
      this.state.status = 'ended';
      this.state.winner = 'left';
    } else if (this.state.scores.right >= WINNING_SCORE) {
      this.state.status = 'ended';
      this.state.winner = 'right';
    } else {
      this.resetBall(side === 'left' ? 1 : -1);
    }
  }
}

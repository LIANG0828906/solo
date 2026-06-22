export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  piercing: boolean;
  piercingTimer: number;
  active: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  baseWidth: number;
  expandTimer: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
  active: boolean;
}

export type PowerUpType = 'expand' | 'multiball' | 'piercing';

export interface PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: PowerUpType;
  width: number;
  height: number;
  active: boolean;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  celebration?: boolean;
}

export interface GameState {
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  powerUps: PowerUp[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  scorePopup: { value: number; x: number; y: number; scale: number; life: number } | null;
  multiballTimer: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_SPEED = 300;
const TOP_MARGIN = 60;
const BOTTOM_MARGIN = 40;
const PLAY_HEIGHT = CANVAS_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
const PLAY_TOP = TOP_MARGIN;
const PLAY_BOTTOM = CANVAS_HEIGHT - BOTTOM_MARGIN;
const PLAY_LEFT = 10;
const PLAY_RIGHT = CANVAS_WIDTH - 10;

export const PHYSICS_CONSTANTS = {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_SPEED,
  TOP_MARGIN,
  BOTTOM_MARGIN,
  PLAY_HEIGHT,
  PLAY_TOP,
  PLAY_BOTTOM,
  PLAY_LEFT,
  PLAY_RIGHT
};

export function createBall(x: number, y: number, angle: number = -Math.PI / 2): Ball {
  return {
    x,
    y,
    vx: Math.cos(angle) * BALL_SPEED,
    vy: Math.sin(angle) * BALL_SPEED,
    radius: 8,
    speed: BALL_SPEED,
    piercing: false,
    piercingTimer: 0,
    active: true
  };
}

export function createPaddle(): Paddle {
  const width = 120;
  return {
    x: CANVAS_WIDTH / 2 - width / 2,
    y: PLAY_BOTTOM - 20,
    width,
    height: 14,
    targetX: CANVAS_WIDTH / 2 - width / 2,
    baseWidth: width,
    expandTimer: 0
  };
}

export function updatePaddle(paddle: Paddle, mouseX: number, dt: number): void {
  paddle.targetX = mouseX - paddle.width / 2;
  const diff = paddle.targetX - paddle.x;
  paddle.x += diff * Math.min(1, dt * 18);
  paddle.x = Math.max(PLAY_LEFT, Math.min(PLAY_RIGHT - paddle.width, paddle.x));

  if (paddle.expandTimer > 0) {
    paddle.expandTimer -= dt;
    if (paddle.expandTimer <= 0) {
      paddle.width = paddle.baseWidth;
    }
  }
}

export function updateBall(ball: Ball, dt: number): void {
  if (!ball.active) return;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.piercingTimer > 0) {
    ball.piercingTimer -= dt;
    if (ball.piercingTimer <= 0) {
      ball.piercing = false;
    }
  }

  if (ball.x - ball.radius < PLAY_LEFT) {
    ball.x = PLAY_LEFT + ball.radius;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x + ball.radius > PLAY_RIGHT) {
    ball.x = PLAY_RIGHT - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.radius < PLAY_TOP) {
    ball.y = PLAY_TOP + ball.radius;
    ball.vy = Math.abs(ball.vy);
  }
}

export function checkPaddleCollision(ball: Ball, paddle: Paddle): boolean {
  if (!ball.active) return false;
  if (ball.vy < 0) return false;

  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.height;
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.width;

  if (
    ball.x + ball.radius > paddleLeft &&
    ball.x - ball.radius < paddleRight &&
    ball.y + ball.radius > paddleTop &&
    ball.y - ball.radius < paddleBottom
  ) {
    ball.y = paddleTop - ball.radius;

    const hitPoint = (ball.x - paddle.x) / paddle.width;
    const angle = (hitPoint - 0.5) * Math.PI * 0.7;
    ball.vx = Math.sin(angle) * ball.speed;
    ball.vy = -Math.cos(angle) * ball.speed;

    return true;
  }
  return false;
}

export function checkBrickCollision(ball: Ball, bricks: Brick[]): Brick | null {
  if (!ball.active) return null;

  for (const brick of bricks) {
    if (!brick.active) continue;

    if (
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height
    ) {
      if (!ball.piercing) {
        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        if (minOverlapX < minOverlapY) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }
      }

      return brick;
    }
  }
  return null;
}

export function isBallLost(ball: Ball): boolean {
  return ball.active && ball.y - ball.radius > PLAY_BOTTOM;
}

export function spawnSplitBalls(original: Ball): Ball[] {
  const newBalls: Ball[] = [];
  const angles = [-0.3, 0.3];
  for (const offset of angles) {
    const currentAngle = Math.atan2(original.vy, original.vx);
    const newBall = createBall(original.x, original.y, currentAngle + offset);
    newBall.piercing = original.piercing;
    newBall.piercingTimer = original.piercingTimer;
    newBalls.push(newBall);
  }
  return newBalls;
}

export function createParticles(x: number, y: number, color: string, count: number = 6): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 60 + Math.random() * 80;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 0.3,
      maxLife: 0.3,
      size: 3 + Math.random() * 4
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt;
    p.life -= dt;
    return p.life > 0;
  });
}

export function applyPowerUp(
  powerUp: PowerUp,
  state: GameState,
  onMultiball: () => void
): void {
  switch (powerUp.type) {
    case 'expand':
      state.paddle.width = state.paddle.baseWidth * 1.5;
      state.paddle.expandTimer = 5;
      break;
    case 'multiball':
      state.multiballTimer = 8;
      onMultiball();
      break;
    case 'piercing':
      for (const ball of state.balls) {
        ball.piercing = true;
        ball.piercingTimer = 5;
      }
      break;
  }
}

export function updatePowerUps(
  powerUps: PowerUp[],
  dt: number
): PowerUp[] {
  return powerUps.filter(p => {
    p.vy += 150 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += 3 * dt;

    if (p.x < PLAY_LEFT) {
      p.x = PLAY_LEFT;
      p.vx = Math.abs(p.vx);
    }
    if (p.x + p.width > PLAY_RIGHT) {
      p.x = PLAY_RIGHT - p.width;
      p.vx = -Math.abs(p.vx);
    }

    return p.y < PLAY_BOTTOM && p.active;
  });
}

export function checkPowerUpCollision(powerUp: PowerUp, paddle: Paddle): boolean {
  if (!powerUp.active) return false;
  return (
    powerUp.x + powerUp.width > paddle.x &&
    powerUp.x < paddle.x + paddle.width &&
    powerUp.y + powerUp.height > paddle.y &&
    powerUp.y < paddle.y + paddle.height
  );
}

export function updateCelebrationParticles(
  particles: Particle[],
  dt: number,
  canvasHeight: number = CANVAS_HEIGHT
): Particle[] {
  const baseUpwardAccel = canvasHeight * 0.12;
  const horizontalDamping = 1 - Math.min(0.9, 1.5 * dt);
  const verticalDamping = 1 - Math.min(0.8, 1.0 * dt);
  const boundaryMargin = 20;

  return particles.filter(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= horizontalDamping;
    p.vy *= verticalDamping;
    p.vy -= baseUpwardAccel * dt;

    if (p.x < boundaryMargin) {
      p.x = boundaryMargin;
      p.vx = Math.abs(p.vx) * 0.3;
    }
    if (p.x > CANVAS_WIDTH - boundaryMargin) {
      p.x = CANVAS_WIDTH - boundaryMargin;
      p.vx = -Math.abs(p.vx) * 0.3;
    }
    if (p.y < boundaryMargin) {
      p.y = boundaryMargin;
      p.vy = Math.abs(p.vy) * 0.2;
    }
    if (p.y > canvasHeight - boundaryMargin) {
      p.y = canvasHeight - boundaryMargin;
      p.vy = -Math.abs(p.vy) * 0.2;
    }

    p.life -= dt;
    return p.life > 0;
  });
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

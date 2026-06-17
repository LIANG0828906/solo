import { Ball, Pocket, Particle, FRICTION, RESTITUTION, MIN_VELOCITY_THRESHOLD, BALL_RADIUS, TABLE_CONFIG, POCKETS } from './types';
import { v4 as uuidv4 } from 'uuid';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkBallBallCollision(b1: Ball, b2: Ball): boolean {
  const dist = distance(b1.x, b1.y, b2.x, b2.y);
  return dist < b1.radius + b2.radius;
}

function resolveBallBallCollision(b1: Ball, b2: Ball): { particles: Particle[] } {
  const dx = b2.x - b1.x;
  const dy = b2.y - b1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return { particles: [] };

  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = (b1.radius + b2.radius - dist) / 2;
  b1.x -= nx * overlap;
  b1.y -= ny * overlap;
  b2.x += nx * overlap;
  b2.y += ny * overlap;

  const dvx = b1.vx - b2.vx;
  const dvy = b1.vy - b2.vy;
  const dvn = dvx * nx + dvy * ny;

  if (dvn > 0) return { particles: [] };

  const m1 = b1.radius * b1.radius;
  const m2 = b2.radius * b2.radius;
  const impulse = (2 * dvn) / (m1 + m2);

  b1.vx -= impulse * m2 * nx;
  b1.vy -= impulse * m2 * ny;
  b2.vx += impulse * m1 * nx;
  b2.vy += impulse * m1 * ny;

  const particles = createCollisionParticles(
    b1.x + nx * b1.radius,
    b1.y + ny * b1.radius
  );

  return { particles };
}

function createCollisionParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    particles.push({
      id: uuidv4(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 2,
      opacity: 1,
      life: 0.3,
      maxLife: 0.3,
      color: '#FFD700',
    });
  }
  return particles;
}

function checkBallPocketCollision(ball: Ball, pocket: Pocket): boolean {
  const dist = distance(ball.x, ball.y, pocket.x, pocket.y);
  return dist < pocket.radius;
}

function resolveWallCollision(ball: Ball): void {
  const { width, height, borderWidth } = TABLE_CONFIG;
  const left = borderWidth + ball.radius;
  const right = width - borderWidth - ball.radius;
  const top = borderWidth + ball.radius;
  const bottom = height - borderWidth - ball.radius;

  if (ball.x < left) {
    ball.x = left;
    ball.vx = -ball.vx * RESTITUTION;
  } else if (ball.x > right) {
    ball.x = right;
    ball.vx = -ball.vx * RESTITUTION;
  }

  if (ball.y < top) {
    ball.y = top;
    ball.vy = -ball.vy * RESTITUTION;
  } else if (ball.y > bottom) {
    ball.y = bottom;
    ball.vy = -ball.vy * RESTITUTION;
  }
}

function applyFriction(ball: Ball): void {
  ball.vx *= FRICTION;
  ball.vy *= FRICTION;

  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed < MIN_VELOCITY_THRESHOLD) {
    ball.vx = 0;
    ball.vy = 0;
  }
}

function updateBall(ball: Ball, dt: number): void {
  if (ball.pocketed) return;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  resolveWallCollision(ball);
  applyFriction(ball);
}

function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - dt,
      opacity: Math.max(0, p.life / p.maxLife),
    }))
    .filter((p) => p.life > 0);
}

function areAllBallsStopped(balls: Ball[]): boolean {
  return balls.every(
    (b) => b.pocketed || (b.vx === 0 && b.vy === 0)
  );
}

function checkPockets(balls: Ball[]): { pocketedBalls: Ball[]; ripplePositions: { x: number; y: number }[] } {
  const pocketedBalls: Ball[] = [];
  const ripplePositions: { x: number; y: number }[] = [];

  for (const ball of balls) {
    if (ball.pocketed) continue;
    for (const pocket of POCKETS) {
      if (checkBallPocketCollision(ball, pocket)) {
        ball.pocketed = true;
        ball.vx = 0;
        ball.vy = 0;
        pocketedBalls.push(ball);
        ripplePositions.push({ x: pocket.x, y: pocket.y });
        break;
      }
    }
  }

  return { pocketedBalls, ripplePositions };
}

export interface PhysicsUpdateResult {
  balls: Ball[];
  particles: Particle[];
  pocketedBalls: Ball[];
  ripplePositions: { x: number; y: number }[];
  allStopped: boolean;
}

export function updatePhysics(
  balls: Ball[],
  particles: Particle[],
  dt: number
): PhysicsUpdateResult {
  const newBalls = balls.map((b) => ({ ...b }));
  let newParticles = [...particles];
  const allPocketedBalls: Ball[] = [];
  const allRipplePositions: { x: number; y: number }[] = [];

  for (const ball of newBalls) {
    updateBall(ball, dt);
  }

  for (let i = 0; i < newBalls.length; i++) {
    for (let j = i + 1; j < newBalls.length; j++) {
      const b1 = newBalls[i];
      const b2 = newBalls[j];
      if (b1.pocketed || b2.pocketed) continue;
      if (checkBallBallCollision(b1, b2)) {
        const { particles: collisionParticles } = resolveBallBallCollision(b1, b2);
        newParticles = [...newParticles, ...collisionParticles];
      }
    }
  }

  const { pocketedBalls, ripplePositions } = checkPockets(newBalls);
  allPocketedBalls.push(...pocketedBalls);
  allRipplePositions.push(...ripplePositions);

  newParticles = updateParticles(newParticles, dt);

  const allStopped = areAllBallsStopped(newBalls);

  return {
    balls: newBalls,
    particles: newParticles,
    pocketedBalls: allPocketedBalls,
    ripplePositions: allRipplePositions,
    allStopped,
  };
}

export function createInitialBalls(): Ball[] {
  const balls: Ball[] = [];
  const { width, height, borderWidth } = TABLE_CONFIG;
  const innerHeight = height - 2 * borderWidth;

  balls.push({
    id: uuidv4(),
    x: borderWidth + 120,
    y: height / 2,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    number: 0,
    color: '#FFFFFF',
    pocketed: false,
  });

  const startX = width - borderWidth - 180;
  const startY = height / 2;
  const ballDiameter = BALL_RADIUS * 2;
  const rowOffset = ballDiameter * Math.sqrt(3) / 2;

  const triangleOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  let idx = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const num = triangleOrder[idx++];
      balls.push({
        id: uuidv4(),
        x: startX + row * rowOffset,
        y: startY - (row * ballDiameter) / 2 + col * ballDiameter,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        number: num,
        color: getBallColor(num),
        pocketed: false,
      });
    }
  }

  return balls;
}

function getBallColor(number: number): string {
  const colors: Record<number, string> = {
    0: '#FFFFFF',
    1: '#FFFF00',
    2: '#0000FF',
    3: '#FF0000',
    4: '#800080',
    5: '#FF8C00',
    6: '#006400',
    7: '#8B0000',
    8: '#000000',
    9: '#FFFF00',
    10: '#0000FF',
    11: '#FF0000',
    12: '#800080',
    13: '#FF8C00',
    14: '#006400',
    15: '#8B0000',
  };
  return colors[number] || '#FFFFFF';
}

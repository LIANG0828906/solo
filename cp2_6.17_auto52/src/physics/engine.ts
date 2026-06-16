import {
  Ball,
  Paddle,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_RESTITUTION,
  WALL_RESTITUTION,
  GRAVITY,
  FRICTION,
  FLASH_DURATION,
  COLOR_PALETTE,
  SPAWN_ANIM_DURATION,
} from './types';

import { v4 as uuidv4 } from 'uuid';

function mixColors(c1: string, c2: string): string {
  const parse = (c: string) => {
    const hex = c.replace('#', '');
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  return `rgb(${r},${g},${b})`;
}

export function createBall(x: number, y: number, radius?: number): Ball {
  const r = radius ?? Math.floor(Math.random() * 8) + 8;
  const angle = Math.random() * Math.PI * 2;
  const speed = 100 + Math.random() * 150;
  return {
    id: uuidv4(),
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: r,
    color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
    energy: 1.0,
    flashUntil: 0,
    flashColor: '',
    spawnTime: performance.now(),
    spawning: true,
  };
}

export function updateBallSpawn(ball: Ball, now: number): Ball {
  if (!ball.spawning) return ball;
  const elapsed = now - ball.spawnTime;
  if (elapsed >= SPAWN_ANIM_DURATION) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 150;
    return {
      ...ball,
      spawning: false,
      vx: Math.cos(angle) * speed,
      vy: -150,
    };
  }
  return ball;
}

export function updatePhysics(
  balls: Ball[],
  paddle: Paddle,
  dt: number,
  now: number
): { balls: Ball[]; scoreDelta: number; lifeLost: boolean; collisionTime: number } {
  let scoreDelta = 0;
  let lifeLost = false;
  let totalCollisionTime = 0;

  const updated = balls.map((ball) => {
    let b = { ...ball };

    b = updateBallSpawn(b, now);

    if (!b.spawning) {
      b.vy += GRAVITY * dt;
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }

    if (b.x - b.radius < 0) {
      b.x = b.radius;
      b.vx = Math.abs(b.vx) * WALL_RESTITUTION;
    }
    if (b.x + b.radius > CANVAS_WIDTH) {
      b.x = CANVAS_WIDTH - b.radius;
      b.vx = -Math.abs(b.vx) * WALL_RESTITUTION;
    }
    if (b.y - b.radius < 0) {
      b.y = b.radius;
      b.vy = Math.abs(b.vy) * WALL_RESTITUTION;
    }

    if (!b.spawning &&
      b.vy > 0 &&
      b.y + b.radius >= paddle.y &&
      b.y + b.radius <= paddle.y + paddle.height + b.vy * dt + 5 &&
      b.x + b.radius > paddle.x &&
      b.x - b.radius < paddle.x + paddle.width
    ) {
      b.y = paddle.y - b.radius;
      b.vy = -Math.abs(b.vy) * PADDLE_RESTITUTION;
      const hitPos = (b.x - paddle.x) / paddle.width;
      b.vx += (hitPos - 0.5) * 100;
      scoreDelta += 1;
    }

    if (b.y - b.radius > CANVAS_HEIGHT) {
      lifeLost = true;
      return null;
    }

    if (now > b.flashUntil) {
      b.flashColor = '';
    }

    return b;
  });

  const alive: Ball[] = updated.filter((b): b is Ball => b !== null);

  const collisionDetectStart = performance.now();
  const collisionPairs: [number, number][] = [];
  for (let i = 0; i < alive.length; i++) {
    for (let j = i + 1; j < alive.length; j++) {
      const pairStart = performance.now();
      const a = alive[i];
      const b = alive[j];
      if (a.spawning || b.spawning) {
        totalCollisionTime += performance.now() - pairStart;
        continue;
      }
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;
      if (dist < minDist && dist > 0) {
        collisionPairs.push([i, j]);
      }
      totalCollisionTime += performance.now() - pairStart;
    }
  }

  for (const [i, j] of collisionPairs) {
    const resolveStart = performance.now();
    const a = alive[i];
    const b = alive[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;

    const overlap = a.radius + b.radius - dist;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dvDotN = dvx * nx + dvy * ny;

    if (dvDotN > 0) {
      const massA = a.radius * a.radius;
      const massB = b.radius * b.radius;
      const totalMass = massA + massB;

      a.vx -= (2 * massB / totalMass) * dvDotN * nx;
      a.vy -= (2 * massB / totalMass) * dvDotN * ny;
      b.vx += (2 * massA / totalMass) * dvDotN * nx;
      b.vy += (2 * massA / totalMass) * dvDotN * ny;

      const fc = mixColors(a.color, b.color);
      a.flashUntil = now + FLASH_DURATION;
      a.flashColor = fc;
      b.flashUntil = now + FLASH_DURATION;
      b.flashColor = fc;
    }
    totalCollisionTime += performance.now() - resolveStart;
  }

  totalCollisionTime += performance.now() - collisionDetectStart;

  return { balls: alive, scoreDelta, lifeLost, collisionTime: totalCollisionTime };
}

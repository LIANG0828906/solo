import { Ball, PLAY_AREA_LEFT, PLAY_AREA_RIGHT, PLAY_AREA_TOP, PLAY_AREA_BOTTOM, triggerSquash } from './balls';

export interface CollisionEvent {
  ball1: Ball;
  ball2: Ball;
  x: number;
  y: number;
}

export interface WallCollisionEvent {
  ball: Ball;
  wall: 'top' | 'bottom' | 'left' | 'right';
  x: number;
  y: number;
}

const FRICTION = 0.985;
const RESTITUTION_BALL = 0.95;
const RESTITUTION_WALL = 0.85;
const SPEED_THRESHOLD = 0.02;

export function updatePhysics(balls: Ball[], deltaTime: number): {
  ballCollisions: CollisionEvent[];
  wallCollisions: WallCollisionEvent[];
} {
  const ballCollisions: CollisionEvent[] = [];
  const wallCollisions: WallCollisionEvent[] = [];

  for (const ball of balls) {
    if (ball.pocketed) continue;
    ball.x += ball.vx * deltaTime * 60;
    ball.y += ball.vy * deltaTime * 60;

    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    if (Math.abs(ball.vx) < SPEED_THRESHOLD) ball.vx = 0;
    if (Math.abs(ball.vy) < SPEED_THRESHOLD) ball.vy = 0;
  }

  for (const ball of balls) {
    if (ball.pocketed) continue;

    if (ball.x - ball.radius < PLAY_AREA_LEFT) {
      ball.x = PLAY_AREA_LEFT + ball.radius;
      ball.vx = Math.abs(ball.vx) * RESTITUTION_WALL;
      triggerSquash(ball);
      wallCollisions.push({
        ball,
        wall: 'left',
        x: PLAY_AREA_LEFT,
        y: ball.y,
      });
    }
    if (ball.x + ball.radius > PLAY_AREA_RIGHT) {
      ball.x = PLAY_AREA_RIGHT - ball.radius;
      ball.vx = -Math.abs(ball.vx) * RESTITUTION_WALL;
      triggerSquash(ball);
      wallCollisions.push({
        ball,
        wall: 'right',
        x: PLAY_AREA_RIGHT,
        y: ball.y,
      });
    }
    if (ball.y - ball.radius < PLAY_AREA_TOP) {
      ball.y = PLAY_AREA_TOP + ball.radius;
      ball.vy = Math.abs(ball.vy) * RESTITUTION_WALL;
      triggerSquash(ball);
      wallCollisions.push({
        ball,
        wall: 'top',
        x: ball.x,
        y: PLAY_AREA_TOP,
      });
    }
    if (ball.y + ball.radius > PLAY_AREA_BOTTOM) {
      ball.y = PLAY_AREA_BOTTOM - ball.radius;
      ball.vy = -Math.abs(ball.vy) * RESTITUTION_WALL;
      triggerSquash(ball);
      wallCollisions.push({
        ball,
        wall: 'bottom',
        x: ball.x,
        y: PLAY_AREA_BOTTOM,
      });
    }
  }

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const ball1 = balls[i];
      const ball2 = balls[j];

      if (ball1.pocketed || ball2.pocketed) continue;

      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = ball1.radius + ball2.radius;

      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        const totalMass = 2;
        const ratio1 = 1 / totalMass;
        const ratio2 = 1 / totalMass;

        ball1.x -= nx * overlap * ratio1;
        ball1.y -= ny * overlap * ratio1;
        ball2.x += nx * overlap * ratio2;
        ball2.y += ny * overlap * ratio2;

        const dvx = ball1.vx - ball2.vx;
        const dvy = ball1.vy - ball2.vy;
        const dvDotN = dvx * nx + dvy * ny;

        if (dvDotN > 0) {
          const impulse = (2 * dvDotN) / totalMass;

          ball1.vx -= impulse * nx * RESTITUTION_BALL;
          ball1.vy -= impulse * ny * RESTITUTION_BALL;
          ball2.vx += impulse * nx * RESTITUTION_BALL;
          ball2.vy += impulse * ny * RESTITUTION_BALL;

          const collisionX = ball1.x + nx * ball1.radius;
          const collisionY = ball1.y + ny * ball1.radius;

          ballCollisions.push({
            ball1,
            ball2,
            x: collisionX,
            y: collisionY,
          });
        }
      }
    }
  }

  return { ballCollisions, wallCollisions };
}

export function shootCueBall(ball: Ball, angle: number, power: number): void {
  const maxSpeed = 15;
  const speed = (power / 200) * maxSpeed;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
}

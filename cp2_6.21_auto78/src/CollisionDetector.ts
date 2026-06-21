import { Ball, Pocket, BALL_RADIUS } from './types';

export function checkCollisions(balls: Ball[]): void {
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].pocketed) continue;
    for (let j = i + 1; j < balls.length; j++) {
      if (balls[j].pocketed) continue;

      const dx = balls[j].x - balls[i].x;
      const dy = balls[j].y - balls[i].y;
      const distSq = dx * dx + dy * dy;
      const minDist = balls[i].radius + balls[j].radius;
      const minDistSq = minDist * minDist;

      if (distSq >= minDistSq || distSq < 0.0001) continue;

      const dist = Math.sqrt(distSq);

      const nx = dx / dist;
      const ny = dy / dist;

      const tx = -ny;
      const ty = nx;

      const v1n = balls[i].vx * nx + balls[i].vy * ny;
      const v1t = balls[i].vx * tx + balls[i].vy * ty;

      const v2n = balls[j].vx * nx + balls[j].vy * ny;
      const v2t = balls[j].vx * tx + balls[j].vy * ty;

      if (v1n - v2n <= 0) continue;

      const m1 = balls[i].radius * balls[i].radius;
      const m2 = balls[j].radius * balls[j].radius;
      const totalMass = m1 + m2;

      const v1nAfter = (v1n * (m1 - m2) + 2 * m2 * v2n) / totalMass;
      const v2nAfter = (v2n * (m2 - m1) + 2 * m1 * v1n) / totalMass;

      balls[i].vx = v1nAfter * nx + v1t * tx;
      balls[i].vy = v1nAfter * ny + v1t * ty;
      balls[j].vx = v2nAfter * nx + v2t * tx;
      balls[j].vy = v2nAfter * ny + v2t * ty;

      const overlap = minDist - dist;
      const overlapRatio1 = m2 / totalMass;
      const overlapRatio2 = m1 / totalMass;
      balls[i].x -= overlap * overlapRatio1 * nx;
      balls[i].y -= overlap * overlapRatio1 * ny;
      balls[j].x += overlap * overlapRatio2 * nx;
      balls[j].y += overlap * overlapRatio2 * ny;
    }
  }
}

export function checkPockets(balls: Ball[], pockets: Pocket[]): number[] {
  const pocketed: number[] = [];
  for (const ball of balls) {
    if (ball.pocketed) continue;
    for (const pocket of pockets) {
      const dx = ball.x - pocket.x;
      const dy = ball.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pocket.radius - ball.radius * 0.2) {
        ball.pocketed = true;
        ball.vx = 0;
        ball.vy = 0;
        pocketed.push(ball.id);
        break;
      }
    }
  }
  return pocketed;
}

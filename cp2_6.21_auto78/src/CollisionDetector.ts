import { Ball, Pocket } from './types';

export function checkCollisions(balls: Ball[]): void {
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].pocketed) continue;
    for (let j = i + 1; j < balls.length; j++) {
      if (balls[j].pocketed) continue;

      const dx = balls[j].x - balls[i].x;
      const dy = balls[j].y - balls[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = balls[i].radius + balls[j].radius;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;

        const dvx = balls[i].vx - balls[j].vx;
        const dvy = balls[i].vy - balls[j].vy;
        const dvn = dvx * nx + dvy * ny;

        if (dvn <= 0) continue;

        balls[i].vx -= dvn * nx;
        balls[i].vy -= dvn * ny;
        balls[j].vx += dvn * nx;
        balls[j].vy += dvn * ny;

        const overlap = minDist - dist;
        balls[i].x -= (overlap / 2) * nx;
        balls[i].y -= (overlap / 2) * ny;
        balls[j].x += (overlap / 2) * nx;
        balls[j].y += (overlap / 2) * ny;
      }
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
      if (dist < pocket.radius) {
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

import { Ball, TableDimensions, CushionFlash, FRICTION, MIN_SPEED } from './types';

export function updateBalls(
  balls: Ball[],
  table: TableDimensions,
  onCushionFlash?: (flash: CushionFlash) => void
): void {
  const now = Date.now();

  for (const ball of balls) {
    if (ball.pocketed) continue;

    ball.x += ball.vx;
    ball.y += ball.vy;

    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    if (Math.abs(ball.vx) < MIN_SPEED && Math.abs(ball.vy) < MIN_SPEED) {
      ball.vx = 0;
      ball.vy = 0;
    }

    const left = table.x + table.cushionWidth + ball.radius;
    const right = table.x + table.width - table.cushionWidth - ball.radius;
    const top = table.y + table.cushionWidth + ball.radius;
    const bottom = table.y + table.height - table.cushionWidth - ball.radius;

    if (ball.x < left) {
      ball.x = left;
      ball.vx = -ball.vx;
      onCushionFlash?.({ side: 'left', time: now });
    }
    if (ball.x > right) {
      ball.x = right;
      ball.vx = -ball.vx;
      onCushionFlash?.({ side: 'right', time: now });
    }
    if (ball.y < top) {
      ball.y = top;
      ball.vy = -ball.vy;
      onCushionFlash?.({ side: 'top', time: now });
    }
    if (ball.y > bottom) {
      ball.y = bottom;
      ball.vy = -ball.vy;
      onCushionFlash?.({ side: 'bottom', time: now });
    }
  }
}

export function allBallsStopped(balls: Ball[]): boolean {
  return balls.every(
    (b) => b.pocketed || (Math.abs(b.vx) < MIN_SPEED && Math.abs(b.vy) < MIN_SPEED)
  );
}

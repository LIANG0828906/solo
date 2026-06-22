import { Ball, CollisionEffect, POCKET_POSITIONS } from './gameState';

export function updatePhysics(
  balls: Ball[],
  friction: number,
  restitution: number,
  tableWidth: number,
  tableHeight: number,
  cushionWidth: number,
  dt: number = 1
): { balls: Ball[]; collisionEffects: CollisionEffect[]; anyMoving: boolean } {
  const updatedBalls = balls.map(b => ({ ...b }));
  const collisionEffects: CollisionEffect[] = [];
  const minSpeed = 0.05;

  for (const ball of updatedBalls) {
    if (ball.isPocketed) continue;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > 0) {
      const newSpeed = Math.max(0, speed - friction * dt);
      const ratio = newSpeed / speed;
      ball.vx *= ratio;
      ball.vy *= ratio;
    }
  }

  for (let i = 0; i < updatedBalls.length; i++) {
    for (let j = i + 1; j < updatedBalls.length; j++) {
      const a = updatedBalls[i];
      const b = updatedBalls[j];
      if (a.isPocketed || b.isPocketed) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        const pushX = nx * overlap * 0.5;
        const pushY = ny * overlap * 0.5;
        a.x -= pushX;
        a.y -= pushY;
        b.x += pushX;
        b.y += pushY;

        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvAlongNormal = dvx * nx + dvy * ny;

        if (dvAlongNormal > 0) {
          const newADot = a.vx * nx + a.vy * ny - dvAlongNormal;
          const newBDot = b.vx * nx + b.vy * ny + dvAlongNormal;

          const aTanX = a.vx - (a.vx * nx + a.vy * ny) * nx;
          const aTanY = a.vy - (a.vx * nx + a.vy * ny) * ny;
          const bTanX = b.vx - (b.vx * nx + b.vy * ny) * nx;
          const bTanY = b.vy - (b.vx * nx + b.vy * ny) * ny;

          a.vx = aTanX + newADot * nx;
          a.vy = aTanY + newADot * ny;
          b.vx = bTanX + newBDot * nx;
          b.vy = bTanY + newBDot * ny;

          collisionEffects.push({
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            radius: a.radius,
            alpha: 0.8,
          });
        }
      }
    }
  }

  for (const ball of updatedBalls) {
    if (ball.isPocketed) continue;

    const leftBound = cushionWidth + ball.radius;
    const rightBound = tableWidth - cushionWidth - ball.radius;
    const topBound = cushionWidth + ball.radius;
    const bottomBound = tableHeight - cushionWidth - ball.radius;

    if (ball.x <= leftBound) {
      ball.x = leftBound;
      ball.vx = -ball.vx * restitution;
      collisionEffects.push({
        x: leftBound,
        y: ball.y,
        radius: ball.radius * 0.6,
        alpha: 0.6,
      });
    } else if (ball.x >= rightBound) {
      ball.x = rightBound;
      ball.vx = -ball.vx * restitution;
      collisionEffects.push({
        x: rightBound,
        y: ball.y,
        radius: ball.radius * 0.6,
        alpha: 0.6,
      });
    }

    if (ball.y <= topBound) {
      ball.y = topBound;
      ball.vy = -ball.vy * restitution;
      collisionEffects.push({
        x: ball.x,
        y: topBound,
        radius: ball.radius * 0.6,
        alpha: 0.6,
      });
    } else if (ball.y >= bottomBound) {
      ball.y = bottomBound;
      ball.vy = -ball.vy * restitution;
      collisionEffects.push({
        x: ball.x,
        y: bottomBound,
        radius: ball.radius * 0.6,
        alpha: 0.6,
      });
    }
  }

  for (const ball of updatedBalls) {
    if (ball.isPocketed) continue;
    for (const pocket of POCKET_POSITIONS) {
      const dx = ball.x - pocket.x;
      const dy = ball.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pocketRadius = 22;
      if (dist < pocketRadius - ball.radius * 0.3) {
        ball.isPocketed = true;
        ball.vx = 0;
        ball.vy = 0;
        break;
      }
    }
  }

  const anyMoving = updatedBalls.some(b => {
    if (b.isPocketed) return false;
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    return speed > minSpeed;
  });

  return { balls: updatedBalls, collisionEffects, anyMoving };
}

export function handleCollision(
  a: Ball,
  b: Ball,
  restitution: number
): { a: Ball; b: Ball } {
  const na = { ...a };
  const nb = { ...b };

  const dx = nb.x - na.x;
  const dy = nb.y - na.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = na.radius + nb.radius;

  if (dist >= minDist || dist === 0) {
    return { a: na, b: nb };
  }

  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = minDist - dist;
  na.x -= nx * overlap * 0.5;
  na.y -= ny * overlap * 0.5;
  nb.x += nx * overlap * 0.5;
  nb.y += ny * overlap * 0.5;

  const avn = na.vx * nx + na.vy * ny;
  const bvn = nb.vx * nx + nb.vy * ny;

  const atx = na.vx - avn * nx;
  const aty = na.vy - avn * ny;
  const btx = nb.vx - bvn * nx;
  const bty = nb.vy - bvn * ny;

  const newAvn = bvn * restitution;
  const newBvn = avn * restitution;

  na.vx = atx + newAvn * nx;
  na.vy = aty + newAvn * ny;
  nb.vx = btx + newBvn * nx;
  nb.vy = bty + newBvn * ny;

  return { a: na, b: nb };
}

export function predictPath(
  cueBall: Ball,
  balls: Ball[],
  angle: number,
  power: number,
  friction: number,
  restitution: number,
  tableWidth: number,
  tableHeight: number,
  cushionWidth: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let x = cueBall.x;
  let y = cueBall.y;
  let vx = Math.cos(angle) * power * 0.25;
  let vy = Math.sin(angle) * power * 0.25;
  const radius = cueBall.radius;
  const steps = 200;
  const dt = 1;

  points.push({ x, y });

  for (let i = 0; i < steps; i++) {
    x += vx * dt;
    y += vy * dt;

    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed <= 0.05) break;
    const newSpeed = Math.max(0, speed - friction * dt);
    const ratio = newSpeed / speed;
    vx *= ratio;
    vy *= ratio;

    const leftBound = cushionWidth + radius;
    const rightBound = tableWidth - cushionWidth - radius;
    const topBound = cushionWidth + radius;
    const bottomBound = tableHeight - cushionWidth - radius;

    let bounced = false;
    if (x <= leftBound) {
      x = leftBound;
      vx = -vx * restitution;
      bounced = true;
    } else if (x >= rightBound) {
      x = rightBound;
      vx = -vx * restitution;
      bounced = true;
    }
    if (y <= topBound) {
      y = topBound;
      vy = -vy * restitution;
      bounced = true;
    } else if (y >= bottomBound) {
      y = bottomBound;
      vy = -vy * restitution;
      bounced = true;
    }

    let hitBall = false;
    for (const ball of balls) {
      if (ball.isCueBall || ball.isPocketed) continue;
      const dx = ball.x - x;
      const dy = ball.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius + ball.radius) {
        hitBall = true;
        points.push({ x, y });
        break;
      }
    }
    if (hitBall) break;

    if (bounced || i % 3 === 0) {
      points.push({ x, y });
    }
  }

  return points;
}

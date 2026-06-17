import type { Ball, Pocket, TableConfig } from './types';

const FRICTION = 0.98;
const RESTITUTION = 0.85;
const STOP_THRESHOLD = 0.1;
const BALL_MASS = 1;

export function updateBalls(balls: Ball[], dt: number = 1): Ball[] {
  return balls.map((ball) => {
    if (ball.pocketed) return ball;

    let newVx = ball.vx * FRICTION;
    let newVy = ball.vy * FRICTION;

    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
    if (speed < STOP_THRESHOLD) {
      newVx = 0;
      newVy = 0;
    }

    const newX = ball.x + newVx * dt;
    const newY = ball.y + newVy * dt;

    const newTrail = [...ball.trail, { x: ball.x, y: ball.y }];
    if (newTrail.length > 20) {
      newTrail.shift();
    }

    return {
      ...ball,
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      trail: ball.number === 0 ? newTrail : ball.trail,
    };
  });
}

export function checkBallCollisions(balls: Ball[]): {
  balls: Ball[];
  collisionEvents: { x: number; y: number }[];
} {
  const result = balls.map((b) => ({ ...b }));
  const collisionEvents: { x: number; y: number }[] = [];

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];

      if (a.pocketed || b.pocketed) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        collisionEvents.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        const sepX = (overlap / 2) * nx;
        const sepY = (overlap / 2) * ny;

        a.x -= sepX;
        a.y -= sepY;
        b.x += sepX;
        b.y += sepY;

        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;

        const dvn = dvx * nx + dvy * ny;

        if (dvn > 0) {
          const massA = BALL_MASS;
          const massB = BALL_MASS;
          const impulse = (2 * dvn) / (massA + massB);

          a.vx -= impulse * massB * nx * RESTITUTION;
          a.vy -= impulse * massB * ny * RESTITUTION;
          b.vx += impulse * massA * nx * RESTITUTION;
          b.vy += impulse * massA * ny * RESTITUTION;
        }
      }
    }
  }

  return { balls: result, collisionEvents };
}

export function checkWallCollisions(
  balls: Ball[],
  table: TableConfig
): Ball[] {
  return balls.map((ball) => {
    if (ball.pocketed) return ball;

    let { x, y, vx, vy } = ball;
    const r = ball.radius;
    const left = table.offsetX + r;
    const right = table.offsetX + table.innerWidth - r;
    const top = table.offsetY + r;
    const bottom = table.offsetY + table.innerHeight - r;

    if (x < left) {
      x = left;
      vx = Math.abs(vx) * RESTITUTION;
    } else if (x > right) {
      x = right;
      vx = -Math.abs(vx) * RESTITUTION;
    }

    if (y < top) {
      y = top;
      vy = Math.abs(vy) * RESTITUTION;
    } else if (y > bottom) {
      y = bottom;
      vy = -Math.abs(vy) * RESTITUTION;
    }

    return { ...ball, x, y, vx, vy };
  });
}

export function checkPocketCollisions(
  balls: Ball[],
  pockets: Pocket[]
): {
  balls: Ball[];
  pocketedIds: string[];
  pocketEvents: { x: number; y: number; ballNumber: number }[];
} {
  const pocketedIds: string[] = [];
  const pocketEvents: { x: number; y: number; ballNumber: number }[] = [];

  const result = balls.map((ball) => {
    if (ball.pocketed) return ball;

    for (const pocket of pockets) {
      const dx = ball.x - pocket.x;
      const dy = ball.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pocket.radius) {
        pocketedIds.push(ball.id);
        pocketEvents.push({ x: pocket.x, y: pocket.y, ballNumber: ball.number });
        return { ...ball, pocketed: true, vx: 0, vy: 0 };
      }
    }
    return ball;
  });

  return { balls: result, pocketedIds, pocketEvents };
}

export function allBallsStopped(balls: Ball[]): boolean {
  return balls.every(
    (ball) => ball.pocketed || (ball.vx === 0 && ball.vy === 0)
  );
}

export function getPockets(table: TableConfig): Pocket[] {
  const pocketRadius = 22;
  const bx = table.offsetX;
  const by = table.offsetY;
  const iw = table.innerWidth;
  const ih = table.innerHeight;

  return [
    { x: bx, y: by, radius: pocketRadius },
    { x: bx + iw / 2, y: by - 2, radius: pocketRadius },
    { x: bx + iw, y: by, radius: pocketRadius },
    { x: bx, y: by + ih, radius: pocketRadius },
    { x: bx + iw / 2, y: by + ih + 2, radius: pocketRadius },
    { x: bx + iw, y: by + ih, radius: pocketRadius },
  ];
}

export function getTableConfig(
  canvasWidth: number,
  canvasHeight: number
): TableConfig {
  const tableWidth = 900;
  const tableHeight = 450;
  const borderWidth = 30;

  const scale = Math.min(
    (canvasWidth - 40) / (tableWidth + borderWidth * 2),
    (canvasHeight - 100) / (tableHeight + borderWidth * 2)
  );

  const scaledWidth = (tableWidth + borderWidth * 2) * scale;
  const scaledHeight = (tableHeight + borderWidth * 2) * scale;

  const offsetX = (canvasWidth - scaledWidth) / 2 + borderWidth * scale;
  const offsetY = (canvasHeight - scaledHeight) / 2 + borderWidth * scale;

  return {
    width: tableWidth,
    height: tableHeight,
    borderWidth: borderWidth * scale,
    innerWidth: tableWidth * scale,
    innerHeight: tableHeight * scale,
    offsetX,
    offsetY,
  };
}

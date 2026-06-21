export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  stripeColor?: string;
  type: 'solid' | 'stripe' | 'black' | 'cue';
  pocketed: boolean;
  scale: number;
  scaleTarget: number;
  squash: number;
  squashTimer: number;
  score: number;
}

export interface Pocket {
  x: number;
  y: number;
  radius: number;
}

export const BALL_RADIUS = 6;
export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 400;
export const CUSHION_WIDTH = 20;
export const PLAY_AREA_LEFT = CUSHION_WIDTH;
export const PLAY_AREA_RIGHT = TABLE_WIDTH - CUSHION_WIDTH;
export const PLAY_AREA_TOP = CUSHION_WIDTH;
export const PLAY_AREA_BOTTOM = TABLE_HEIGHT - CUSHION_WIDTH;

const BALL_COLORS: Record<number, { color: string; stripeColor?: string; type: 'solid' | 'stripe' | 'black' | 'cue'; score: number }> = {
  0: { color: '#FFFFFF', type: 'cue', score: 0 },
  1: { color: '#FFD700', type: 'solid', score: 1 },
  2: { color: '#1E90FF', type: 'solid', score: 1 },
  3: { color: '#DC143C', type: 'solid', score: 1 },
  4: { color: '#9932CC', type: 'solid', score: 1 },
  5: { color: '#FF8C00', type: 'solid', score: 1 },
  6: { color: '#228B22', type: 'solid', score: 1 },
  7: { color: '#8B0000', type: 'solid', score: 1 },
  8: { color: '#1a1a1a', type: 'black', score: 5 },
  9: { color: '#FFD700', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
  10: { color: '#1E90FF', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
  11: { color: '#DC143C', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
  12: { color: '#9932CC', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
  13: { color: '#FF8C00', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
  14: { color: '#228B22', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
  15: { color: '#8B0000', stripeColor: '#FFFFFF', type: 'stripe', score: 2 },
};

export function createBall(id: number, x: number, y: number): Ball {
  const info = BALL_COLORS[id];
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    color: info.color,
    stripeColor: info.stripeColor,
    type: info.type,
    pocketed: false,
    scale: 1,
    scaleTarget: 1,
    squash: 1,
    squashTimer: 0,
    score: info.score,
  };
}

export function createPockets(): Pocket[] {
  const pocketRadius = 14;
  return [
    { x: PLAY_AREA_LEFT, y: PLAY_AREA_TOP, radius: pocketRadius },
    { x: TABLE_WIDTH / 2, y: PLAY_AREA_TOP - 2, radius: pocketRadius },
    { x: PLAY_AREA_RIGHT, y: PLAY_AREA_TOP, radius: pocketRadius },
    { x: PLAY_AREA_LEFT, y: PLAY_AREA_BOTTOM, radius: pocketRadius },
    { x: TABLE_WIDTH / 2, y: PLAY_AREA_BOTTOM + 2, radius: pocketRadius },
    { x: PLAY_AREA_RIGHT, y: PLAY_AREA_BOTTOM, radius: pocketRadius },
  ];
}

export function createRack(): Ball[] {
  const balls: Ball[] = [];
  const startX = PLAY_AREA_LEFT + (PLAY_AREA_RIGHT - PLAY_AREA_LEFT) * 0.7;
  const startY = TABLE_HEIGHT / 2;
  const spacing = BALL_RADIUS * 2 + 0.5;

  const rackOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];

  let index = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const x = startX + row * spacing * 0.866;
      const y = startY + (col - row / 2) * spacing;
      balls.push(createBall(rackOrder[index], x, y));
      index++;
    }
  }

  const cueBall = createBall(0, PLAY_AREA_LEFT + (PLAY_AREA_RIGHT - PLAY_AREA_LEFT) * 0.25, TABLE_HEIGHT / 2);
  balls.unshift(cueBall);

  return balls;
}

export function checkPocketed(ball: Ball, pockets: Pocket[]): Pocket | null {
  if (ball.pocketed) return null;

  for (const pocket of pockets) {
    const dx = ball.x - pocket.x;
    const dy = ball.y - pocket.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pocket.radius - ball.radius * 0.3) {
      return pocket;
    }
  }
  return null;
}

export function pocketBall(ball: Ball): void {
  ball.pocketed = true;
  ball.scaleTarget = 0;
  ball.vx = 0;
  ball.vy = 0;
}

export function resetCueBall(ball: Ball): void {
  ball.x = PLAY_AREA_LEFT + (PLAY_AREA_RIGHT - PLAY_AREA_LEFT) * 0.25;
  ball.y = TABLE_HEIGHT / 2;
  ball.vx = 0;
  ball.vy = 0;
  ball.pocketed = false;
  ball.scale = 1;
  ball.scaleTarget = 1;
}

export function isAllStopped(balls: Ball[]): boolean {
  const speedThreshold = 0.05;
  for (const ball of balls) {
    if (ball.pocketed) continue;
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > speedThreshold) return false;
  }
  return true;
}

export function updateBallScales(balls: Ball[], deltaTime: number): void {
  const scaleSpeed = 8;
  for (const ball of balls) {
    if (ball.scale !== ball.scaleTarget) {
      const diff = ball.scaleTarget - ball.scale;
      ball.scale += diff * scaleSpeed * deltaTime;
      if (Math.abs(ball.scale - ball.scaleTarget) < 0.001) {
        ball.scale = ball.scaleTarget;
      }
    }
    if (ball.squashTimer > 0) {
      ball.squashTimer -= deltaTime;
      const squashDuration = 0.05;
      const t = ball.squashTimer / squashDuration;
      ball.squash = 1 + (1 - t) * 0.2;
      if (ball.squashTimer <= 0) {
        ball.squash = 1;
      }
    }
  }
}

export function triggerSquash(ball: Ball): void {
  ball.squashTimer = 0.05;
}

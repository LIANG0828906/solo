export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  number: number;
  isCueBall: boolean;
  isPocketed: boolean;
  isStriped: boolean;
}

export interface GameState {
  balls: Ball[];
  isAiming: boolean;
  power: number;
  aimAngle: number;
  isMoving: boolean;
  friction: number;
  restitution: number;
  tableWidth: number;
  tableHeight: number;
  cushionWidth: number;
  ballRadius: number;
  replayFrames: Ball[][];
  replayIndex: number;
  isReplaying: boolean;
  collisionEffects: CollisionEffect[];
}

export interface CollisionEffect {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export const BALL_RADIUS = 14;
export const TABLE_WIDTH = 800;
export const TABLE_HEIGHT = 450;
export const CUSHION_WIDTH = 30;
export const POCKET_RADIUS = 22;

export const POCKET_POSITIONS = [
  { x: CUSHION_WIDTH, y: CUSHION_WIDTH },
  { x: TABLE_WIDTH / 2, y: CUSHION_WIDTH - 4 },
  { x: TABLE_WIDTH - CUSHION_WIDTH, y: CUSHION_WIDTH },
  { x: CUSHION_WIDTH, y: TABLE_HEIGHT - CUSHION_WIDTH },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - CUSHION_WIDTH + 4 },
  { x: TABLE_WIDTH - CUSHION_WIDTH, y: TABLE_HEIGHT - CUSHION_WIDTH },
];

const BALL_COLORS = [
  '#FFFFFF',
  '#FFD700',
  '#0000FF',
  '#FF0000',
  '#4B0082',
  '#FF6600',
  '#006400',
  '#8B0000',
  '#000000',
  '#FFD700',
  '#0000FF',
  '#FF0000',
  '#4B0082',
  '#FF6600',
  '#006400',
  '#8B0000',
];

export function createInitialState(friction: number = 0.03, restitution: number = 0.9): GameState {
  const balls = initBalls(TABLE_WIDTH, TABLE_HEIGHT, BALL_RADIUS);
  return {
    balls,
    isAiming: false,
    power: 0,
    aimAngle: 0,
    isMoving: false,
    friction,
    restitution,
    tableWidth: TABLE_WIDTH,
    tableHeight: TABLE_HEIGHT,
    cushionWidth: CUSHION_WIDTH,
    ballRadius: BALL_RADIUS,
    replayFrames: [],
    replayIndex: -1,
    isReplaying: false,
    collisionEffects: [],
  };
}

export function initBalls(tableWidth: number, tableHeight: number, ballRadius: number): Ball[] {
  const balls: Ball[] = [];
  const startX = tableWidth * 0.72;
  const startY = tableHeight / 2;
  const spacing = ballRadius * 2.02;

  const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  let idx = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      const num = order[idx];
      balls.push({
        id: idx + 1,
        x: startX + row * spacing * Math.cos(Math.PI / 6),
        y: startY + (col - row / 2) * spacing,
        vx: 0,
        vy: 0,
        radius: ballRadius,
        color: BALL_COLORS[num],
        number: num,
        isCueBall: false,
        isPocketed: false,
        isStriped: num > 8,
      });
      idx++;
    }
  }

  balls.unshift({
    id: 0,
    x: tableWidth * 0.28,
    y: tableHeight / 2,
    vx: 0,
    vy: 0,
    radius: ballRadius,
    color: '#FFFFFF',
    number: 0,
    isCueBall: true,
    isPocketed: false,
    isStriped: false,
  });

  return balls;
}

export function applyShot(state: GameState, angle: number, power: number): GameState {
  const balls = state.balls.map(b => ({ ...b }));
  const cueBall = balls.find(b => b.isCueBall);
  if (cueBall && !cueBall.isPocketed) {
    const speed = power * 0.25;
    cueBall.vx = Math.cos(angle) * speed;
    cueBall.vy = Math.sin(angle) * speed;
  }
  return {
    ...state,
    balls,
    isMoving: true,
    isAiming: false,
    power: 0,
    replayFrames: [],
    replayIndex: -1,
    isReplaying: false,
  };
}

export function resetState(state: GameState): GameState {
  const balls = initBalls(state.tableWidth, state.tableHeight, state.ballRadius);
  return {
    ...state,
    balls,
    isAiming: false,
    power: 0,
    aimAngle: 0,
    isMoving: false,
    replayFrames: [],
    replayIndex: -1,
    isReplaying: false,
    collisionEffects: [],
  };
}

export function cloneBalls(balls: Ball[]): Ball[] {
  return balls.map(b => ({ ...b }));
}

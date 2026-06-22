import { Brick, PHYSICS_CONSTANTS, PowerUp, PowerUpType } from './physics';

export const BRICK_HP_COLORS: Record<number, string[]> = {
  1: ['#4ade80', '#86efac'],
  2: ['#facc15', '#fde047'],
  3: ['#f97316', '#fb923c']
};

const POWERUP_TYPES: PowerUpType[] = ['expand', 'multiball', 'piercing'];

export function createBrick(
  x: number,
  y: number,
  width: number,
  height: number,
  hp: number
): Brick {
  const safeHp = Math.max(1, Math.min(3, hp));
  const color = BRICK_HP_COLORS[safeHp][0];
  return {
    x,
    y,
    width,
    height,
    hp: safeHp,
    maxHp: safeHp,
    color,
    active: true
  };
}

export function generateLevel(level: number): Brick[] {
  const levels: ((n: number) => Brick[])[] = [
    generateLevel1,
    generateLevel2,
    generateLevel3,
    generateLevel4,
    generateLevel5
  ];

  const index = (level - 1) % levels.length;
  return levels[index](level);
}

function generateLevel1(_level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = 5;
  const cols = 10;
  const brickWidth = 70;
  const brickHeight = 24;
  const padding = 4;
  const startX = 40;
  const startY = PHYSICS_CONSTANTS.PLAY_TOP + 30;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const hp = Math.min(3, rows - row);
      bricks.push(createBrick(
        startX + col * (brickWidth + padding),
        startY + row * (brickHeight + padding),
        brickWidth,
        brickHeight,
        hp
      ));
    }
  }
  return bricks;
}

function generateLevel2(_level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = 5;
  const brickWidth = 70;
  const brickHeight = 24;
  const padding = 4;
  const startY = PHYSICS_CONSTANTS.PLAY_TOP + 30;

  for (let row = 0; row < rows; row++) {
    const cols = 10 - row * 2;
    const startX = 40 + row * (brickWidth + padding);
    const hp = Math.min(3, Math.max(1, row + 1));
    for (let col = 0; col < cols; col++) {
      bricks.push(createBrick(
        startX + col * (brickWidth + padding),
        startY + row * (brickHeight + padding),
        brickWidth,
        brickHeight,
        hp
      ));
    }
  }
  return bricks;
}

function generateLevel3(_level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = 6;
  const brickWidth = 70;
  const brickHeight = 24;
  const padding = 4;
  const startY = PHYSICS_CONSTANTS.PLAY_TOP + 20;

  for (let row = 0; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : (brickWidth + padding) / 2;
    const cols = row % 2 === 0 ? 10 : 9;
    const startX = 40 + offset;
    const hp = (row % 3) + 1;
    for (let col = 0; col < cols; col++) {
      bricks.push(createBrick(
        startX + col * (brickWidth + padding),
        startY + row * (brickHeight + padding),
        brickWidth,
        brickHeight,
        hp
      ));
    }
  }
  return bricks;
}

function generateLevel4(_level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = 8;
  const brickWidth = 70;
  const brickHeight = 24;
  const padding = 4;
  const startY = PHYSICS_CONSTANTS.PLAY_TOP + 10;

  for (let row = 0; row < rows; row++) {
    const startCol = row;
    const endCol = 9 - row;
    if (startCol > endCol) break;
    const hp = Math.min(3, row + 1);
    for (let col = startCol; col <= endCol; col++) {
      bricks.push(createBrick(
        40 + col * (brickWidth + padding),
        startY + row * (brickHeight + padding),
        brickWidth,
        brickHeight,
        hp
      ));
    }
  }
  return bricks;
}

function generateLevel5(_level: number): Brick[] {
  const bricks: Brick[] = [];
  const rows = 7;
  const cols = 10;
  const brickWidth = 70;
  const brickHeight = 24;
  const padding = 4;
  const startX = 40;
  const startY = PHYSICS_CONSTANTS.PLAY_TOP + 20;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isChecker = (row + col) % 2 === 0;
      if (!isChecker) continue;
      const hp = Math.min(3, Math.floor(Math.random() * 3) + 1);
      bricks.push(createBrick(
        startX + col * (brickWidth + padding),
        startY + row * (brickHeight + padding),
        brickWidth,
        brickHeight,
        hp
      ));
    }
  }
  return bricks;
}

export function maybeSpawnPowerUp(x: number, y: number): PowerUp | null {
  if (Math.random() > 0.15) return null;

  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  return {
    x: x - 15,
    y,
    vx: (Math.random() - 0.5) * 40,
    vy: -80,
    type,
    width: 30,
    height: 30,
    active: true,
    rotation: 0
  };
}

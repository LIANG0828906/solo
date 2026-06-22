export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const SEGMENT_HEIGHT = 200;

export interface Obstacle {
  type: 'barrel' | 'barrier' | 'spike';
  x: number;
  y: number;
}

export interface Coin {
  x: number;
  y: number;
  collected: boolean;
}

export interface Powerup {
  type: 'speed';
  x: number;
  y: number;
  collected: boolean;
}

export interface SegmentData {
  obstacles: Obstacle[];
  coins: Coin[];
  powerups: Powerup[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function generateSegment(yOffset: number, difficultyLevel: number): SegmentData {
  const obstacles: Obstacle[] = [];
  const coins: Coin[] = [];
  const powerups: Powerup[] = [];

  const baseObstacleCount = 2;
  const obstacleCount = Math.min(
    baseObstacleCount + Math.floor(difficultyLevel * baseObstacleCount * 0.15),
    8
  );

  const types: Array<'barrel' | 'barrier' | 'spike'> = ['barrel', 'barrier', 'spike'];

  for (let i = 0; i < obstacleCount; i++) {
    obstacles.push({
      type: types[randInt(0, 2)],
      x: rand(65, 735),
      y: yOffset + rand(20, SEGMENT_HEIGHT - 40),
    });
  }

  const coinCount = randInt(2, 4);
  for (let i = 0; i < coinCount; i++) {
    coins.push({
      x: rand(150, 650),
      y: yOffset + rand(20, SEGMENT_HEIGHT - 30),
      collected: false,
    });
  }

  if (Math.random() < 0.15) {
    powerups.push({
      type: 'speed',
      x: rand(150, 650),
      y: yOffset + rand(40, SEGMENT_HEIGHT - 40),
      collected: false,
    });
  }

  return { obstacles, coins, powerups };
}

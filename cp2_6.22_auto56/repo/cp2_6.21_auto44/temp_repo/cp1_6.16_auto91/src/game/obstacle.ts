import { Obstacle, ObstacleType, DataFragment, CONFIG } from '../types';

const NEON_COLORS = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF6600', '#00FF66', '#FF3366'];

export function createObstacle(gameSpeed: number): Obstacle {
  const types: ObstacleType[] = ['vent', 'antenna', 'billboard'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  let width: number, height: number, color: string;
  
  switch (type) {
    case 'vent':
      width = 60;
      height = 120;
      color = '#3a3a3a';
      break;
    case 'antenna':
      width = 40;
      height = 200;
      color = '#c0c0c0';
      break;
    case 'billboard':
      width = 80;
      height = 100;
      color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
      break;
  }
  
  return {
    x: CONFIG.CANVAS_WIDTH,
    y: CONFIG.GROUND_Y - height,
    width,
    height,
    type,
    color,
    speed: gameSpeed,
    textFrame: 0,
    passed: false
  };
}

export function updateObstacle(obstacle: Obstacle, deltaTime: number): void {
  const dt = deltaTime / 16.67;
  obstacle.x -= obstacle.speed * dt;
  
  obstacle.textFrame += deltaTime;
  if (obstacle.textFrame > 200) {
    obstacle.textFrame = 0;
  }
}

export function isObstacleOffScreen(obstacle: Obstacle): boolean {
  return obstacle.x + obstacle.width < 0;
}

export function createDataFragment(x: number, y: number): DataFragment {
  return {
    x,
    y: y - 100,
    size: 20,
    rotation: 0,
    rotationSpeed: Math.PI / 250,
    collected: false
  };
}

export function updateDataFragment(fragment: DataFragment, deltaTime: number, gameSpeed: number): void {
  const dt = deltaTime / 16.67;
  fragment.x -= gameSpeed * dt;
  fragment.rotation += fragment.rotationSpeed * deltaTime;
}

export function isFragmentOffScreen(fragment: DataFragment): boolean {
  return fragment.x + fragment.size < 0;
}

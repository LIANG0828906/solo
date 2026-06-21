export interface TargetConfig {
  id: string;
  type: 'barrel' | 'pot' | 'apple' | 'window';
  x: number;
  y: number;
  width: number;
  height: number;
  hp?: number;
  points?: number;
  movement?: {
    type: 'horizontal' | 'vertical' | 'circular';
    speed?: number;
    range?: number;
    centerX?: number;
    centerY?: number;
    radius?: number;
    rotationSpeed?: number;
  };
}

export interface ObstacleConfig {
  id: string;
  type: 'plank' | 'stone';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  stones: number;
  targets: TargetConfig[];
  obstacles: ObstacleConfig[];
  isBoss?: boolean;
}

const levels: LevelConfig[] = [
  {
    id: 1,
    name: '初次尝试',
    stones: 5,
    targets: [
      { id: 't1', type: 'barrel', x: 700, y: 550, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't2', type: 'barrel', x: 820, y: 550, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't3', type: 'barrel', x: 760, y: 420, width: 60, height: 80, hp: 1, points: 150 },
    ],
    obstacles: [],
  },
  {
    id: 2,
    name: '混合目标',
    stones: 6,
    targets: [
      { id: 't1', type: 'barrel', x: 680, y: 560, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't2', type: 'pot', x: 780, y: 580, width: 50, height: 60, hp: 1, points: 120 },
      { id: 't3', type: 'barrel', x: 880, y: 550, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't4', type: 'pot', x: 780, y: 430, width: 50, height: 60, hp: 1, points: 150 },
    ],
    obstacles: [],
  },
  {
    id: 3,
    name: '移动的苹果',
    stones: 5,
    targets: [
      { id: 't1', type: 'barrel', x: 680, y: 560, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't2', type: 'pot', x: 880, y: 560, width: 50, height: 60, hp: 1, points: 120 },
      { id: 't3', type: 'apple', x: 780, y: 450, width: 45, height: 45, hp: 1, points: 200,
        movement: { type: 'horizontal', speed: 1.5, range: 100 } },
      { id: 't4', type: 'barrel', x: 780, y: 580, width: 60, height: 80, hp: 1, points: 100 },
    ],
    obstacles: [],
  },
  {
    id: 4,
    name: '双重移动',
    stones: 6,
    targets: [
      { id: 't1', type: 'barrel', x: 650, y: 570, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't2', type: 'apple', x: 750, y: 480, width: 45, height: 45, hp: 1, points: 200,
        movement: { type: 'horizontal', speed: 1, range: 80 } },
      { id: 't3', type: 'pot', x: 850, y: 570, width: 50, height: 60, hp: 1, points: 120 },
      { id: 't4', type: 'apple', x: 800, y: 350, width: 45, height: 45, hp: 1, points: 250,
        movement: { type: 'horizontal', speed: 2.2, range: 120 } },
      { id: 't5', type: 'barrel', x: 920, y: 430, width: 60, height: 80, hp: 1, points: 150 },
    ],
    obstacles: [],
  },
  {
    id: 5,
    name: '远距射击',
    stones: 5,
    targets: [
      { id: 't1', type: 'pot', x: 850, y: 580, width: 45, height: 55, hp: 1, points: 150 },
      { id: 't2', type: 'pot', x: 920, y: 500, width: 45, height: 55, hp: 1, points: 180 },
      { id: 't3', type: 'pot', x: 880, y: 380, width: 45, height: 55, hp: 1, points: 200 },
      { id: 't4', type: 'pot', x: 950, y: 300, width: 45, height: 55, hp: 1, points: 250 },
      { id: 't5', type: 'apple', x: 820, y: 250, width: 40, height: 40, hp: 1, points: 300 },
    ],
    obstacles: [],
  },
  {
    id: 6,
    name: '木板障碍',
    stones: 6,
    targets: [
      { id: 't1', type: 'barrel', x: 720, y: 580, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't2', type: 'pot', x: 850, y: 580, width: 50, height: 60, hp: 1, points: 120 },
      { id: 't3', type: 'barrel', x: 940, y: 550, width: 60, height: 80, hp: 1, points: 150 },
      { id: 't4', type: 'pot', x: 780, y: 400, width: 50, height: 60, hp: 1, points: 180 },
      { id: 't5', type: 'apple', x: 900, y: 320, width: 45, height: 45, hp: 1, points: 200,
        movement: { type: 'horizontal', speed: 1.2, range: 60 } },
    ],
    obstacles: [
      { id: 'o1', type: 'plank', x: 600, y: 500, width: 20, height: 180, rotation: 0 },
      { id: 'o2', type: 'plank', x: 820, y: 470, width: 150, height: 15, rotation: 0 },
    ],
  },
  {
    id: 7,
    name: '双重遮挡',
    stones: 7,
    targets: [
      { id: 't1', type: 'barrel', x: 700, y: 590, width: 60, height: 80, hp: 1, points: 100 },
      { id: 't2', type: 'pot', x: 820, y: 590, width: 50, height: 60, hp: 1, points: 120 },
      { id: 't3', type: 'barrel', x: 930, y: 570, width: 60, height: 80, hp: 1, points: 150 },
      { id: 't4', type: 'pot', x: 750, y: 420, width: 50, height: 60, hp: 1, points: 180 },
      { id: 't5', type: 'apple', x: 880, y: 380, width: 45, height: 45, hp: 1, points: 220,
        movement: { type: 'horizontal', speed: 1.8, range: 70 } },
      { id: 't6', type: 'pot', x: 950, y: 280, width: 50, height: 60, hp: 1, points: 250 },
    ],
    obstacles: [
      { id: 'o1', type: 'stone', x: 620, y: 520, width: 50, height: 140, rotation: 0 },
      { id: 'o2', type: 'plank', x: 770, y: 500, width: 180, height: 15, rotation: 0 },
      { id: 'o3', type: 'stone', x: 850, y: 320, width: 45, height: 100, rotation: 0 },
      { id: 'o4', type: 'plank', x: 680, y: 340, width: 140, height: 15, rotation: 15 },
    ],
  },
  {
    id: 8,
    name: 'Boss: 木制堡垒',
    stones: 10,
    isBoss: true,
    targets: [
      { id: 'w1', type: 'window', x: 770, y: 300, width: 40, height: 40, hp: 2, points: 300,
        movement: { type: 'circular', centerX: 820, centerY: 400, radius: 130, rotationSpeed: 0.008 } },
      { id: 'w2', type: 'window', x: 870, y: 300, width: 40, height: 40, hp: 2, points: 300,
        movement: { type: 'circular', centerX: 820, centerY: 400, radius: 130, rotationSpeed: 0.008 } },
      { id: 'w3', type: 'window', x: 870, y: 500, width: 40, height: 40, hp: 2, points: 300,
        movement: { type: 'circular', centerX: 820, centerY: 400, radius: 130, rotationSpeed: 0.008 } },
      { id: 'w4', type: 'window', x: 770, y: 500, width: 40, height: 40, hp: 2, points: 300,
        movement: { type: 'circular', centerX: 820, centerY: 400, radius: 130, rotationSpeed: 0.008 } },
    ],
    obstacles: [
      { id: 'fortress', type: 'plank', x: 700, y: 280, width: 240, height: 280, rotation: 0 },
    ],
  },
];

export function getLevel(index: number): LevelConfig | null {
  if (index < 0 || index >= levels.length) {
    return null;
  }
  return levels[index];
}

export function getLevelCount(): number {
  return levels.length;
}

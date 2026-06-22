export interface TargetConfig {
  x: number;
  y: number;
}

export interface LevelData {
  id: number;
  name: string;
  targets: TargetConfig[];
  availableBalls: number;
  presetObstacles: { type: string; x: number; y: number; angle: number }[];
}

export const LEVELS: LevelData[] = [
  {
    id: 1,
    name: '初试身手',
    targets: [
      { x: 550, y: 450 },
      { x: 620, y: 450 },
    ],
    availableBalls: 3,
    presetObstacles: [],
  },
  {
    id: 2,
    name: '木箱堡垒',
    targets: [
      { x: 600, y: 450 },
      { x: 600, y: 400 },
      { x: 700, y: 450 },
    ],
    availableBalls: 3,
    presetObstacles: [
      { type: 'woodbox', x: 550, y: 450, angle: 0 },
      { type: 'woodbox', x: 650, y: 450, angle: 0 },
    ],
  },
  {
    id: 3,
    name: '钢铁防线',
    targets: [
      { x: 650, y: 450 },
    ],
    availableBalls: 3,
    presetObstacles: [
      { type: 'ironblock', x: 500, y: 460, angle: 0 },
      { type: 'ironblock', x: 570, y: 460, angle: 0 },
    ],
  },
  {
    id: 4,
    name: '弹跳世界',
    targets: [
      { x: 300, y: 350 },
      { x: 550, y: 300 },
      { x: 700, y: 450 },
    ],
    availableBalls: 4,
    presetObstacles: [
      { type: 'springboard', x: 450, y: 470, angle: -0.3 },
      { type: 'rubberball', x: 500, y: 400, angle: 0 },
    ],
  },
  {
    id: 5,
    name: '尖刺迷阵',
    targets: [
      { x: 400, y: 450 },
      { x: 600, y: 450 },
      { x: 700, y: 350 },
    ],
    availableBalls: 4,
    presetObstacles: [
      { type: 'spiketrap', x: 350, y: 470, angle: 0 },
      { type: 'woodbox', x: 500, y: 450, angle: 0 },
      { type: 'ironblock', x: 600, y: 400, angle: 0 },
      { type: 'springboard', x: 650, y: 470, angle: 0.2 },
    ],
  },
];

export class LevelManager {
  private currentLevelIndex: number = 0;
  private targetsHit: number = 0;

  getCurrentLevel(): LevelData {
    return LEVELS[this.currentLevelIndex];
  }

  getLevelCount(): number {
    return LEVELS.length;
  }

  calculateStars(targetsHit: number, totalTargets: number, remainingBalls: number): number {
    if (targetsHit < totalTargets) return 1;
    if (remainingBalls >= 2) return 3;
    if (remainingBalls >= 1) return 2;
    return 1;
  }

  calculateScore(targetsHit: number, remainingBalls: number): number {
    return targetsHit * 100 + remainingBalls * 50;
  }

  nextLevel(): LevelData | null {
    this.currentLevelIndex++;
    this.targetsHit = 0;
    if (this.currentLevelIndex >= LEVELS.length) {
      return null;
    }
    return LEVELS[this.currentLevelIndex];
  }

  resetLevel(): void {
    this.targetsHit = 0;
  }

  isCompleted(): boolean {
    return this.currentLevelIndex >= LEVELS.length - 1;
  }

  setTargetsHit(count: number): void {
    this.targetsHit = count;
  }

  getTargetsHit(): number {
    return this.targetsHit;
  }

  getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  setCurrentLevelIndex(index: number): void {
    this.currentLevelIndex = Math.min(index, LEVELS.length - 1);
    this.targetsHit = 0;
  }
}

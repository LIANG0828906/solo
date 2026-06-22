import type { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: 1,
    targetScore: 10,
    debrisCount: 100,
    description: '第一关'
  },
  {
    id: 2,
    targetScore: 25,
    debrisCount: 100,
    description: '第二关'
  },
  {
    id: 3,
    targetScore: 50,
    debrisCount: 100,
    description: '第三关'
  }
];

export function getCurrentLevel(currentLevel: number): Level {
  const index = Math.min(currentLevel - 1, LEVELS.length - 1);
  return LEVELS[index];
}

export function isLastLevel(currentLevel: number): boolean {
  return currentLevel >= LEVELS.length;
}

export function checkLevelComplete(score: number, currentLevel: number): boolean {
  const level = getCurrentLevel(currentLevel);
  return score >= level.targetScore;
}

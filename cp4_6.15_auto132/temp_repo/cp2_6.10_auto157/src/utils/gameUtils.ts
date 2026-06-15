import type { GameInstruction, RankConfig, RankName } from '../types';

const RANK_CONFIG: RankConfig[] = [
  { name: '洒扫童子', minScore: 0 },
  { name: '侍墨童子', minScore: 50 },
  { name: '伴读书童', minScore: 100 },
  { name: '文房管事', minScore: 200 },
  { name: '知书房事', minScore: 350 },
  { name: '翰林院侍书', minScore: 500 },
];

export function calculateRank(score: number): string {
  let rank: RankName = '洒扫童子';
  for (const config of RANK_CONFIG) {
    if (score >= config.minScore) {
      rank = config.name;
    } else {
      break;
    }
  }
  return rank;
}

export function getRandomInstruction(
  instructions: GameInstruction[]
): GameInstruction {
  if (instructions.length === 0) {
    throw new Error('Instructions array cannot be empty');
  }
  const randomIndex = Math.floor(Math.random() * instructions.length);
  return instructions[randomIndex];
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

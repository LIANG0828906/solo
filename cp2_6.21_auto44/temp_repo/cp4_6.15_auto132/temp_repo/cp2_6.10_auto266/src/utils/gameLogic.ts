import type { Star, Inscription, StarRecord } from '../types';
import { STARS, STAR_MATCHING } from '../types';

export function generateStarPositions(): Star[] {
  const centerX = 200;
  const centerY = 200;
  const radius = 150;
  const stars = [...STARS];
  
  for (let i = 0; i < stars.length; i++) {
    const angle = (i / stars.length) * Math.PI * 2 - Math.PI / 2;
    stars[i] = {
      ...stars[i],
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  }
  
  return stars;
}

export function getMatchingInscriptions(starId: string, available: Inscription[]): Inscription[] {
  const matchingEntries = Object.values(STAR_MATCHING).filter(
    (match) => match.star === starId
  );
  const matchingInscriptionIds = matchingEntries.map((entry) => entry.inscription);
  return available.filter((inscription) =>
    matchingInscriptionIds.includes(inscription.id)
  );
}

export function calculateAccuracy(records: StarRecord[]): number {
  if (records.length === 0) return 0;
  const successCount = records.filter((record) => record.success).length;
  return Math.round((successCount / records.length) * 100);
}

export function getGrade(accuracy: number, cultivation: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  const score = accuracy * 0.7 + Math.min(cultivation / 100, 1) * 30;
  
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

export function getComment(grade: string): string {
  switch (grade) {
    case 'S':
      return '天资卓绝，星文之道已登峰造极！';
    case 'A':
      return '勤勉好学，星文造诣颇深。';
    case 'B':
      return '学有所成，仍需精益求精。';
    case 'C':
      return '勤勉不足，尚需多加努力。';
    case 'D':
      return '根基不稳，需从头学起。';
    default:
      return '继续努力。';
  }
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

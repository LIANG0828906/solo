import type { Note } from './scoreParser';

export interface MatchResult {
  index: number;
  correct: boolean;
  timestamp: number;
}

export function compareNote(played: string, target: Note): boolean {
  return played === target.note;
}

export function getAccuracy(results: MatchResult[]): number {
  if (results.length === 0) return 100;
  const correct = results.filter((r) => r.correct).length;
  return Math.round((correct / results.length) * 100);
}

export function getAccuracyColor(accuracy: number): string {
  if (accuracy < 50) return '#FF6B6B';
  if (accuracy < 80) return '#FFE66D';
  return '#4ECDC4';
}

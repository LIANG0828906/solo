import type { PoemLine, TonalResult } from '../types';

export function checkTonalPattern(lines: PoemLine[]): TonalResult[] {
  return lines
    .filter((line) => line.text.length > 0)
    .map((line) => ({
      lineId: line.id,
      score: 100,
      errors: [],
    }));
}

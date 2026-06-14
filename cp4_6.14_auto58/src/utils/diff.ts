import type { DiffSegment } from '../types';

interface LCSCell {
  length: number;
  direction: 'diagonal' | 'up' | 'left' | null;
}

export function computeDiff(oldText: string, newText: string): DiffSegment[] {
  const oldChars = oldText.split('');
  const newChars = newText.split('');
  const m = oldChars.length;
  const n = newChars.length;

  const dp: LCSCell[][] = Array(m + 1)
    .fill(null)
    .map(() =>
      Array(n + 1)
        .fill(null)
        .map(() => ({ length: 0, direction: null }))
    );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j].length = dp[i - 1][j - 1].length + 1;
        dp[i][j].direction = 'diagonal';
      } else if (dp[i - 1][j].length >= dp[i][j - 1].length) {
        dp[i][j].length = dp[i - 1][j].length;
        dp[i][j].direction = 'up';
      } else {
        dp[i][j].length = dp[i][j - 1].length;
        dp[i][j].direction = 'left';
      }
    }
  }

  const segments: DiffSegment[] = [];
  let i = m;
  let j = n;
  let currentSegment: DiffSegment | null = null;

  while (i > 0 || j > 0) {
    let type: 'added' | 'removed' | 'unchanged';
    let char: string;

    if (i > 0 && j > 0 && dp[i][j].direction === 'diagonal') {
      type = 'unchanged';
      char = oldChars[i - 1];
      i--;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j].direction === 'up')) {
      type = 'removed';
      char = oldChars[i - 1];
      i--;
    } else {
      type = 'added';
      char = newChars[j - 1];
      j--;
    }

    if (currentSegment && currentSegment.type === type) {
      currentSegment.value = char + currentSegment.value;
    } else {
      if (currentSegment) {
        segments.unshift(currentSegment);
      }
      currentSegment = { type, value: char };
    }
  }

  if (currentSegment) {
    segments.unshift(currentSegment);
  }

  return segments;
}

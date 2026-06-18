import type { DiffSegment, DiffOp } from '@/types';

export function computeDiff(oldText: string, newText: string): DiffSegment[] {
  const oldChars = Array.from(oldText);
  const newChars = Array.from(newText);
  const m = oldChars.length;
  const n = newChars.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const segments: DiffSegment[] = [];
  let i = m;
  let j = n;

  const push = (op: DiffOp, text: string) => {
    if (!text) return;
    if (segments.length > 0 && segments[segments.length - 1].op === op) {
      segments[segments.length - 1].text = text + segments[segments.length - 1].text;
    } else {
      segments.unshift({ op, text });
    }
  };

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      push('equal', oldChars[i - 1]);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      push('insert', newChars[j - 1]);
      j--;
    } else {
      push('delete', oldChars[i - 1]);
      i--;
    }
  }

  return segments;
}

export function renderDiffHTML(segments: DiffSegment[]): string {
  return segments
    .map((seg) => {
      const escaped = seg.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      switch (seg.op) {
        case 'insert':
          return `<span class="diff-insert">${escaped}</span>`;
        case 'delete':
          return `<span class="diff-delete">${escaped}</span>`;
        default:
          return escaped;
      }
    })
    .join('');
}

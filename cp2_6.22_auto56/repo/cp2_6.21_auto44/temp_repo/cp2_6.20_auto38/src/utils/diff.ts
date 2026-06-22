export interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  content: string;
  lineNumber?: number;
}

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'equal', content: oldLines[i - 1], lineNumber: i });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', content: newLines[j - 1], lineNumber: j });
      j--;
    } else {
      result.unshift({ type: 'removed', content: oldLines[i - 1], lineNumber: i });
      i--;
    }
  }

  return result;
}

export function diffChars(oldText: string, newText: string): DiffLine[] {
  const result: DiffLine[] = [];
  const maxLen = Math.max(oldText.length, newText.length);
  let currentOld = '';
  let currentNew = '';
  let currentType: 'equal' | 'added' | 'removed' | null = null;

  for (let i = 0; i < maxLen; i++) {
    const oldChar = oldText[i];
    const newChar = newText[i];

    if (oldChar === newChar) {
      if (currentType === 'equal') {
        currentOld += oldChar;
      } else {
        if (currentType === 'removed') {
          result.push({ type: 'removed', content: currentOld });
        } else if (currentType === 'added') {
          result.push({ type: 'added', content: currentNew });
        }
        currentType = 'equal';
        currentOld = oldChar;
        currentNew = '';
      }
    } else if (oldChar !== undefined && newChar !== undefined) {
      if (currentType === 'removed') {
        currentOld += oldChar;
        currentNew += newChar;
      } else {
        if (currentType === 'equal') {
          result.push({ type: 'equal', content: currentOld });
        } else if (currentType === 'added') {
          result.push({ type: 'added', content: currentNew });
        }
        currentType = 'removed';
        currentOld = oldChar;
        currentNew = newChar;
      }
    } else if (oldChar !== undefined) {
      if (currentType === 'removed') {
        currentOld += oldChar;
      } else {
        if (currentType === 'equal') {
          result.push({ type: 'equal', content: currentOld });
        } else if (currentType === 'added') {
          result.push({ type: 'added', content: currentNew });
        }
        currentType = 'removed';
        currentOld = oldChar;
        currentNew = '';
      }
    } else if (newChar !== undefined) {
      if (currentType === 'added') {
        currentNew += newChar;
      } else {
        if (currentType === 'equal') {
          result.push({ type: 'equal', content: currentOld });
        } else if (currentType === 'removed') {
          result.push({ type: 'removed', content: currentOld });
        }
        currentType = 'added';
        currentNew = newChar;
        currentOld = '';
      }
    }
  }

  if (currentType === 'equal') {
    result.push({ type: 'equal', content: currentOld });
  } else if (currentType === 'removed') {
    result.push({ type: 'removed', content: currentOld });
    result.push({ type: 'added', content: currentNew });
  } else if (currentType === 'added') {
    result.push({ type: 'added', content: currentNew });
  }

  return result;
}

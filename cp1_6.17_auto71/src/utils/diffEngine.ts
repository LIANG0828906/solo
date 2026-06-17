export type DiffLineType = 'add' | 'remove' | 'equal';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  leftLine: number | null;
  rightLine: number | null;
}

export interface DiffResult {
  lines: DiffLine[];
  leftTotal: number;
  rightTotal: number;
  addCount: number;
  removeCount: number;
}

const TIMEOUT_MS = 50;

export const computeDiff = (oldCode: string, newCode: string): DiffResult => {
  const startTime = performance.now();
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  if (m === 0) {
    return {
      lines: newLines.map((line, i) => ({
        type: 'add' as DiffLineType,
        content: line,
        leftLine: null,
        rightLine: i + 1,
      })),
      leftTotal: 0,
      rightTotal: n,
      addCount: n,
      removeCount: 0,
    };
  }

  if (n === 0) {
    return {
      lines: oldLines.map((line, i) => ({
        type: 'remove' as DiffLineType,
        content: line,
        leftLine: i + 1,
        rightLine: null,
      })),
      leftTotal: m,
      rightTotal: 0,
      addCount: 0,
      removeCount: m,
    };
  }

  const useOptimized = m * n > 500000;

  if (useOptimized) {
    return computeDiffGreedy(oldLines, newLines, startTime);
  }

  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }

  let timedOut = false;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    if (!timedOut && i % 50 === 0 && performance.now() - startTime > TIMEOUT_MS) {
      timedOut = true;
    }
  }

  if (timedOut) {
    return computeDiffGreedy(oldLines, newLines, startTime);
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: 'equal',
        content: oldLines[i - 1],
        leftLine: i,
        rightLine: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'add',
        content: newLines[j - 1],
        leftLine: null,
        rightLine: j,
      });
      j--;
    } else {
      result.unshift({
        type: 'remove',
        content: oldLines[i - 1],
        leftLine: i,
        rightLine: null,
      });
      i--;
    }
  }

  let addCount = 0;
  let removeCount = 0;
  for (const line of result) {
    if (line.type === 'add') addCount++;
    if (line.type === 'remove') removeCount++;
  }

  return {
    lines: result,
    leftTotal: m,
    rightTotal: n,
    addCount,
    removeCount,
  };
};

const computeDiffGreedy = (
  oldLines: string[],
  newLines: string[],
  _startTime: number,
): DiffResult => {
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  const m = oldLines.length;
  const n = newLines.length;

  const oldHash = new Map<string, number[]>();
  for (let k = 0; k < m; k++) {
    if (!oldHash.has(oldLines[k])) {
      oldHash.set(oldLines[k], []);
    }
    oldHash.get(oldLines[k])!.push(k);
  }

  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      result.push({
        type: 'equal',
        content: oldLines[i],
        leftLine: i + 1,
        rightLine: j + 1,
      });
      i++;
      j++;
    } else {
      const matches = oldHash.get(newLines[j]);
      let foundMatch = false;

      if (matches) {
        for (const matchIdx of matches) {
          if (matchIdx > i) {
            let a = i;
            let b = j;
            let matchLen = 0;
            while (
              a < m &&
              b < n &&
              oldLines[a] === newLines[b] &&
              matchLen < 10
            ) {
              matchLen++;
              a++;
              b++;
            }

            if (matchLen >= 2) {
              for (let k = i; k < matchIdx; k++) {
                result.push({
                  type: 'remove',
                  content: oldLines[k],
                  leftLine: k + 1,
                  rightLine: null,
                });
              }
              i = matchIdx;
              foundMatch = true;
              break;
            }
          }
        }
      }

      if (!foundMatch) {
        result.push({
          type: 'remove',
          content: oldLines[i],
          leftLine: i + 1,
          rightLine: null,
        });
        i++;
      }
    }
  }

  while (i < m) {
    result.push({
      type: 'remove',
      content: oldLines[i],
      leftLine: i + 1,
      rightLine: null,
    });
    i++;
  }

  while (j < n) {
    result.push({
      type: 'add',
      content: newLines[j],
      leftLine: null,
      rightLine: j + 1,
    });
    j++;
  }

  let addCount = 0;
  let removeCount = 0;
  for (const line of result) {
    if (line.type === 'add') addCount++;
    if (line.type === 'remove') removeCount++;
  }

  return {
    lines: result,
    leftTotal: m,
    rightTotal: n,
    addCount,
    removeCount,
  };
};

import { useAppStore, Snapshot } from './store';

export interface CompareResult {
  weiboDiff: DiffSegment[];
  officialAccountDiff: DiffSegment[];
  seoDiff: DiffSegment[];
}

export interface DiffSegment {
  type: 'same' | 'added' | 'removed';
  text: string;
}

function generateId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveSnapshot(data: {
  weibo: string;
  officialAccount: string;
  seo: string;
}): Snapshot {
  const snapshot: Snapshot = {
    id: generateId(),
    timestamp: Date.now(),
    weibo: data.weibo,
    officialAccount: data.officialAccount,
    seo: data.seo,
  };
  useAppStore.getState().addVersion(snapshot);
  return snapshot;
}

export function getHistory(): Snapshot[] {
  return useAppStore.getState().versions;
}

export function rollback(versionId: string): boolean {
  const versions = useAppStore.getState().versions;
  const exists = versions.some(v => v.id === versionId);
  if (exists) {
    useAppStore.getState().rollbackToVersion(versionId);
    return true;
  }
  return false;
}

function computeDiff(oldText: string, newText: string): DiffSegment[] {
  const oldChars = [...oldText];
  const newChars = [...newText];
  const m = oldChars.length;
  const n = newChars.length;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

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
  const temp: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      temp.push({ type: 'same', text: oldChars[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ type: 'added', text: newChars[j - 1] });
      j--;
    } else {
      temp.push({ type: 'removed', text: oldChars[i - 1] });
      i--;
    }
  }

  temp.reverse();

  let current: DiffSegment | null = null;
  for (const seg of temp) {
    if (current && current.type === seg.type) {
      current.text += seg.text;
    } else {
      if (current) segments.push(current);
      current = { ...seg };
    }
  }
  if (current) segments.push(current);

  return segments;
}

export function compareSnapshots(
  versionIdA: string,
  versionIdB: string
): CompareResult | null {
  const versions = useAppStore.getState().versions;
  const a = versions.find(v => v.id === versionIdA);
  const b = versions.find(v => v.id === versionIdB);
  if (!a || !b) return null;

  return {
    weiboDiff: computeDiff(a.weibo, b.weibo),
    officialAccountDiff: computeDiff(a.officialAccount, b.officialAccount),
    seoDiff: computeDiff(a.seo, b.seo),
  };
}

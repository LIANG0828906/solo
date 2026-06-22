import type { DiffResult, DiffType } from '@/types/schema';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  if (isObject(a) && isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  return false;
}

function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  currentPath: string[],
  results: DiffResult[],
): void {
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const path = [...currentPath, key];
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    const inOld = key in oldObj;
    const inNew = key in newObj;

    if (inOld && !inNew) {
      results.push({
        type: 'remove',
        path,
        oldValue: oldVal,
      });
    } else if (!inOld && inNew) {
      results.push({
        type: 'add',
        path,
        newValue: newVal,
      });
    } else if (inOld && inNew) {
      if (isObject(oldVal) && isObject(newVal)) {
        diffObjects(oldVal, newVal, path, results);
      } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        if (!deepEqual(oldVal, newVal)) {
          results.push({
            type: 'modify',
            path,
            oldValue: oldVal,
            newValue: newVal,
          });
        }
      } else if (!deepEqual(oldVal, newVal)) {
        results.push({
          type: 'modify',
          path,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }
  }
}

export function diff(oldData: unknown, newData: unknown): DiffResult[] {
  const results: DiffResult[] = [];

  if (isObject(oldData) && isObject(newData)) {
    diffObjects(oldData, newData, [], results);
  } else if (!deepEqual(oldData, newData)) {
    results.push({
      type: 'modify',
      path: [],
      oldValue: oldData,
      newValue: newData,
    });
  }

  return results;
}

export function countDiffs(results: DiffResult[]): Record<DiffType, number> {
  const counts: Record<DiffType, number> = {
    add: 0,
    remove: 0,
    modify: 0,
  };

  for (const r of results) {
    counts[r.type]++;
  }

  return counts;
}

export function createDiffPathSet(results: DiffResult[]): Set<string> {
  const set = new Set<string>();
  for (const r of results) {
    for (let i = 1; i <= r.path.length; i++) {
      set.add(r.path.slice(0, i).join('.'));
    }
  }
  return set;
}

export function getDiffTypeForPath(
  results: DiffResult[],
  path: string[],
): DiffType | null {
  const pathStr = path.join('.');
  for (const r of results) {
    if (r.path.join('.') === pathStr) {
      return r.type;
    }
  }
  return null;
}

export function getDiffForPath(
  results: DiffResult[],
  path: string[],
): DiffResult | null {
  const pathStr = path.join('.');
  for (const r of results) {
    if (r.path.join('.') === pathStr) {
      return r;
    }
  }
  return null;
}

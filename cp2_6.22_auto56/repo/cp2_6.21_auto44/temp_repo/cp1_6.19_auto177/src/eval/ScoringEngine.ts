import { ScoreRecord, ConsistencyMetrics, Assignment } from '../types';
import { computeRaterBias } from './BiasCalculator';
import { store } from '../store';

export function calculateKendallW(raters: number[][]): number {
  const n = raters.length;
  if (n < 2) return 1;
  const k = raters[0].length;
  if (k < 2) return 1;

  const rankSums: number[] = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    const ranks = toRanks(raters[i]);
    for (let j = 0; j < k; j++) {
      rankSums[j] += ranks[j];
    }
  }

  const meanRankSum = (n * (k + 1)) / 2;
  let S = 0;
  for (let j = 0; j < k; j++) {
    const diff = rankSums[j] - meanRankSum;
    S += diff * diff;
  }

  const S_max = (n * n * (k * k * k - k)) / 12;
  if (S_max === 0) return 1;
  return S / S_max;
}

function toRanks(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks: number[] = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) {
      j++;
    }
    const avgRank = ((i + 1) + (j + 1)) / 2;
    for (let m = i; m <= j; m++) {
      ranks[indexed[m].i] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

export function calculateCohenKappa(raterA: number[], raterB: number[], bins = 5): number {
  const n = Math.min(raterA.length, raterB.length);
  if (n === 0) return 1;

  const bin = (val: number): number => Math.max(0, Math.min(bins - 1, Math.round(val * 2) / 2 >= bins ? bins - 1 : Math.floor(val)));

  const C: number[][] = Array.from({ length: bins }, () => new Array(bins).fill(0));
  for (let i = 0; i < n; i++) {
    const a = bin(raterA[i]);
    const b = bin(raterB[i]);
    C[a][b]++;
  }

  let P0 = 0;
  for (let i = 0; i < bins; i++) P0 += C[i][i];
  P0 /= n;

  const rowSums = new Array(bins).fill(0);
  const colSums = new Array(bins).fill(0);
  for (let i = 0; i < bins; i++) {
    for (let j = 0; j < bins; j++) {
      rowSums[i] += C[i][j];
      colSums[j] += C[i][j];
    }
  }
  let Pe = 0;
  for (let i = 0; i < bins; i++) {
    Pe += (rowSums[i] / n) * (colSums[i] / n);
  }

  if (Pe === 1) return 1;
  return (P0 - Pe) / (1 - Pe);
}

export function buildRaterMatrix(records: ScoreRecord[], assignment: Assignment): { matrix: number[][]; raterIds: string[] } {
  const dimId = assignment.dimensions[0]?.id;
  if (!dimId) return { matrix: [], raterIds: [] };

  const bySub = new Map<string, Map<string, number>>();
  const raterSet = new Set<string>();
  const subSet = new Set<string>();

  for (const r of records) {
    const s = bySub.get(r.submissionId) || new Map<string, number>();
    const score = r.scores[dimId] ?? 0;
    s.set(r.raterId, score);
    bySub.set(r.submissionId, s);
    raterSet.add(r.raterId);
    subSet.add(r.submissionId);
  }

  const raterIds = Array.from(raterSet);
  const subIds = Array.from(subSet);
  const matrix: number[][] = [];

  for (const raterId of raterIds) {
    const row: number[] = [];
    for (const subId of subIds) {
      const s = bySub.get(subId);
      row.push(s?.get(raterId) ?? 0);
    }
    matrix.push(row);
  }

  return { matrix, raterIds };
}

export function computeConsistency(assignmentId: string, records: ScoreRecord[], assignments: Assignment[]): ConsistencyMetrics {
  const assignment = assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    return {
      assignmentId,
      kendallW: 0,
      cohenKappa: 0,
      isAlert: true,
      calculatedAt: new Date().toISOString(),
    };
  }

  const { matrix, raterIds } = buildRaterMatrix(records, assignment);
  const kendallW = matrix.length > 0 ? calculateKendallW(matrix) : 0;

  let cohenKappa = 0;
  if (raterIds.length >= 2) {
    const kappaValues: number[] = [];
    for (let i = 0; i < raterIds.length - 1; i++) {
      for (let j = i + 1; j < raterIds.length; j++) {
        const a: number[] = [];
        const b: number[] = [];
        const subMap = new Map<string, [number, number]>();
        for (const r of records) {
          if (r.raterId === raterIds[i]) {
            const cur = subMap.get(r.submissionId) || [0, 0];
            cur[0] = Object.values(r.scores).reduce((s, v) => s + v, 0);
            subMap.set(r.submissionId, cur);
          }
          if (r.raterId === raterIds[j]) {
            const cur = subMap.get(r.submissionId) || [0, 0];
            cur[1] = Object.values(r.scores).reduce((s, v) => s + v, 0);
            subMap.set(r.submissionId, cur);
          }
        }
        for (const pair of subMap.values()) {
          if (pair[0] > 0 && pair[1] > 0) {
            a.push(pair[0]);
            b.push(pair[1]);
          }
        }
        if (a.length > 0) kappaValues.push(calculateCohenKappa(a, b, 11));
      }
    }
    cohenKappa = kappaValues.length ? kappaValues.reduce((s, v) => s + v, 0) / kappaValues.length : 0;
  }

  return {
    assignmentId,
    kendallW,
    cohenKappa,
    isAlert: kendallW < 0.6,
    calculatedAt: new Date().toISOString(),
  };
}

export function recomputeForAssignment(assignmentId: string): void {
  const state = store.getState();
  const records = state.scoreRecords.filter((r) => r.assignmentId === assignmentId);
  const metrics = computeConsistency(assignmentId, records, state.assignments);
  store.updateConsistencyMetrics(metrics);

  const bias = computeRaterBias(assignmentId, records, state.assignments, state.students);
  store.updateRaterBiasData(assignmentId, bias);

  const trends = buildTrends(state.raterBiasData, state.assignments, state.students);
  store.updateRaterBiasTrends(trends);
}

function buildTrends(
  biasMap: Record<string, import('../types').RaterBiasData[]>,
  assignments: Assignment[],
  students: { id: string; name: string }[],
): Record<string, import('../types').BiasTrendPoint[]> {
  const result: Record<string, import('../types').BiasTrendPoint[]> = {};
  const sorted = [...assignments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const s of students) {
    result[s.id] = [];
    for (const a of sorted) {
      const arr = biasMap[a.id] || [];
      const found = arr.find((d) => d.raterId === s.id);
      if (found) {
        result[s.id].push({
          assignmentId: a.id,
          assignmentTitle: a.title,
          biasValue: found.biasValue,
          date: a.createdAt.slice(5, 10),
        });
      }
    }
  }
  return result;
}

export function getRaterBias(assignmentId: string): import('../types').RaterBiasData[] {
  const state = store.getState();
  return state.raterBiasData[assignmentId] || [];
}

import { ScoreRecord, RaterBiasData, Assignment } from '../types';

export function computeRaterBias(
  assignmentId: string,
  records: ScoreRecord[],
  assignments: Assignment[],
  students: { id: string; name: string }[],
): RaterBiasData[] {
  const filtered = records.filter((r) => r.assignmentId === assignmentId);
  if (filtered.length === 0) return [];

  const scores: number[] = [];
  const byRater: Record<string, number[]> = {};

  for (const r of filtered) {
    const total = Object.values(r.scores).reduce((s, v) => s + v, 0);
    scores.push(total);
    if (!byRater[r.raterId]) byRater[r.raterId] = [];
    byRater[r.raterId].push(total);
  }

  const globalMean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance =
    scores.reduce((s, v) => {
      const d = v - globalMean;
      return s + d * d;
    }, 0) / scores.length;
  const sigma = Math.sqrt(variance) || 1;

  const result: RaterBiasData[] = [];
  for (const raterId of Object.keys(byRater)) {
    const arr = byRater[raterId];
    const meanScore = arr.reduce((s, v) => s + v, 0) / arr.length;
    const biasValue = (meanScore - globalMean) / sigma;
    const student = students.find((s) => s.id === raterId);
    result.push({
      raterId,
      raterName: student?.name || raterId,
      assignmentId,
      biasValue,
      meanScore,
      globalMean,
    });
  }

  return result;
}

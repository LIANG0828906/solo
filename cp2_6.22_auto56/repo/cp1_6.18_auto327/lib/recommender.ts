import { FLAVOR_ORDER } from './flavorAnalyzer';

export interface RecordWithTags {
  id: string;
  coffeeName: string;
  rating: number;
  roastLevel: string;
  notes?: string | null;
  createdAt: Date | string;
  flavorTags: Array<{ id: string; name: string; color: string }>;
}

export interface RecommendedRecord extends RecordWithTags {
  similarityScore: number;
}

function buildFlavorVector(record: Pick<RecordWithTags, 'flavorTags'>): number[] {
  const tagSet = new Set(record.flavorTags.map((t) => t.name));
  return FLAVOR_ORDER.map((flavor) => (tagSet.has(flavor) ? 1 : 0));
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

export function getRecommendations(
  currentRecord: RecordWithTags,
  allRecords: RecordWithTags[],
  topN: number = 3
): RecommendedRecord[] {
  const currentVector = buildFlavorVector(currentRecord);
  const roastBoost = 0.15;

  const scored = allRecords
    .filter((r) => r.id !== currentRecord.id)
    .map((record) => {
      const recordVector = buildFlavorVector(record);
      let score = cosineSimilarity(currentVector, recordVector);

      if (record.roastLevel === currentRecord.roastLevel) {
        score += roastBoost;
      }

      const ratingDiff = Math.abs(record.rating - currentRecord.rating);
      score -= ratingDiff * 0.03;

      return {
        ...record,
        similarityScore: Math.max(0, Math.min(1, score)),
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);

  const unique = new Map<string, RecommendedRecord>();
  for (const r of scored) {
    if (!unique.has(r.coffeeName)) {
      unique.set(r.coffeeName, r);
    }
  }

  return Array.from(unique.values()).slice(0, topN);
}

export function getUserSimilarityRecommendations(
  allRecords: RecordWithTags[],
  topN: number = 3
): RecommendedRecord[] {
  if (allRecords.length <= 1) return [];

  const sorted = [...allRecords].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const recent = sorted.slice(0, Math.min(5, sorted.length));
  const recentVectors = recent.map(buildFlavorVector);
  const avgVector = FLAVOR_ORDER.map((_, i) =>
    recentVectors.reduce((sum, v) => sum + v[i], 0) / recentVectors.length
  );

  const scored = sorted
    .filter((_, idx) => idx >= Math.min(5, sorted.length))
    .map((record) => {
      const vec = buildFlavorVector(record);
      return {
        ...record,
        similarityScore: cosineSimilarity(avgVector, vec),
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore;

  const unique = new Map<string, RecommendedRecord>();
  for (const r of scored) {
    if (!unique.has(r.coffeeName)) {
      unique.set(r.coffeeName, r);
    }
  }

  return Array.from(unique.values()).slice(0, topN);
}

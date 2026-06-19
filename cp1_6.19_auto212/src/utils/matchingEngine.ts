import type { Item, ScoreBreakdown } from '@/types';

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function termFrequency(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  return tf;
}

function cosineSimilarity(tfA: Record<string, number>, tfB: Record<string, number>): number {
  const allWords = new Set([...Object.keys(tfA), ...Object.keys(tfB)]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const word of allWords) {
    const a = tfA[word] || 0;
    const b = tfB[word] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function jaccardSimilarity<T>(a: T[], b: T[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export function calculateMatchScore(
  lostItem: Item,
  foundItem: Item
): { score: number; scoreBreakdown: ScoreBreakdown } {
  const categoryScore = lostItem.category === foundItem.category ? 40 : 0;

  const colorSimilarity = jaccardSimilarity(lostItem.colors, foundItem.colors);
  const colorScore = colorSimilarity * 30;

  const locA = lostItem.location;
  const locB = foundItem.location;
  const maxLen = Math.max(locA.length, locB.length, 1);
  const editDist = editDistance(locA, locB);
  const locationSimilarity = 1 - editDist / maxLen;
  const locationScore = locationSimilarity * 20;

  const tokensA = tokenize(lostItem.description);
  const tokensB = tokenize(foundItem.description);
  const tfA = termFrequency(tokensA);
  const tfB = termFrequency(tokensB);
  const descriptionSimilarity = cosineSimilarity(tfA, tfB);
  const descriptionScore = descriptionSimilarity * 10;

  const total = categoryScore + colorScore + locationScore + descriptionScore;

  return {
    score: Math.round(total * 100) / 100,
    scoreBreakdown: {
      category: Math.round(categoryScore * 100) / 100,
      colors: Math.round(colorScore * 100) / 100,
      location: Math.round(locationScore * 100) / 100,
      description: Math.round(descriptionScore * 100) / 100,
    },
  };
}

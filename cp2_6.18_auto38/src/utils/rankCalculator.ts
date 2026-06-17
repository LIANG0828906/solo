export interface RankItem {
  id: string;
  favorites: number;
  comments: number;
}

export interface RankResult extends RankItem {
  hotScore: number;
}

const FAVORITE_WEIGHT = 0.7;
const COMMENT_WEIGHT = 0.3;

export function calculateHotScore(item: RankItem): number {
  return item.favorites * FAVORITE_WEIGHT + item.comments * COMMENT_WEIGHT;
}

export function calculateRanking(items: RankItem[], limit: number = 20): RankResult[] {
  const startTime = performance.now();
  
  const results = items
    .map((item) => ({
      ...item,
      hotScore: calculateHotScore(item)
    }))
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, limit);

  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 50) {
    console.warn(`Ranking calculation took ${duration.toFixed(2)}ms, exceeded 50ms target`);
  }
  
  return results;
}

export function formatHotScore(score: number): string {
  return score.toFixed(1);
}

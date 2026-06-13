import { DimensionType, DIMENSION_KEYWORDS } from '@/types';

export function matchDimension(comment: string): DimensionType {
  const lowerComment = comment.toLowerCase();
  
  const matches: { dimension: DimensionType; count: number }[] = [];
  
  Object.entries(DIMENSION_KEYWORDS).forEach(([dim, keywords]) => {
    let count = 0;
    keywords.forEach((keyword) => {
      if (lowerComment.includes(keyword)) {
        count++;
      }
    });
    matches.push({ dimension: dim as DimensionType, count });
  });
  
  const sorted = matches.sort((a, b) => b.count - a.count);
  
  if (sorted[0].count > 0) {
    return sorted[0].dimension;
  }
  
  const dimensions: DimensionType[] = ['communication', 'cooperation', 'responsibility', 'innovation', 'knowledge'];
  return dimensions[Math.floor(Math.random() * dimensions.length)];
}

export function getDimensionScore(
  reviews: { score: number; comment: string }[],
  dimension: DimensionType
): number {
  const matchingReviews = reviews.filter((r) => {
    const matchedDim = matchDimension(r.comment);
    return matchedDim === dimension;
  });
  
  if (matchingReviews.length === 0) {
    return 3;
  }
  
  const sum = matchingReviews.reduce((acc, r) => acc + r.score, 0);
  return sum / matchingReviews.length;
}

export function extractTags(comment: string, dimension: DimensionType, score: number): string[] {
  const tags: string[] = [];
  const label = getDimensionLabel(dimension);
  
  if (score >= 4) {
    tags.push(`${label}-优秀`);
  } else if (score >= 3) {
    tags.push(`${label}-良好`);
  } else if (score >= 2) {
    tags.push(`${label}-一般`);
  } else {
    tags.push(`${label}-待改进`);
  }
  
  return tags;
}

export function getDimensionLabel(dimension: DimensionType): string {
  const labels: Record<DimensionType, string> = {
    communication: '沟通',
    cooperation: '合作',
    responsibility: '责任',
    innovation: '创新',
    knowledge: '知识',
  };
  return labels[dimension];
}
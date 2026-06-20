import { useMemo } from 'react';
import type { Excerpt, LinkedExcerpt, TagFrequency } from '../types';
import { calculateSimilarity } from '../utils/textSimilarity';

export function useLinkage(excerpts: Excerpt[]) {
  const tagFrequencies = useMemo((): TagFrequency[] => {
    const freqMap = new Map<string, number>();
    excerpts.forEach((e) => {
      e.tags.forEach((tag) => {
        freqMap.set(tag, (freqMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(freqMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [excerpts]);

  const getRelatedExcerpts = useMemo(() => {
    return (target: Excerpt, threshold: number = 50): LinkedExcerpt[] => {
      return excerpts
        .filter((e) => e.id !== target.id)
        .map((e) => ({
          excerpt: e,
          similarity: calculateSimilarity(target, e),
        }))
        .filter((r) => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);
    };
  }, [excerpts]);

  const maxTagFrequency = useMemo(() => {
    return tagFrequencies.length > 0 ? tagFrequencies[0].count : 1;
  }, [tagFrequencies]);

  return {
    tagFrequencies,
    maxTagFrequency,
    getRelatedExcerpts,
  };
}

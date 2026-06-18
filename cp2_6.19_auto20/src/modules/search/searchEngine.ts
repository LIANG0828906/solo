import { manualData, ManualChapter } from '../../data/manual';

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  paragraph: string;
  summary: string;
  confidence: number;
  matchCount: number;
}

interface ParagraphInfo {
  chapter: ManualChapter;
  paragraph: string;
  matchCount: number;
  matchedKeywords: string[];
}

const PARAGRAPH_SPLIT_REGEX = /[。！？.!?\n]+/;
const CHINESE_SPLIT_REGEX = /[\s,，、()（）]+/;
const MAX_RESULTS = 8;
const SUMMARY_LENGTH = 60;

function splitKeywords(query: string): string[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase().trim();
  const parts = lowerQuery.split(CHINESE_SPLIT_REGEX).filter(Boolean);
  const keywords: string[] = [];
  parts.forEach(part => {
    if (/[\u4e00-\u9fa5]/.test(part)) {
      for (let i = 0; i < part.length; i++) {
        for (let j = i + 2; j <= part.length; j++) {
          const word = part.slice(i, j);
          if (word.length >= 2) {
            keywords.push(word);
          }
        }
      }
    } else {
      if (part.length >= 2) {
        keywords.push(part);
      }
    }
  });
  const exactKeywords = parts.filter(p => p.length >= 2);
  const uniqueKeywords = [...new Set([...exactKeywords, ...keywords])];
  return uniqueKeywords.sort((a, b) => b.length - a.length);
}

function splitIntoParagraphs(text: string): string[] {
  return text.split(PARAGRAPH_SPLIT_REGEX)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function calculateConfidence(paragraphInfo: ParagraphInfo): number {
  const { paragraph, matchCount, matchedKeywords } = paragraphInfo;
  const paraLength = paragraph.length;
  const uniqueMatchCount = matchedKeywords.length;
  const lengthFactor = Math.min(1, 50 / (paraLength + 10));
  const matchDensity = (matchCount * 10) / (paraLength + 1);
  const keywordLengthBonus = matchedKeywords.reduce((sum, kw) => sum + kw.length, 0) / 10;
  const baseScore = (uniqueMatchCount * 20) + (matchCount * 5) + keywordLengthBonus;
  const adjustedScore = baseScore * (0.5 + lengthFactor * 0.5) * (0.7 + matchDensity * 0.3);
  return Math.min(99, Math.max(10, adjustedScore));
}

function sortByWeight(a: ParagraphInfo, b: ParagraphInfo): number {
  const confA = calculateConfidence(a);
  const confB = calculateConfidence(b);
  if (Math.abs(confB - confA) > 5) {
    return confB - confA;
  }
  if (b.matchedKeywords.length !== a.matchedKeywords.length) {
    return b.matchedKeywords.length - a.matchedKeywords.length;
  }
  return b.matchCount - a.matchCount;
}

export function search(query: string): SearchResult[] {
  const startTime = performance.now();
  const keywords = splitKeywords(query);
  if (keywords.length === 0) return [];
  const paragraphMatches: ParagraphInfo[] = [];
  for (const chapter of manualData) {
    const paragraphs = splitIntoParagraphs(chapter.content);
    for (const paragraph of paragraphs) {
      const lowerParagraph = paragraph.toLowerCase();
      const matchedKeywords: string[] = [];
      let matchCount = 0;
      for (const keyword of keywords) {
        if (lowerParagraph.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
          const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const matches = lowerParagraph.match(regex);
          matchCount += matches ? matches.length : 0;
        }
      }
      if (matchedKeywords.length > 0) {
        paragraphMatches.push({
          chapter,
          paragraph,
          matchCount,
          matchedKeywords
        });
      }
    }
  }
  paragraphMatches.sort(sortByWeight);
  const results = paragraphMatches.slice(0, MAX_RESULTS).map(info => {
    const confidence = calculateConfidence(info);
    return {
      chapterId: info.chapter.id,
      chapterTitle: info.chapter.title,
      paragraph: info.paragraph,
      summary: info.paragraph.length > SUMMARY_LENGTH
        ? info.paragraph.slice(0, SUMMARY_LENGTH) + '...'
        : info.paragraph,
      confidence: Math.round(confidence),
      matchCount: info.matchCount
    };
  });
  const endTime = performance.now();
  const duration = endTime - startTime;
  if (duration > 150) {
    console.warn(`Search took ${duration.toFixed(2)}ms, query: "${query}"`);
  }
  return results;
}

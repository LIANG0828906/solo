import type { Question, ScoringResult } from '@/types';

const KEYWORD_WEIGHT = 0.5;
const LENGTH_WEIGHT = 0.2;
const SEMANTIC_WEIGHT = 0.3;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function computeKeywordScore(question: Question, studentAnswer: string): number {
  if (question.keywords.length === 0) return 0;
  const lowerAnswer = studentAnswer.toLowerCase();
  let earned = 0;
  let totalPossible = 0;
  for (const kw of question.keywords) {
    totalPossible += kw.scorePoint;
    if (lowerAnswer.includes(kw.word.toLowerCase())) {
      earned += kw.scorePoint;
    }
  }
  if (totalPossible === 0) return 0;
  return earned / totalPossible;
}

function computeLengthScore(referenceAnswer: string, studentAnswer: string): number {
  const refLen = referenceAnswer.trim().length;
  const ansLen = studentAnswer.trim().length;
  if (refLen === 0) return 0;
  return Math.min(ansLen / refLen, 1.0);
}

function computeSemanticScore(referenceAnswer: string, studentAnswer: string): number {
  const refTokens = tokenize(referenceAnswer);
  const ansTokens = tokenize(studentAnswer);
  if (refTokens.length === 0 || ansTokens.length === 0) return 0;

  const allTokens = Array.from(new Set([...refTokens, ...ansTokens]));
  const refFreq = new Map<string, number>();
  const ansFreq = new Map<string, number>();

  for (const t of refTokens) refFreq.set(t, (refFreq.get(t) || 0) + 1);
  for (const t of ansTokens) ansFreq.set(t, (ansFreq.get(t) || 0) + 1);

  let dotProduct = 0;
  let refMag = 0;
  let ansMag = 0;

  for (const token of allTokens) {
    const rf = refFreq.get(token) || 0;
    const af = ansFreq.get(token) || 0;
    dotProduct += rf * af;
    refMag += rf * rf;
    ansMag += af * af;
  }

  if (refMag === 0 || ansMag === 0) return 0;
  return dotProduct / (Math.sqrt(refMag) * Math.sqrt(ansMag));
}

function generateFeedback(keywordRatio: number, lengthRatio: number, semanticRatio: number): string {
  const parts: string[] = [];
  if (keywordRatio >= 0.8) {
    parts.push('关键词覆盖完整');
  } else if (keywordRatio >= 0.5) {
    parts.push('答案包含部分关键词，但仍有遗漏');
  } else {
    parts.push('答案缺少关键要点');
  }

  if (lengthRatio >= 0.8) {
    parts.push('答案长度合理');
  } else if (lengthRatio >= 0.4) {
    parts.push('答案偏短，可补充更多细节');
  } else {
    parts.push('答案过于简短，需要详细展开');
  }

  if (semanticRatio >= 0.7) {
    parts.push('语义表达与参考答案高度吻合');
  } else if (semanticRatio >= 0.4) {
    parts.push('语义部分匹配，建议优化表述');
  } else {
    parts.push('语义与参考答案差异较大');
  }

  return parts.join('；');
}

export function scoreAnswer(question: Question, studentAnswer: string): ScoringResult {
  const keywordRatio = computeKeywordScore(question, studentAnswer);
  const lengthRatio = computeLengthScore(question.referenceAnswer, studentAnswer);
  const semanticRatio = computeSemanticScore(question.referenceAnswer, studentAnswer);

  const weightedScore =
    KEYWORD_WEIGHT * keywordRatio +
    LENGTH_WEIGHT * lengthRatio +
    SEMANTIC_WEIGHT * semanticRatio;

  const totalScore = Math.round(Math.min(weightedScore, 1.0) * question.maxScore * 10) / 10;

  return {
    totalScore: Math.max(0, totalScore),
    keywordScore: Math.round(keywordRatio * 100) / 100,
    lengthScore: Math.round(lengthRatio * 100) / 100,
    semanticScore: Math.round(semanticRatio * 100) / 100,
    feedback: generateFeedback(keywordRatio, lengthRatio, semanticRatio),
  };
}

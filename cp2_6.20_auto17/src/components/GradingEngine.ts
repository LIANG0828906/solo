import type { Question, Answer, GradingResult, ErrorType } from '../types';

function assignKeywordWeight(keyword: string, allKeywords: string[], index: number): number {
  const positionBias = 1 - (index / allKeywords.length) * 0.3;
  const lengthBias = keyword.length >= 4 ? 1.2 : 1.0;
  return positionBias * lengthBias;
}

function calculateKeywordMatch(studentAnswer: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const answerLower = studentAnswer.toLowerCase();
  let totalWeight = 0;
  let matchedWeight = 0;

  keywords.forEach((keyword, index) => {
    const weight = assignKeywordWeight(keyword, keywords, index);
    totalWeight += weight;
    if (answerLower.includes(keyword.toLowerCase())) {
      matchedWeight += weight;
    }
  });

  const strictMatch = matchedWeight / totalWeight;
  const partialMatches = keywords.filter((k) => {
    const chars = k.toLowerCase().split('');
    return chars.some((c) => answerLower.includes(c)) && answerLower.length > 10;
  }).length;
  const partialScore = keywords.length > 0 ? (partialMatches / keywords.length) * 0.15 : 0;

  return Math.min(1, strictMatch * 0.85 + partialScore);
}

function calculateLengthScore(studentAnswer: string, maxWords: number): number {
  const actualContent = studentAnswer.trim();
  if (actualContent.length === 0) return 0;
  const chineseChars = (actualContent.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherWords = actualContent.split(/\s+/).filter((w) => w.length > 0 && !/[\u4e00-\u9fa5]/.test(w)).length;
  const effectiveLength = chineseChars + otherWords;
  const ratio = effectiveLength / maxWords;

  if (ratio >= 0.9) return 1.0;
  if (ratio >= 0.75) return 0.9;
  if (ratio >= 0.6) return 0.8;
  if (ratio >= 0.45) return 0.65;
  if (ratio >= 0.3) return 0.5;
  if (ratio >= 0.15) return 0.3;
  return 0.15;
}

function calculateSemanticSimilarity(studentAnswer: string, standardAnswer: string): number {
  const answerLower = studentAnswer.toLowerCase();
  const standardLower = standardAnswer.toLowerCase();

  const standardWords = standardLower
    .replace(/[，。、；：？！\.,;:?!]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const studentWords = answerLower
    .replace(/[，。、；：？！\.,;:?!]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (standardWords.length === 0) return 0;

  let matchedScore = 0;
  standardWords.forEach((word) => {
    if (studentWords.includes(word)) {
      matchedScore += 1.0;
    } else {
      const partial = studentWords.some((sw) => {
        if (sw.length < 2 || word.length < 2) return false;
        return sw.includes(word) || word.includes(sw);
      });
      if (partial) matchedScore += 0.5;
    }
  });

  const baseSimilarity = matchedScore / standardWords.length;
  const sentenceCount = answerLower.split(/[。？！.!?]+/).filter((s) => s.trim().length > 5).length;
  const structureBonus = Math.min(0.15, sentenceCount * 0.04);

  return Math.min(1, baseSimilarity + structureBonus);
}

function calculateCoverageDiversity(studentAnswer: string, keywords: string[]): number {
  if (keywords.length === 0) return 0.5;
  const answerLower = studentAnswer.toLowerCase();
  const matchedCategories: Set<string> = new Set();

  const clusters = Math.max(1, Math.ceil(keywords.length / 3));
  for (let i = 0; i < clusters; i++) {
    const start = i * 3;
    const end = Math.min(start + 3, keywords.length);
    const cluster = keywords.slice(start, end);
    const matched = cluster.some((k) => answerLower.includes(k.toLowerCase()));
    if (matched) matchedCategories.add(`c${i}`);
  }

  return matchedCategories.size / clusters;
}

function determineErrorType(
  keywordMatch: number,
  lengthScore: number,
  semanticSimilarity: number,
  coverage: number
): ErrorType | undefined {
  if (keywordMatch < 0.35 && semanticSimilarity < 0.25) {
    return 'knowledge_gap';
  }
  if (coverage < 0.4 && keywordMatch < 0.5) {
    return 'knowledge_gap';
  }
  if (lengthScore < 0.45 && keywordMatch >= 0.4) {
    return 'unclear_expression';
  }
  if (semanticSimilarity < 0.3 && keywordMatch >= 0.35) {
    return 'misunderstanding';
  }
  if (keywordMatch >= 0.3 && semanticSimilarity < 0.35) {
    return 'misunderstanding';
  }
  return undefined;
}

function generateFeedback(score: number, errorType?: ErrorType, _metrics?: { keyword: number; length: number; semantic: number }): string {
  if (score >= 95) return '回答非常完整，逻辑清晰，知识点全面，非常优秀！';
  if (score >= 85) return '回答完整，关键点覆盖全面，逻辑顺畅，继续保持！';
  if (score >= 75) return '回答较完整，大部分关键点都有，表述基本清晰。';
  if (score >= 65) return '回答基本正确，但部分表述不够完整，有少量遗漏。';
  if (score >= 60) {
    switch (errorType) {
      case 'knowledge_gap':
        return '部分关键知识点缺失，建议复习相关章节内容。';
      case 'unclear_expression':
        return '思路基本正确但表述不够清晰，建议加强语言组织能力。';
      case 'misunderstanding':
        return '对题目有一定理解但仍有偏差，审题时建议更加仔细。';
      default:
        return '回答基本及格，仍有较大提升空间。';
    }
  }
  switch (errorType) {
    case 'knowledge_gap':
      return '重要知识点大量缺失，需要重点复习基础知识。';
    case 'unclear_expression':
      return '语言表达不清，逻辑混乱，建议多练习书面表达。';
    case 'misunderstanding':
      return '对题目理解存在较大偏差，需重新审题后结合知识点作答。';
    default:
      return '得分较低，建议系统复习相关知识后重新作答。';
  }
}

export function gradeAnswer(question: Question, answer: Answer): GradingResult {
  const studentAnswer = answer.content || '';
  const keywordMatch = calculateKeywordMatch(studentAnswer, question.keywords);
  const lengthScore = calculateLengthScore(studentAnswer, question.maxWords);
  const semanticSimilarity = calculateSemanticSimilarity(studentAnswer, question.standardAnswer);
  const coverage = calculateCoverageDiversity(studentAnswer, question.keywords);

  const hasContent = studentAnswer.trim().length > 15 ? 1 : studentAnswer.trim().length > 0 ? 0.5 : 0;

  const score = Math.round(
    keywordMatch * 40 +
    lengthScore * 18 +
    semanticSimilarity * 25 +
    coverage * 12 +
    hasContent * 5
  );

  const finalScore = Math.min(100, Math.max(0, score));
  const errorType = finalScore < 60
    ? determineErrorType(keywordMatch, lengthScore, semanticSimilarity, coverage)
    : undefined;
  const feedback = generateFeedback(finalScore, errorType, {
    keyword: keywordMatch,
    length: lengthScore,
    semantic: semanticSimilarity,
  });

  return {
    questionId: question.id,
    score: finalScore,
    feedback,
    errorType,
  };
}

export function gradeAssignment(questions: Question[], answers: Answer[]): GradingResult[] {
  return questions.map((question) => {
    const answer = answers.find((a) => a.questionId === question.id) || {
      questionId: question.id,
      content: '',
    };
    return gradeAnswer(question, answer);
  });
}

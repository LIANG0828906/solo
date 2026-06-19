import type { Question, Answer, GradingResult, ErrorType } from '../types';

interface KeywordSemanticInfo {
  isCore: boolean;
  isDefinitional: boolean;
  uniqueness: number;
  positionInStandard: number;
}

const DEFINITIONAL_MARKERS = ['是指', '定义', '称为', '叫做', '即', '表示', '是什么', '就是'];
const CORE_KEYWORD_HINTS = [
  '定理', '公式', '法则', '原则', '方法', '结构', '形式', '特点', '性质',
  '功能', '作用', '意义', '原因', '结果', '条件', '假设', '结论',
];

function analyzeKeywordSemantic(
  keyword: string,
  keywords: string[],
  standardAnswer: string
): KeywordSemanticInfo {
  const kwLower = keyword.toLowerCase();
  const stdLower = standardAnswer.toLowerCase();

  const isDefinitional = DEFINITIONAL_MARKERS.some((marker) => {
    const markerIdx = stdLower.indexOf(marker.toLowerCase());
    if (markerIdx === -1) return false;
    const nearby = stdLower.slice(
      Math.max(0, markerIdx - 30),
      Math.min(stdLower.length, markerIdx + marker.length + keyword.length + 20)
    );
    return nearby.includes(kwLower);
  });

  const isCore = CORE_KEYWORD_HINTS.some((hint) => keyword.includes(hint)) ||
    keyword.length >= 5;

  const freqInKeywords = keywords.filter((k) =>
    k.toLowerCase().includes(kwLower) || kwLower.includes(k.toLowerCase())
  ).length;
  const uniqueness = freqInKeywords <= 1 ? 1.0 : freqInKeywords <= 2 ? 0.85 : 0.7;

  const idxInStandard = stdLower.indexOf(kwLower);
  const totalLen = Math.max(1, standardAnswer.length);
  const positionInStandard = idxInStandard === -1 ? 0.5 : idxInStandard / totalLen;

  return { isCore, isDefinitional, uniqueness, positionInStandard };
}

function calculateKeywordWeight(
  keyword: string,
  keywords: string[],
  standardAnswer: string,
  globalIndex: number
): number {
  const info = analyzeKeywordSemantic(keyword, keywords, standardAnswer);

  let baseWeight = 1.0;

  if (info.isDefinitional) baseWeight *= 1.8;
  if (info.isCore) baseWeight *= 1.35;
  baseWeight *= 0.85 + info.uniqueness * 0.35;

  const positionFactor = info.positionInStandard;
  if (positionFactor < 0.15) baseWeight *= 1.25;
  else if (positionFactor < 0.4) baseWeight *= 1.1;
  else if (positionFactor > 0.85) baseWeight *= 0.9;

  const lengthFactor = keyword.length >= 6 ? 1.2 : keyword.length >= 4 ? 1.0 : 0.88;
  baseWeight *= lengthFactor;

  const globalPosFactor = 1 - (globalIndex / Math.max(1, keywords.length)) * 0.25;
  baseWeight *= globalPosFactor;

  return baseWeight;
}

interface MatchDetail {
  keyword: string;
  matched: boolean;
  exactMatch: boolean;
  weight: number;
  matchedAt?: number;
}

function calculateKeywordMatch(
  studentAnswer: string,
  keywords: string[],
  standardAnswer: string
): { score: number; details: MatchDetail[] } {
  if (keywords.length === 0) return { score: 0, details: [] };
  const answerLower = studentAnswer.toLowerCase();
  const details: MatchDetail[] = [];
  let totalWeight = 0;
  let matchedWeight = 0;

  keywords.forEach((keyword, idx) => {
    const weight = calculateKeywordWeight(keyword, keywords, standardAnswer, idx);
    totalWeight += weight;

    const kwLower = keyword.toLowerCase();
    const matchIdx = answerLower.indexOf(kwLower);

    if (matchIdx !== -1) {
      details.push({
        keyword,
        matched: true,
        exactMatch: true,
        weight,
        matchedAt: matchIdx,
      });
      matchedWeight += weight;
    } else {
      const chars = kwLower.split('').filter((c) => c.trim().length > 0);
      const charHitCount = chars.filter((c) => answerLower.includes(c)).length;
      const partialRatio = chars.length > 0 ? charHitCount / chars.length : 0;

      if (partialRatio >= 0.6 && answerLower.length >= 15) {
        details.push({
          keyword,
          matched: true,
          exactMatch: false,
          weight,
        });
        matchedWeight += weight * 0.35 * partialRatio;
      } else {
        details.push({ keyword, matched: false, exactMatch: false, weight });
      }
    }
  });

  const coverageScore = keywords.length > 0
    ? details.filter((d) => d.matched).length / keywords.length
    : 0;
  const weightedScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const score = Math.min(1, weightedScore * 0.8 + coverageScore * 0.2);

  return { score, details };
}

function calculateLengthScore(studentAnswer: string, maxWords: number): number {
  const actualContent = studentAnswer.trim();
  if (actualContent.length === 0) return 0;

  const chineseChars = (actualContent.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherWords = actualContent
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/[\u4e00-\u9fa5]/.test(w)).length;
  const effectiveLength = chineseChars + otherWords;
  const ratio = effectiveLength / maxWords;

  if (ratio >= 0.95) return 1.0;
  if (ratio >= 0.8) return 0.95;
  if (ratio >= 0.65) return 0.85;
  if (ratio >= 0.5) return 0.72;
  if (ratio >= 0.35) return 0.58;
  if (ratio >= 0.22) return 0.42;
  if (ratio >= 0.12) return 0.28;
  return 0.12;
}

function calculateSemanticSimilarity(studentAnswer: string, standardAnswer: string): number {
  const answerLower = studentAnswer.toLowerCase();
  const standardLower = standardAnswer.toLowerCase();

  if (standardLower.length === 0) return 0;

  const tokenize = (text: string) => {
    const segments: string[] = [];
    const chineseRegex = /[\u4e00-\u9fa5]{2,}|[a-zA-Z0-9_]{2,}/g;
    let match: RegExpExecArray | null;
    while ((match = chineseRegex.exec(text)) !== null) {
      segments.push(match[0]);
    }
    return segments;
  };

  const standardTokens = tokenize(standardLower);
  const studentTokens = tokenize(answerLower);

  if (standardTokens.length === 0) return 0.1;

  let score = 0;
  standardTokens.forEach((token, idx) => {
    const exactIdx = studentTokens.indexOf(token);
    if (exactIdx !== -1) {
      score += idx < standardTokens.length * 0.3 ? 1.15 : 1.0;
    } else {
      const partial = studentTokens.some((st) => {
        if (token.length < 3 || st.length < 3) return false;
        return st.includes(token) || token.includes(st);
      });
      if (partial) score += 0.45;
    }
  });

  const baseScore = score / standardTokens.length;

  const sentences = answerLower.split(/[。？！.!?]+/).filter((s) => s.trim().length >= 6);
  const structureBonus = Math.min(0.18, sentences.length * 0.05);

  return Math.min(1, baseScore + structureBonus);
}

function calculateCoverageDiversity(studentAnswer: string, keywords: string[]): number {
  if (keywords.length === 0) return 0.5;
  const answerLower = studentAnswer.toLowerCase();
  const clusters = Math.max(1, Math.ceil(keywords.length / 3));
  let matchedClusters = 0;

  for (let i = 0; i < clusters; i++) {
    const start = i * 3;
    const end = Math.min(start + 3, keywords.length);
    const cluster = keywords.slice(start, end);
    let clusterScore = 0;
    cluster.forEach((k) => {
      if (answerLower.includes(k.toLowerCase())) clusterScore++;
    });
    if (clusterScore >= Math.ceil(cluster.length * 0.4)) {
      matchedClusters++;
    }
  }

  return matchedClusters / clusters;
}

function determineErrorType(
  keywordMatch: number,
  lengthScore: number,
  semanticSimilarity: number,
  coverage: number,
  totalScore: number
): ErrorType | undefined {
  if (totalScore >= 60) return undefined;

  const criticalKeywordMissing = keywordMatch < 0.32;
  const semanticWrong = semanticSimilarity < 0.28;
  const tooShort = lengthScore < 0.4;
  const poorCoverage = coverage < 0.35;

  if (criticalKeywordMissing && semanticWrong) return 'knowledge_gap';
  if (poorCoverage && criticalKeywordMissing) return 'knowledge_gap';

  if (tooShort && keywordMatch >= 0.3 && semanticSimilarity >= 0.25) {
    return 'unclear_expression';
  }

  if (semanticWrong && keywordMatch >= 0.28) return 'misunderstanding';

  if (criticalKeywordMissing) return 'knowledge_gap';
  if (semanticWrong) return 'misunderstanding';
  if (tooShort) return 'unclear_expression';

  if (keywordMatch < 0.4) return 'knowledge_gap';
  if (semanticSimilarity < 0.3) return 'misunderstanding';
  return 'unclear_expression';
}

function generateFeedback(
  score: number,
  errorType?: ErrorType,
  details?: { keywordScore: number; lengthScore: number; semanticScore: number; coverageScore: number }
): string {
  if (score >= 95) return '回答非常完整，逻辑清晰，知识点全面，非常优秀！';
  if (score >= 85) return '回答完整，关键点覆盖全面，逻辑顺畅，继续保持！';
  if (score >= 75) return '回答较完整，大部分关键点都有，表述基本清晰。';
  if (score >= 65) return '回答基本正确，但部分表述不够完整，有少量遗漏。';
  if (score >= 60) {
    switch (errorType) {
      case 'knowledge_gap':
        return '部分关键知识点缺失，建议复习相关章节内容补充完善。';
      case 'unclear_expression':
        return '思路基本正确但表述不够清晰，建议加强语言组织与阐述能力。';
      case 'misunderstanding':
        return '对题目有一定理解但仍有偏差，审题时建议更加仔细抓核心。';
      default:
        return '回答基本及格，仍有较大提升空间，继续努力！';
    }
  }
  switch (errorType) {
    case 'knowledge_gap':
      return details && details.keywordScore < 0.3
        ? '核心关键词大量缺失，需系统复习基础知识后重新作答。'
        : '重要知识点覆盖不足，建议回顾教材重点概念和核心原理。';
    case 'unclear_expression':
      return details && details.lengthScore < 0.4
        ? '答案过于简短且表述混乱，建议展开论述、条理分明地组织内容。'
        : '语言表达不清、逻辑跳跃，建议先列提纲再逐点阐述。';
    case 'misunderstanding':
      return details && details.semanticScore < 0.3
        ? '对题目理解存在明显偏差，请重新审题后结合知识点作答。'
        : '题意理解有偏差，答题方向偏了，需要更准确地把握问题核心。';
    default:
      return '得分较低，建议梳理相关知识体系后有针对性地强化练习。';
  }
}

export function gradeAnswer(question: Question, answer: Answer): GradingResult {
  const studentAnswer = answer.content || '';
  const { score: keywordScore } = calculateKeywordMatch(
    studentAnswer,
    question.keywords,
    question.standardAnswer
  );
  const lengthScore = calculateLengthScore(studentAnswer, question.maxWords);
  const semanticScore = calculateSemanticSimilarity(studentAnswer, question.standardAnswer);
  const coverageScore = calculateCoverageDiversity(studentAnswer, question.keywords);
  const hasContent = studentAnswer.trim().length > 15 ? 1 : studentAnswer.trim().length > 0 ? 0.5 : 0;

  const score = Math.round(
    keywordScore * 38 +
    lengthScore * 17 +
    semanticScore * 26 +
    coverageScore * 14 +
    hasContent * 5
  );

  const finalScore = Math.min(100, Math.max(0, score));
  const errorType = determineErrorType(
    keywordScore,
    lengthScore,
    semanticScore,
    coverageScore,
    finalScore
  );
  const feedback = generateFeedback(finalScore, errorType, {
    keywordScore,
    lengthScore,
    semanticScore,
    coverageScore,
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

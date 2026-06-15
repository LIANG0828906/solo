export interface ScoringRuleTemplate {
  id: string;
  description: string;
  keyword: string;
  synonyms: string[];
  contentWeight: number;
  expressionWeight: number;
}

export interface ScoringPoint {
  id: string;
  description: string;
  keyword: string;
  synonyms: string[];
  contentWeight: number;
  expressionWeight: number;
  checked: boolean;
  autoMatched: boolean;
}

export interface ScoreResult {
  totalScore: number;
  contentScore: number;
  expressionScore: number;
  maxTotalScore: number;
  maxContentScore: number;
  maxExpressionScore: number;
  matchedKeywords: Array<{ pointId: string; keyword: string; occurrences: number }>;
}

export const scoringRuleBank: ScoringRuleTemplate[] = [
  {
    id: 'point-1',
    description: '观点明确，开门见山',
    keyword: '观点',
    synonyms: ['认为', '觉得', '我主张', '看法', '态度'],
    contentWeight: 25,
    expressionWeight: 15,
  },
  {
    id: 'point-2',
    description: '论据充分，举例恰当',
    keyword: '例如',
    synonyms: ['比如', '举例', '如', '案例', '譬如'],
    contentWeight: 30,
    expressionWeight: 10,
  },
  {
    id: 'point-3',
    description: '结构清晰，层次分明',
    keyword: '首先',
    synonyms: ['第一', '其次', '然后', '最后', '此外'],
    contentWeight: 20,
    expressionWeight: 20,
  },
  {
    id: 'point-4',
    description: '语言流畅，表达准确',
    keyword: '流畅',
    synonyms: ['清晰', '准确', '自然', '通顺', '逻辑'],
    contentWeight: 15,
    expressionWeight: 30,
  },
  {
    id: 'point-5',
    description: '总结到位，呼应主题',
    keyword: '总之',
    synonyms: ['综上所述', '总而言之', '所以说', '因此', '最后'],
    contentWeight: 10,
    expressionWeight: 25,
  },
];

function countKeywordOccurrences(text: string, keywords: string[]): number {
  if (!keywords.length) return 0;
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const k of keywords) {
    const lowerK = k.toLowerCase();
    let fromIndex = 0;
    while (fromIndex < lowerText.length) {
      const idx = lowerText.indexOf(lowerK, fromIndex);
      if (idx === -1) break;
      count++;
      fromIndex = idx + lowerK.length;
    }
  }
  return count;
}

function evaluateExpressionQuality(answerText: string): number {
  const len = answerText.length;
  let score = 0;
  if (len >= 80) score += 10;
  if (len >= 150) score += 10;
  if (len >= 250) score += 10;

  const punctuationMatches = answerText.match(/[。！？，、；]/g);
  const pCount = punctuationMatches ? punctuationMatches.length : 0;
  if (pCount >= 3) score += 5;
  if (pCount >= 6) score += 5;

  return Math.min(score, 30);
}

export function calculateScore(
  answerText: string,
  selectedPoints: ScoringRuleTemplate[],
  allPoints: ScoringRuleTemplate[]
): ScoreResult {
  const matchedKeywords: ScoreResult['matchedKeywords'] = [];
  let contentScore = 0;
  let expressionScore = 0;

  for (const point of selectedPoints) {
    const allKeywords = [point.keyword, ...point.synonyms];
    const occurrences = countKeywordOccurrences(answerText, allKeywords);

    matchedKeywords.push({
      pointId: point.id,
      keyword: point.keyword,
      occurrences,
    });

    const occurrenceBoost = Math.min(occurrences, 3) * 0.1 + 0.7;
    contentScore += Math.round(point.contentWeight * occurrenceBoost);
    expressionScore += Math.round(point.expressionWeight * occurrenceBoost);
  }

  const expressionBonus = evaluateExpressionQuality(answerText);
  const maxExpressionBonus = evaluateExpressionQuality('一'.repeat(500));
  const bonusRatio = maxExpressionBonus > 0 ? expressionBonus / maxExpressionBonus : 0;
  const contentMax = allPoints.reduce((s, p) => s + p.contentWeight, 0);
  const exprMax = allPoints.reduce((s, p) => s + p.expressionWeight, 0);
  expressionScore += Math.round(bonusRatio * 0.1 * exprMax);
  contentScore += Math.round(bonusRatio * 0.05 * contentMax);

  const maxContentScore = contentMax;
  const maxExpressionScore = exprMax;
  const maxTotalScore = maxContentScore + maxExpressionScore;
  const totalScore = Math.min(contentScore + expressionScore, maxTotalScore);

  return {
    totalScore,
    contentScore: Math.min(contentScore, maxContentScore),
    expressionScore: Math.min(expressionScore, maxExpressionScore),
    maxTotalScore,
    maxContentScore,
    maxExpressionScore,
    matchedKeywords,
  };
}

export function matchKeywords(answerText: string, points: ScoringRuleTemplate[]): string[] {
  const matchedIds: string[] = [];
  const lowerText = answerText.toLowerCase();
  for (const point of points) {
    const allKeywords = [point.keyword, ...point.synonyms].map((k) => k.toLowerCase());
    if (allKeywords.some((k) => lowerText.includes(k))) {
      matchedIds.push(point.id);
    }
  }
  return matchedIds;
}

export function instantiateScoringPoints(
  templates: ScoringRuleTemplate[],
  answerText: string
): ScoringPoint[] {
  const autoMatchedIds = matchKeywords(answerText, templates);
  return templates.map((t) => ({
    ...t,
    checked: autoMatchedIds.includes(t.id),
    autoMatched: autoMatchedIds.includes(t.id),
  }));
}

export function highlightKeywords(
  answerText: string,
  keywords: string[]
): { text: string; highlighted: boolean }[] {
  if (!keywords.length) return [{ text: answerText, highlighted: false }];
  const escaped = keywords
    .filter((k) => k.length > 0)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);
  if (!escaped.length) return [{ text: answerText, highlighted: false }];
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const segments: { text: string; highlighted: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(answerText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: answerText.slice(lastIndex, match.index),
        highlighted: false,
      });
    }
    segments.push({ text: match[0], highlighted: true });
    lastIndex = regex.lastIndex;
    if (match.index === regex.lastIndex) regex.lastIndex++;
  }
  if (lastIndex < answerText.length) {
    segments.push({ text: answerText.slice(lastIndex), highlighted: false });
  }
  return segments;
}

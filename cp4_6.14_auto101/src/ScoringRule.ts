export interface ScoringRuleTemplate {
  id: string;
  description: string;
  keyword: string;
  contentWeight: number;
  expressionWeight: number;
}

export interface ScoringPoint extends ScoringRuleTemplate {
  checked: boolean;
}

export interface ScoreResult {
  totalScore: number;
  contentScore: number;
  expressionScore: number;
  maxTotalScore: number;
  maxContentScore: number;
  maxExpressionScore: number;
}

export const scoringRuleBank: ScoringRuleTemplate[] = [
  {
    id: 'point-1',
    description: '观点明确，开门见山',
    keyword: '观点',
    contentWeight: 25,
    expressionWeight: 15,
  },
  {
    id: 'point-2',
    description: '论据充分，举例恰当',
    keyword: '例如',
    contentWeight: 30,
    expressionWeight: 10,
  },
  {
    id: 'point-3',
    description: '结构清晰，层次分明',
    keyword: '首先',
    contentWeight: 20,
    expressionWeight: 20,
  },
  {
    id: 'point-4',
    description: '语言流畅，表达准确',
    keyword: '流畅',
    contentWeight: 15,
    expressionWeight: 30,
  },
  {
    id: 'point-5',
    description: '总结到位，呼应主题',
    keyword: '总之',
    contentWeight: 10,
    expressionWeight: 25,
  },
];

export function calculateScore(
  _answerText: string,
  selectedPoints: ScoringRuleTemplate[],
  allPoints: ScoringRuleTemplate[]
): ScoreResult {
  const contentScore = selectedPoints.reduce((sum, p) => sum + p.contentWeight, 0);
  const expressionScore = selectedPoints.reduce((sum, p) => sum + p.expressionWeight, 0);
  const totalScore = contentScore + expressionScore;

  const maxContentScore = allPoints.reduce((sum, p) => sum + p.contentWeight, 0);
  const maxExpressionScore = allPoints.reduce((sum, p) => sum + p.expressionWeight, 0);
  const maxTotalScore = maxContentScore + maxExpressionScore;

  return {
    totalScore,
    contentScore,
    expressionScore,
    maxTotalScore,
    maxContentScore,
    maxExpressionScore,
  };
}

export function matchKeywords(answerText: string, points: ScoringRuleTemplate[]): string[] {
  const matchedIds: string[] = [];
  const lowerText = answerText.toLowerCase();
  for (const point of points) {
    if (lowerText.includes(point.keyword.toLowerCase())) {
      matchedIds.push(point.id);
    }
  }
  return matchedIds;
}

export function highlightKeywords(
  answerText: string,
  keywords: string[]
): { text: string; highlighted: boolean }[] {
  if (!keywords.length) return [{ text: answerText, highlighted: false }];

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
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
  }

  if (lastIndex < answerText.length) {
    segments.push({ text: answerText.slice(lastIndex), highlighted: false });
  }

  return segments;
}

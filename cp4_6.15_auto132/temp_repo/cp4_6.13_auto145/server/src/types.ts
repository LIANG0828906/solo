export type RuleType = 'keyword' | 'format' | 'formula';

export interface Rule {
  id: string;
  name: string;
  type: RuleType;
  pattern: string;
  weight: number;
  suggestion: string;
}

export interface ScoreResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  matchedTexts: string[];
  score: number;
  maxScore: number;
  suggestion: string;
}

export interface GradingResult {
  id: string;
  reportName: string;
  totalScore: number;
  maxScore: number;
  results: ScoreResult[];
  createdAt: string;
}

export interface HistoryRecord {
  id: string;
  reportName: string;
  totalScore: number;
  maxScore: number;
  createdAt: string;
}

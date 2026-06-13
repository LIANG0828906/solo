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
  matchPositions: Array<{ start: number; end: number }>;
  score: number;
  maxScore: number;
  suggestion: string;
}

export interface GradingResult {
  id: string;
  filename: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  results: ScoreResult[];
  timestamp: string;
}

export interface HistoryRecord {
  id: string;
  filename: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timestamp: string;
}

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
  hit: boolean;
  matches: string[];
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
